import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas_db import (
    Package, ShipmentEvent, ShipmentStatus, EventSource, ProofOfDelivery,
    DeliveryException, DeliveryAgent, Warehouse, StorageLocation, ShipmentLeg,
    AgentAssignment, CustomerContactAttempt, InvestigationTicket
)
from app.schemas.schemas_pydantic import (
    PackageOut, PackageDetailOut, ShipmentEventOut, PickupConfirmRequest,
    WarehouseReceiptRequest, WarehouseDispatchRequest, AgentAssignRequest,
    LocationUpdateRequest, DeliveryAttemptRequest, ProofOfDeliveryRequest,
    ReportNonReceiptRequest, ContactCustomerRequest
)
from app.services.event_service import record_shipment_event, ws_manager
from app.services.telephony_sandbox import TelephonySandboxService
from app.services.notification_service import NotificationService
from app.services.ai_service import AIService

router = APIRouter(prefix="/shipments", tags=["Shipments"])


def get_package_or_404(tracking_id: str, db: Session) -> Package:
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail=f"Shipment with tracking ID '{tracking_id}' was not found.")
    return package


@router.get("/{tracking_id}", response_model=PackageDetailOut)
def get_shipment(tracking_id: str, db: Session = Depends(get_db)):
    """Retrieve full package details, current state, telemetry, and proof of delivery."""
    package = get_package_or_404(tracking_id, db)
    
    # Run AI anomaly & risk evaluation on retrieval to keep risk status up-to-date
    AIService.detect_anomalies_and_classify_risk(db, package)

    cust_name = package.order.customer.name if package.order and package.order.customer else None
    cust_phone = package.order.customer.phone if package.order and package.order.customer else None
    dest_city = package.order.delivery_address.city if package.order and package.order.delivery_address else None

    return PackageDetailOut(
        id=package.id,
        tracking_id=package.tracking_id,
        order_id=package.order_id,
        weight_kg=package.weight_kg,
        dimensions=package.dimensions,
        is_fragile=package.is_fragile,
        current_status=package.current_status,
        current_risk_category=package.current_risk_category,
        risk_explanation=package.risk_explanation,
        recommended_action=package.recommended_action,
        last_known_lat=package.last_known_lat,
        last_known_lng=package.last_known_lng,
        last_known_location_name=package.last_known_location_name,
        last_location_timestamp=package.last_location_timestamp,
        is_location_verified=package.is_location_verified,
        estimated_delivery_date=package.estimated_delivery_date,
        created_at=package.created_at,
        updated_at=package.updated_at,
        events=package.events,
        proof_of_delivery=package.proof_of_delivery,
        customer_name=cust_name,
        customer_phone=cust_phone,
        destination_city=dest_city,
        delivery_otp_required=True
    )


@router.get("/{tracking_id}/timeline", response_model=List[ShipmentEventOut])
def get_shipment_timeline(tracking_id: str, db: Session = Depends(get_db)):
    """Retrieve the immutable, timestamped event history of the shipment."""
    package = get_package_or_404(tracking_id, db)
    return package.events


@router.post("/{tracking_id}/pickup", response_model=ShipmentEventOut)
async def confirm_pickup(
    tracking_id: str,
    payload: PickupConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 2: Package Preparation & Collection
    - Validates pickup agent assignment and OTP or barcode verification
    - Transitions status to PICKED_UP
    """
    package = get_package_or_404(tracking_id, db)

    # Validate OTP if provided
    if payload.pickup_otp and package.pickup_otp and payload.pickup_otp != package.pickup_otp:
        raise HTTPException(status_code=400, detail="Invalid Pickup OTP. Handover denied.")

    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.PICKED_UP,
        event_type="PACKAGE_COLLECTED",
        description=f"Package collected by pickup agent {payload.pickup_agent_id}. Condition: {payload.condition_notes}.",
        actor_id=payload.pickup_agent_id,
        latitude=payload.latitude or package.last_known_lat,
        longitude=payload.longitude or package.last_known_lng,
        location_name="Origin Merchant / Pickup Facility",
        source=EventSource.BARCODE_SCAN if payload.scanned_barcode else EventSource.QR_SCAN,
        is_verified=True,
        proof_reference=payload.scanned_barcode or "OTP_VERIFIED"
    )

    # Next state is transit to warehouse
    package.current_status = ShipmentStatus.IN_TRANSIT_TO_WAREHOUSE
    db.commit()

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "PICKED_UP",
        "status": package.current_status.value,
        "message": event.description
    })

    return event


@router.post("/{tracking_id}/warehouse-receipt", response_model=ShipmentEventOut)
async def warehouse_receipt(
    tracking_id: str,
    payload: WarehouseReceiptRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 3: Warehouse Entry & Inventory Registration
    - Records arrival scan, warehouse ID, and storage bin
    - Transitions to RECEIVED_AT_WAREHOUSE
    """
    package = get_package_or_404(tracking_id, db)

    # Resolve warehouse
    warehouse = db.query(Warehouse).filter(Warehouse.warehouse_code == payload.warehouse_code).first()
    if not warehouse:
        warehouse = Warehouse(
            warehouse_code=payload.warehouse_code,
            name=f"Hub {payload.warehouse_code}",
            address="100 Logistics Expressway",
            city="Distribution City",
            state="CA",
            postal_code="94105",
            latitude=payload.latitude or 37.7749,
            longitude=payload.longitude or -122.4194
        )
        db.add(warehouse)
        db.commit()
        db.refresh(warehouse)

    package.current_warehouse_id = warehouse.id

    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.RECEIVED_AT_WAREHOUSE,
        event_type="WAREHOUSE_CHECKIN",
        description=f"Package scanned into {warehouse.name}. Stored at bin [{payload.storage_bin}]. {payload.condition_notes}",
        actor_id=f"WH-AGENT-{warehouse.warehouse_code}",
        facility_id=warehouse.warehouse_code,
        latitude=warehouse.latitude,
        longitude=warehouse.longitude,
        location_name=f"{warehouse.name}, {warehouse.city}",
        source=EventSource.BARCODE_SCAN,
        is_verified=True,
        proof_reference=payload.scanned_barcode
    )

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "WAREHOUSE_CHECKIN",
        "status": package.current_status.value,
        "message": event.description
    })

    return event


