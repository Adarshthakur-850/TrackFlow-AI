import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas_db import (
    Warehouse, DeliveryAgent, Vehicle, Package, Order, Customer, Address,
    ShipmentStatus, RiskCategory, EventSource, ProofOfDelivery, DeliveryException,
    InvestigationTicket
)
from app.services.event_service import record_shipment_event, ws_manager
from app.services.telephony_sandbox import TelephonySandboxService
from app.services.ai_service import AIService

router = APIRouter(prefix="/simulation", tags=["Simulation & Sandbox Lab"])


@router.post("/seed-demo-data")
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Populates database with realistic logistics entities, hubs, agents,
    and a fleet of active shipments in various lifecycle stages.
    """
    # 1. Seed Warehouses
    wh_data = [
        {"code": "WH-SFO-01", "name": "San Francisco Fulfillment Mega-Hub", "address": "900 16th Street", "city": "San Francisco", "state": "CA", "zip": "94107", "lat": 37.7661, "lng": -122.3962},
        {"code": "WH-OAK-02", "name": "Oakland East Bay Distribution Center", "address": "1200 Maritime St", "city": "Oakland", "state": "CA", "zip": "94607", "lat": 37.8105, "lng": -122.3020},
        {"code": "WH-SJC-03", "name": "Silicon Valley South Hub", "address": "2500 Technology Dr", "city": "San Jose", "state": "CA", "zip": "95110", "lat": 37.3688, "lng": -121.9299}
    ]
    for w in wh_data:
        existing = db.query(Warehouse).filter(Warehouse.warehouse_code == w["code"]).first()
        if not existing:
            wh = Warehouse(
                warehouse_code=w["code"], name=w["name"], address=w["address"],
                city=w["city"], state=w["state"], postal_code=w["zip"],
                latitude=w["lat"], longitude=w["lng"], capacity=10000, current_occupancy=4200
            )
            db.add(wh)
    db.commit()

    # 2. Seed Vehicles & Agents
    vehicles = [
        {"plate": "CA-7TF901", "type": "Electric Van", "cap": 600.0},
        {"plate": "CA-8TF412", "type": "Cargo Sprinter", "cap": 1200.0},
        {"plate": "CA-9TF334", "type": "Eco Delivery Bike", "cap": 80.0}
    ]
    v_objs = []
    for v in vehicles:
        veh = db.query(Vehicle).filter(Vehicle.license_plate == v["plate"]).first()
        if not veh:
            veh = Vehicle(license_plate=v["plate"], vehicle_type=v["type"], capacity_kg=v["cap"])
            db.add(veh)
            db.commit()
            db.refresh(veh)
        v_objs.append(veh)

    agents = [
        {"code": "AGT-101", "name": "Alex Mercer", "phone": "+1 (555) 234-8891", "zone": "San Francisco Downtown", "veh": v_objs[0].id},
        {"code": "AGT-102", "name": "Elena Rostova", "phone": "+1 (555) 789-1122", "zone": "Oakland & Berkeley", "veh": v_objs[1].id},
        {"code": "AGT-103", "name": "Marcus Chen", "phone": "+1 (555) 456-3377", "zone": "Palo Alto & San Jose", "veh": v_objs[2].id}
    ]
    for a in agents:
        existing = db.query(DeliveryAgent).filter(DeliveryAgent.agent_code == a["code"]).first()
        if not existing:
            da = DeliveryAgent(
                agent_code=a["code"], name=a["name"], phone=a["phone"],
                service_zone=a["zone"], vehicle_id=a["veh"],
                current_latitude=37.7749, current_longitude=-122.4194, is_available=True
            )
            db.add(da)
    db.commit()

    # 3. Seed Demo Packages (Idempotent per package)
    now = datetime.now(timezone.utc)
    wh_sfo = db.query(Warehouse).filter(Warehouse.warehouse_code == "WH-SFO-01").first()
    agent_alex = db.query(DeliveryAgent).filter(DeliveryAgent.agent_code == "AGT-101").first()

    demo_cases = [
        {
            "tracking": "TRK-20261020-1001",
            "customer": "Sarah Connor",
            "email": "sarah@cyberdyne.io",
            "phone": "+1 (555) 901-2244",
            "item": "Industrial Robotics Sensor Kit",
            "status": ShipmentStatus.OUT_FOR_DELIVERY,
            "lat": 37.7792,
            "lng": -122.4175,
            "loc": "Market St & 5th Ave",
            "risk": RiskCategory.NORMAL,
            "agent_id": agent_alex.id if agent_alex else None,
            "wh_id": wh_sfo.id if wh_sfo else None
        },
        {
            "tracking": "TRK-20261020-1002",
            "customer": "David Bowman",
            "email": "david@discovery-one.org",
            "phone": "+1 (555) 345-6677",
            "item": "Optical Lidar Array",
            "status": ShipmentStatus.IN_TRANSIT,
            "lat": 37.8044,
            "lng": -122.2712,
            "loc": "I-80 Westbound Freight Corridor",
            "risk": RiskCategory.AT_RISK,
            "risk_exp": "Severe traffic congestion in East Bay; ML delay probability 78%.",
            "agent_id": None,
            "wh_id": wh_sfo.id if wh_sfo else None
        },
        {
            "tracking": "TRK-20261020-1003",
            "customer": "Rachel Tyrell",
            "email": "rachel@tyrellcorp.net",
            "phone": "+1 (555) 123-9988",
            "item": "Medical Diagnostic Terminal",
            "status": ShipmentStatus.DELIVERY_EXCEPTION,
            "lat": 37.7858,
            "lng": -122.4065,
            "loc": "Mission District Logistics Drop",
            "risk": RiskCategory.DELIVERY_FAILED,
            "risk_exp": "Customer unreachable at gate code; auto-telephony call scheduled.",
            "agent_id": agent_alex.id if agent_alex else None,
            "wh_id": wh_sfo.id if wh_sfo else None
        }
    ]

    for demo in demo_cases:
        existing_pkg = db.query(Package).filter(Package.tracking_id == demo["tracking"]).first()
        if existing_pkg:
            continue

        cust = Customer(
            customer_code=f"CUST-{random.randint(1000, 9999)}",
            name=demo["customer"],
            email=demo["email"],
            phone=demo["phone"]
        )
        db.add(cust)
        db.commit()
        db.refresh(cust)

        addr = Address(
            street_address="450 Howard Street",
            city="San Francisco",
            state="CA",
            postal_code="94105",
            latitude=demo["lat"],
            longitude=demo["lng"]
        )
        db.add(addr)
        db.commit()
        db.refresh(addr)

        ord_obj = Order(
            order_number=f"ORD-{demo['tracking'].split('-')[-1]}",
            customer_id=cust.id,
            delivery_address_id=addr.id,
            item_description=demo["item"],
            total_amount=249.99,
            order_timestamp=now - timedelta(hours=12)
        )
        db.add(ord_obj)
        db.commit()
        db.refresh(ord_obj)

        pkg = Package(
            tracking_id=demo["tracking"],
            order_id=ord_obj.id,
            weight_kg=2.5,
            dimensions="30x20x15 cm",
            current_status=demo["status"],
            current_risk_category=demo["risk"],
            risk_explanation=demo.get("risk_exp"),
            last_known_lat=demo["lat"],
            last_known_lng=demo["lng"],
            last_known_location_name=demo["loc"],
            last_location_timestamp=now,
            estimated_delivery_date=now + timedelta(hours=4),
            pickup_otp="4321",
            delivery_otp="882194",
            current_warehouse_id=demo.get("wh_id"),
            current_delivery_agent_id=demo.get("agent_id")
        )
        db.add(pkg)
        db.commit()
        db.refresh(pkg)

        # Record progressive historical events
        record_shipment_event(
            db=db,
            package=pkg,
            new_status=ShipmentStatus.ORDER_PLACED,
            event_type="ORDER_PLACED",
            description=f"Order {ord_obj.order_number} confirmed. Secure Delivery OTP: 882194.",
            timestamp=now - timedelta(hours=10),
            source=EventSource.SYSTEM_AUTOMATION
        )

        record_shipment_event(
            db=db,
            package=pkg,
            new_status=ShipmentStatus.PICKED_UP,
            event_type="PACKAGE_COLLECTED",
            description="Collected from merchant facility. Security barcode scan validated.",
            timestamp=now - timedelta(hours=8),
            source=EventSource.BARCODE_SCAN
        )

        record_shipment_event(
            db=db,
            package=pkg,
            new_status=ShipmentStatus.RECEIVED_AT_WAREHOUSE,
            event_type="WAREHOUSE_CHECKIN",
            description="Inbound scan completed at San Francisco Fulfillment Mega-Hub. Stored in Bin [ZONE-A-04].",
            timestamp=now - timedelta(hours=5),
            facility_id="WH-SFO-01",
            source=EventSource.BARCODE_SCAN
        )

        if demo["status"] in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERY_EXCEPTION]:
            record_shipment_event(
                db=db,
                package=pkg,
                new_status=ShipmentStatus.IN_TRANSIT,
                event_type="DISPATCHED_IN_TRANSIT",
                description="Departed freight depot on line-haul delivery route.",
                timestamp=now - timedelta(hours=3),
                source=EventSource.GPS_DEVICE
            )

        if demo["status"] in [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERY_EXCEPTION]:
            record_shipment_event(
                db=db,
                package=pkg,
                new_status=ShipmentStatus.OUT_FOR_DELIVERY,
                event_type="OUT_FOR_DELIVERY",
                description="Handed over to courier Alex Mercer (Van #CA-7TF901). Out for final delivery.",
                timestamp=now - timedelta(hours=1),
                actor_id="AGT-101",
                latitude=demo["lat"],
                longitude=demo["lng"],
                location_name=demo["loc"],
                source=EventSource.BARCODE_SCAN
            )

        if demo["status"] == ShipmentStatus.DELIVERY_EXCEPTION:
            exc = DeliveryException(
                package_id=pkg.id,
                reason_code="SECURITY_GATE_LOCKED",
                reason_description="Security gate locked; intercom unresponsive; call box code needed.",
                occurred_at=now - timedelta(minutes=20),
                attempt_number=1,
                location_lat=demo["lat"],
                location_lng=demo["lng"]
            )
            db.add(exc)
            db.commit()

            record_shipment_event(
                db=db,
                package=pkg,
                new_status=ShipmentStatus.DELIVERY_EXCEPTION,
                event_type="DELIVERY_EXCEPTION",
                description="Delivery attempt #1 failed: Security gate locked. Intercom unresponsive.",
                timestamp=now - timedelta(minutes=20),
                actor_id="AGT-101",
                exception_code="SECURITY_GATE_LOCKED",
                source=EventSource.SYSTEM_AUTOMATION
            )

            # Record customer contact call
            TelephonySandboxService.initiate_call(
                db=db,
                package=pkg,
                customer_phone=demo["phone"],
                reason="Security gate locked at delivery destination."
            )

    return {
        "status": "SUCCESS",
        "message": "Demo hubs, agents, vehicles, and active shipments initialized."
    }


@router.post("/simulate-full-journey/{tracking_id}")
async def simulate_full_journey(tracking_id: str, db: Session = Depends(get_db)):
    """
    Simulates stages 2 to 7 sequentially:
    Pickup -> In Transit to Warehouse -> Warehouse Entry & Sort -> Dispatch -> Out for Delivery -> POD Delivered.
    """
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Step 1: Pickup
    record_shipment_event(
        db=db, package=package, new_status=ShipmentStatus.PICKED_UP,
        event_type="PACKAGE_COLLECTED", description="[SIMULATION] Collected by pickup courier from merchant origin.",
        location_name="Origin Depot", source=EventSource.BARCODE_SCAN
    )

    # Step 2: Warehouse Checkin
    wh = db.query(Warehouse).first()
    record_shipment_event(
        db=db, package=package, new_status=ShipmentStatus.RECEIVED_AT_WAREHOUSE,
        event_type="WAREHOUSE_CHECKIN", description=f"[SIMULATION] Received at {wh.name if wh else 'Central Hub'}. Sorted to Bin A-14.",
        facility_id=wh.warehouse_code if wh else "WH-01",
        latitude=wh.latitude if wh else 37.7661, longitude=wh.longitude if wh else -122.3962,
        location_name=wh.name if wh else "Central Hub", source=EventSource.BARCODE_SCAN
    )

    # Step 3: Dispatch
    record_shipment_event(
        db=db, package=package, new_status=ShipmentStatus.IN_TRANSIT,
        event_type="DISPATCHED_IN_TRANSIT", description="[SIMULATION] Line-haul truck departure toward destination delivery center.",
        location_name="Highway 101 Logistics Corridor", source=EventSource.GPS_DEVICE
    )

    # Step 4: Out for Delivery
    agent = db.query(DeliveryAgent).first()
    record_shipment_event(
        db=db, package=package, new_status=ShipmentStatus.OUT_FOR_DELIVERY,
        event_type="OUT_FOR_DELIVERY", description=f"[SIMULATION] Loaded onto delivery vehicle with courier {agent.name if agent else 'Driver'}.",
        actor_id=agent.agent_code if agent else "AGT-101",
        latitude=37.7812, longitude=-122.4110, location_name="Downtown Delivery Sector",
        source=EventSource.BARCODE_SCAN
    )

    # Step 5: Deliver with Proof of Delivery
    pod = ProofOfDelivery(
        package_id=package.id,
        recipient_name=package.order.customer.name if package.order and package.order.customer else "Authorized Recipient",
        delivered_at=datetime.now(timezone.utc),
        verification_type="OTP",
        otp_code_matched=True,
        delivery_latitude=37.7850,
        delivery_longitude=-122.4080,
        customer_confirmed_receipt=True
    )
    db.add(pod)
    db.commit()

    record_shipment_event(
        db=db, package=package, new_status=ShipmentStatus.DELIVERED,
        event_type="PACKAGE_DELIVERED", description="[SIMULATION] Package verified and delivered with OTP match.",
        latitude=37.7850, longitude=-122.4080, location_name="Customer Address",
        source=EventSource.SYSTEM_AUTOMATION, proof_reference=f"POD-SIM-{pod.id}"
    )

    # Refresh AI risk to Normal
    AIService.detect_anomalies_and_classify_risk(db, package)

    await ws_manager.broadcast_tracking(tracking_id, {
        "event": "SIMULATION_COMPLETE",
        "status": ShipmentStatus.DELIVERED.value,
        "message": "Full shipment simulation reached verified delivery."
    })

    return {"status": "SUCCESS", "message": f"Full lifecycle simulated for {tracking_id}."}


@router.post("/inject-stale-scan/{tracking_id}")
def inject_stale_scan(tracking_id: str, db: Session = Depends(get_db)):
    """Rewinds last location timestamp by 6.5 hours to simulate telemetry outage."""
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    stale_time = datetime.now(timezone.utc) - timedelta(hours=6, minutes=30)
    package.last_location_timestamp = stale_time
    package.current_status = ShipmentStatus.IN_TRANSIT
    db.commit()

    # Run AI evaluation
    result = AIService.detect_anomalies_and_classify_risk(db, package)

    return {
        "status": "STALE_TELEMETRY_INJECTED",
        "tracking_id": tracking_id,
        "risk_category": result["risk_category"],
        "explanation": result["explanation"],
        "recommended_action": result["recommended_action"]
    }


@router.post("/inject-delivery-exception/{tracking_id}")
def inject_delivery_exception(tracking_id: str, db: Session = Depends(get_db)):
    """Simulates delivery agent arriving at locked gate, failed attempt, and automated phone call."""
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # 1. Add exception
    exc = DeliveryException(
        package_id=package.id,
        reason_code="GATE_ACCESS_DENIED",
        reason_description="Security gate locked; intercom unresponsive; call box code needed.",
        occurred_at=datetime.now(timezone.utc),
        attempt_number=len(package.exceptions) + 1,
        location_lat=package.last_known_lat,
        location_lng=package.last_known_lng
    )
    db.add(exc)
    db.commit()

    # 2. Immutable event
    record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.DELIVERY_EXCEPTION,
        event_type="DELIVERY_EXCEPTION",
        description="Delivery Exception: Security gate locked. Recipient intercom unanswered.",
        exception_code="GATE_ACCESS_DENIED"
    )

    # 3. Trigger telephony call sandbox
    phone = package.order.customer.phone if package.order and package.order.customer else "+1 (555) 901-2244"
    call_attempt = TelephonySandboxService.initiate_call(
        db=db,
        package=package,
        customer_phone=phone,
        reason="Courier arrived but security gate was locked."
    )

    result = AIService.detect_anomalies_and_classify_risk(db, package)

    return {
        "status": "EXCEPTION_INJECTED",
        "tracking_id": tracking_id,
        "risk_category": result["risk_category"],
        "call_attempt_id": call_attempt.id,
        "customer_transcript": call_attempt.simulated_transcript,
        "customer_response": call_attempt.customer_response
    }
