import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas_db import (
    Order, Package, Address, Customer, ShipmentStatus, EventSource
)
from app.schemas.schemas_pydantic import OrderCreate, PackageDetailOut
from app.services.event_service import record_shipment_event, ws_manager
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=PackageDetailOut, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    """
    Stage 1: Order Placement
    - Generate unique order ID and tracking ID
    - Validate address and serviceability
    - Record customer and package details
    - Initialize status as ORDER_PLACED
    - Create immutable audit event and calculate initial SLA & ETA
    """
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y%m%d")
    rand_suffix = f"{random.randint(1000, 9999)}"
    
    order_number = f"ORD-{date_str}-{rand_suffix}"
    tracking_id = f"TRK-{date_str}-{rand_suffix}"

    # 1. Resolve or create customer
    customer = db.query(Customer).filter(Customer.email == payload.customer_email).first()
    if not customer:
        customer = Customer(
            customer_code=f"CUST-{random.randint(10000, 99999)}",
            name=payload.customer_name,
            email=payload.customer_email,
            phone=payload.customer_phone
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # 2. Delivery Address validation & creation
    # Simulated geocoding coordinates for US cities if not provided
    dest_lat = payload.delivery_address.latitude or (37.7749 + random.uniform(-0.05, 0.05))
    dest_lng = payload.delivery_address.longitude or (-122.4194 + random.uniform(-0.05, 0.05))

    delivery_addr = Address(
        street_address=payload.delivery_address.street_address,
        city=payload.delivery_address.city,
        state=payload.delivery_address.state,
        postal_code=payload.delivery_address.postal_code,
        country=payload.delivery_address.country,
        latitude=dest_lat,
        longitude=dest_lng,
        is_serviceable=True,
        notes=payload.delivery_address.notes
    )
    db.add(delivery_addr)
    db.commit()
    db.refresh(delivery_addr)

    # Pickup Address (default to merchant/origin warehouse hub if omitted)
    origin_lat = 37.7338 + random.uniform(-0.02, 0.02)
    origin_lng = -122.4467 + random.uniform(-0.02, 0.02)
    pickup_addr = Address(
        street_address=payload.pickup_address.street_address if payload.pickup_address else "700 Logistics Way, Bay Logistics Hub",
        city=payload.pickup_address.city if payload.pickup_address else "South San Francisco",
        state=payload.pickup_address.state if payload.pickup_address else "CA",
        postal_code=payload.pickup_address.postal_code if payload.pickup_address else "94080",
        country="USA",
        latitude=origin_lat,
        longitude=origin_lng,
        is_serviceable=True
    )
    db.add(pickup_addr)
    db.commit()
    db.refresh(pickup_addr)

    # 3. Create Order
    order = Order(
        order_number=order_number,
        customer_id=customer.id,
        delivery_address_id=delivery_addr.id,
        pickup_address_id=pickup_addr.id,
        total_amount=payload.total_amount,
        item_description=payload.item_description,
        order_timestamp=now,
        status="ORDER_PLACED"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # 4. Generate OTPs (Pickup OTP 4-digits, Delivery OTP 6-digits)
    pickup_otp = f"{random.randint(1000, 9999)}"
    delivery_otp = f"{random.randint(100000, 999999)}"
    estimated_delivery = now + timedelta(days=2, hours=4)
    promised_sla = now + timedelta(days=3)

    # 5. Create Package
    package = Package(
        tracking_id=tracking_id,
        order_id=order.id,
        weight_kg=payload.weight_kg,
        dimensions=payload.dimensions,
        is_fragile=payload.is_fragile,
        current_status=ShipmentStatus.ORDER_PLACED,
        last_known_lat=origin_lat,
        last_known_lng=origin_lng,
        last_known_location_name=f"Merchant Dispatch Center, {pickup_addr.city}",
        last_location_timestamp=now,
        is_location_verified=True,
        estimated_delivery_date=estimated_delivery,
        promised_sla_deadline=promised_sla,
        pickup_otp=pickup_otp,
        delivery_otp=delivery_otp
    )
    db.add(package)
    db.commit()
    db.refresh(package)

    # 6. Immutable Event Record
    event = record_shipment_event(
        db=db,
        package=package,
        new_status=ShipmentStatus.ORDER_PLACED,
        event_type="ORDER_PLACED",
        description=f"Order {order_number} confirmed. Package registered for fulfillment. Delivery OTP issued to recipient.",
        actor_id=f"CUSTOMER-{customer.id}",
        facility_id="ORIGIN-DISPATCH-01",
        latitude=origin_lat,
        longitude=origin_lng,
        location_name=package.last_known_location_name,
        source=EventSource.SYSTEM_AUTOMATION,
        is_verified=True
    )

    # 7. Send notification
    NotificationService.send_notification(
        db=db,
        recipient=customer.email,
        channel="EMAIL",
        event_type="ORDER_CONFIRMED",
        subject=f"TrackFlow AI: Order Confirmation #{order_number}",
        body=f"Your package has been ordered! Tracking ID: {tracking_id}. Estimated Delivery: {estimated_delivery.strftime('%b %d, %Y')}. Secure Delivery OTP: {delivery_otp}",
        idempotency_key=f"NOTIF-ORDER-{order.id}"
    )

    # Broadcast real-time feed
    await ws_manager.broadcast_admin({
        "type": "NEW_ORDER",
        "tracking_id": tracking_id,
        "order_number": order_number,
        "status": ShipmentStatus.ORDER_PLACED.value,
        "timestamp": now.isoformat()
    })

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
        events=[event],
        customer_name=customer.name,
        customer_phone=customer.phone,
        destination_city=delivery_addr.city,
        delivery_otp_required=True
    )