@router.post("/{tracking_id}/dispatch", response_model=ShipmentEventOut)
async def dispatch_package(
    tracking_id: str,
    payload: WarehouseDispatchRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 4: Warehouse Processing & Inter-Facility Dispatch
    - Sorts package and initiates line-haul transit leg
    - Transitions to DISPATCHED / IN_TRANSIT
    """
    package = get_package_or_404(tracking_id, db)

    # Record transit leg
    leg = ShipmentLeg(
        package_id=package.id,
        sequence=len(package.legs) + 1,
        origin_name=f"Warehouse {payload.warehouse_code}",
        origin_lat=package.last_known_lat,
        origin_lng=package.last_known_lng,
        destination_name=payload.next_destination,
        carrier_name=payload.carrier_name,
        status="IN_TRANSIT",
        dispatched_at=datetime.now(timezone.utc)
    )
    db.add(leg)
    db.commit()

    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.IN_TRANSIT,
        event_type="DISPATCHED_IN_TRANSIT",
        description=f"Package dispatched from {payload.warehouse_code} toward {payload.next_destination} via {payload.carrier_name}.",
        actor_id="DISPATCH_SUPERVISOR",
        facility_id=payload.warehouse_code,
        latitude=package.last_known_lat,
        longitude=package.last_known_lng,
        location_name=f"Departed {payload.warehouse_code}",
        source=EventSource.BARCODE_SCAN,
        is_verified=True
    )

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "DISPATCHED",
        "status": package.current_status.value,
        "message": event.description
    })

    return event


@router.post("/{tracking_id}/assign-agent", response_model=ShipmentEventOut)
async def assign_delivery_agent(
    tracking_id: str,
    payload: AgentAssignRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 5: Delivery-Agent Assignment & Handover
    - Assigns shipment to delivery agent
    - Requires physical scan handover confirmation
    - Transitions status to OUT_FOR_DELIVERY
    """
    package = get_package_or_404(tracking_id, db)
    agent = db.query(DeliveryAgent).filter(DeliveryAgent.id == payload.agent_id).first()
    if not agent:
        # Fallback create a demo agent
        agent = DeliveryAgent(
            agent_code=f"AGT-{payload.agent_id:03d}",
            name=f"Driver Agent #{payload.agent_id}",
            phone="+1 (555) 018-7241",
            service_zone="Metro Area"
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)

    package.current_delivery_agent_id = agent.id

    assignment = AgentAssignment(
        package_id=package.id,
        agent_id=agent.id,
        assigned_at=datetime.now(timezone.utc),
        handover_scan_confirmed=True,
        handover_timestamp=datetime.now(timezone.utc),
        status="IN_DELIVERY"
    )
    db.add(assignment)
    db.commit()

    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.OUT_FOR_DELIVERY,
        event_type="OUT_FOR_DELIVERY",
        description=f"Assigned and handed over to delivery courier {agent.name} ({payload.vehicle_info}). Out for final delivery.",
        actor_id=agent.agent_code,
        facility_id=payload.dispatch_location,
        latitude=payload.latitude or package.last_known_lat,
        longitude=payload.longitude or package.last_known_lng,
        location_name=payload.dispatch_location,
        source=EventSource.BARCODE_SCAN,
        is_verified=True,
        proof_reference=f"HANDOVER-{agent.agent_code}"
    )

    # Customer notification
    if package.order and package.order.customer:
        NotificationService.send_notification(
            db=db,
            recipient=package.order.customer.phone,
            channel="SMS",
            event_type="OUT_FOR_DELIVERY",
            subject="Shipment Out for Delivery",
            body=f"TrackFlow AI: Your package {package.tracking_id} is out for delivery with {agent.name}! Share OTP {package.delivery_otp} upon arrival.",
            idempotency_key=f"NOTIF-OFD-{package.id}"
        )

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "OUT_FOR_DELIVERY",
        "status": package.current_status.value,
        "agent": agent.name,
        "message": event.description
    })

    return event


@router.post("/{tracking_id}/location", response_model=ShipmentEventOut)
async def update_location(
    tracking_id: str,
    payload: LocationUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 6: Last-Mile GPS Tracking Update
    - Records verified telemetry or simulated GPS device location
    - Distinguishes between last known vs verified current location
    """
    package = get_package_or_404(tracking_id, db)

    event = record_shipment_event(
        db=db,
        package=package,
        new_status=package.current_status,
        event_type="GPS_LOCATION_PING",
        description=f"GPS telemetry received at [{payload.latitude:.5f}, {payload.longitude:.5f}]. Speed: {payload.speed_kmh} km/h.",
        actor_id=f"AGENT-{package.current_delivery_agent_id or 'FLEET'}",
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_name=payload.location_name or "Last-Mile Delivery Route",
        source=payload.source,
        is_verified=payload.is_verified,
        proof_reference=f"GPS-{datetime.now(timezone.utc).timestamp()}"
    )

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "LOCATION_UPDATE",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "timestamp": event.timestamp.isoformat()
    })

    return event


@router.post("/{tracking_id}/proof-of-delivery", response_model=ShipmentEventOut)
async def submit_proof_of_delivery(
    tracking_id: str,
    payload: ProofOfDeliveryRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 7: Delivery Verification & Proof of Delivery (POD)
    - Enforces verification rules (Customer OTP match, signature, or photo)
    - Never marks DELIVERED without validated proof
    - Emits confirmation notifications
    """
    package = get_package_or_404(tracking_id, db)

    # Strict Validation: If OTP is required, check match
    otp_matched = True
    if payload.verification_type == "OTP":
        if not payload.otp_code or payload.otp_code != package.delivery_otp:
            raise HTTPException(
                status_code=400,
                detail="Proof of Delivery rejected: Provided customer OTP does not match records."
            )
        otp_matched = True

    # Record Proof of Delivery
    pod = ProofOfDelivery(
        package_id=package.id,
        recipient_name=payload.recipient_name,
        delivered_at=datetime.now(timezone.utc),
        verification_type=payload.verification_type,
        otp_code_matched=otp_matched,
        signature_svg_or_url=payload.signature_data,
        photo_evidence_url=payload.photo_url,
        delivery_latitude=payload.latitude or package.last_known_lat,
        delivery_longitude=payload.longitude or package.last_known_lng,
        delivery_agent_id=package.current_delivery_agent_id,
        notes=payload.notes,
        customer_confirmed_receipt=True,
        customer_reported_non_receipt=False
    )
    db.add(pod)
    db.commit()

    # Immutable event
    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.DELIVERED,
        event_type="PACKAGE_DELIVERED",
        description=f"Package securely delivered to {payload.recipient_name} via {payload.verification_type} verification.",
        actor_id=f"AGENT-{package.current_delivery_agent_id or 'DRIVER'}",
        latitude=payload.latitude or package.last_known_lat,
        longitude=payload.longitude or package.last_known_lng,
        location_name="Customer Delivery Address",
        source=EventSource.SYSTEM_AUTOMATION,
        is_verified=True,
        proof_reference=f"POD-REC-{pod.id}"
    )

    if package.order and package.order.customer:
        NotificationService.send_notification(
            db=db,
            recipient=package.order.customer.email,
            channel="EMAIL",
            event_type="DELIVERY_SUCCESS",
            subject="Shipment Delivered Successfully!",
            body=f"TrackFlow AI: Package {package.tracking_id} was successfully delivered to {payload.recipient_name}. Thank you!",
            idempotency_key=f"NOTIF-DELIVERED-{package.id}"
        )

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "DELIVERED",
        "status": ShipmentStatus.DELIVERED.value,
        "recipient": payload.recipient_name,
        "message": event.description
    })

    return event


@router.post("/{tracking_id}/delivery-attempt", response_model=ShipmentEventOut)
async def record_delivery_attempt_exception(
    tracking_id: str,
    payload: DeliveryAttemptRequest,
    db: Session = Depends(get_db)
):
    """
    Stage 8: Failed Delivery & Delivery Exception Handling
    - Transitions package to DELIVERY_EXCEPTION
    - Creates exception record
    - Automatically initiates authorized telephony customer contact workflow
    """
    package = get_package_or_404(tracking_id, db)

    # 1. Record Exception
    exception_record = DeliveryException(
        package_id=package.id,
        reason_code=payload.reason_code,
        reason_description=payload.description,
        agent_id=package.current_delivery_agent_id,
        occurred_at=datetime.now(timezone.utc),
        attempt_number=len(package.exceptions) + 1,
        location_lat=payload.latitude or package.last_known_lat,
        location_lng=payload.longitude or package.last_known_lng
    )
    db.add(exception_record)
    db.commit()

    # 2. Immutable Event
    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.DELIVERY_EXCEPTION,
        event_type="DELIVERY_EXCEPTION",
        description=f"Delivery attempt #{exception_record.attempt_number} unsuccessful: [{payload.reason_code}] - {payload.description}",
        actor_id=f"AGENT-{package.current_delivery_agent_id or 'DRIVER'}",
        latitude=payload.latitude or package.last_known_lat,
        longitude=payload.longitude or package.last_known_lng,
        location_name="Delivery Destination",
        source=EventSource.SYSTEM_AUTOMATION,
        is_verified=True,
        exception_code=payload.reason_code
    )

    # 3. Automated Customer Contact Workflow
    if payload.trigger_customer_contact and package.order and package.order.customer:
        TelephonySandboxService.initiate_call(
            db=db,
            package=package,
            customer_phone=package.order.customer.phone,
            reason=f"Failed delivery attempt: {payload.description}"
        )

    # 4. Create an investigation ticket if 2nd or higher attempt
    if len(package.exceptions) >= 2:
        ticket = InvestigationTicket(
            ticket_number=f"TKT-{random.randint(100000, 999999)}",
            package_id=package.id,
            reason=f"Repeated delivery failure ({len(package.exceptions)} attempts): {payload.reason_code}",
            severity="HIGH",
            status="OPEN",
            assigned_team="Customer Escalations"
        )
        db.add(ticket)
        db.commit()

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "EXCEPTION",
        "status": ShipmentStatus.DELIVERY_EXCEPTION.value,
        "reason": payload.reason_code,
        "message": event.description
    })

    return event


@router.post("/{tracking_id}/report-non-receipt", response_model=ShipmentEventOut)
def report_non_receipt(
    tracking_id: str,
    payload: ReportNonReceiptRequest,
    db: Session = Depends(get_db)
):
    """
    Allows customer to report non-receipt even if marked DELIVERED.
    Creates an investigation ticket and marks POD as disputed.
    """
    package = get_package_or_404(tracking_id, db)
    if package.proof_of_delivery:
        package.proof_of_delivery.customer_reported_non_receipt = True
        package.proof_of_delivery.non_receipt_reason = f"{payload.reason}. Notes: {payload.additional_details or ''}"
        db.commit()

    # Create investigation ticket
    ticket = InvestigationTicket(
        ticket_number=f"TKT-{random.randint(100000, 999999)}",
        package_id=package.id,
        reason=f"Customer Disputed Delivery / Non-Receipt: {payload.reason}",
        severity="CRITICAL",
        status="OPEN",
        assigned_team="Fraud & Last-Mile Investigation"
    )
    db.add(ticket)
    db.commit()

    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.UNDER_INVESTIGATION,
        event_type="NON_RECEIPT_REPORTED",
        description=f"Recipient reported non-receipt. Reason: {payload.reason}. Investigation Ticket #{ticket.ticket_number} created.",
        actor_id="CUSTOMER",
        source=EventSource.MANUAL_ENTRY,
        is_verified=True,
        proof_reference=ticket.ticket_number
    )

    return event


@router.post("/{tracking_id}/contact-customer")
def contact_customer_manually(
    tracking_id: str,
    payload: ContactCustomerRequest,
    db: Session = Depends(get_db)
):
    """Manually initiate an authorized voice call or SMS to customer from dashboard."""
    package = get_package_or_404(tracking_id, db)
    if not package.order or not package.order.customer:
        raise HTTPException(status_code=400, detail="No customer contact information associated with this shipment.")

    phone = package.order.customer.phone
    if payload.channel == "TELEPHONY_CALL":
        attempt = TelephonySandboxService.initiate_call(
            db=db,
            package=package,
            customer_phone=phone,
            reason=payload.reason,
            custom_instructions=payload.custom_message
        )
    else:
        attempt = TelephonySandboxService.send_sms(
            db=db,
            package=package,
            customer_phone=phone,
            message=payload.custom_message or f"TrackFlow AI notice for {tracking_id}: {payload.reason}"
        )

    return {
        "status": "SUCCESS",
        "attempt_id": attempt.id,
        "channel": attempt.channel,
        "call_status": attempt.status,
        "customer_response": attempt.customer_response,
        "transcript": attempt.simulated_transcript
    }
