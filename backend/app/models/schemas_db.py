from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, 
    Text, Boolean, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LOGISTICS_MANAGER = "LOGISTICS_MANAGER"
    WAREHOUSE_STAFF = "WAREHOUSE_STAFF"
    DELIVERY_AGENT = "DELIVERY_AGENT"
    CUSTOMER = "CUSTOMER"


class ShipmentStatus(str, enum.Enum):
    ORDER_PLACED = "ORDER_PLACED"
    PICKUP_ASSIGNED = "PICKUP_ASSIGNED"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT_TO_WAREHOUSE = "IN_TRANSIT_TO_WAREHOUSE"
    RECEIVED_AT_WAREHOUSE = "RECEIVED_AT_WAREHOUSE"
    PROCESSING = "PROCESSING"
    SORTED = "SORTED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    DELIVERY_EXCEPTION = "DELIVERY_EXCEPTION"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    RETURNED_TO_ORIGIN = "RETURNED_TO_ORIGIN"


class RiskCategory(str, enum.Enum):
    NORMAL = "Normal"
    AT_RISK = "At risk of delay"
    DELAYED = "Delayed"
    LOCATION_UNAVAILABLE = "Location unavailable"
    POTENTIALLY_MISPLACED = "Potentially misplaced"
    DELIVERY_FAILED = "Delivery failed"
    UNDER_INVESTIGATION = "Under investigation"


class EventSource(str, enum.Enum):
    BARCODE_SCAN = "BARCODE_SCAN"
    QR_SCAN = "QR_SCAN"
    GPS_DEVICE = "GPS_DEVICE"
    CARRIER_API = "CARRIER_API"
    MANUAL_ENTRY = "MANUAL_ENTRY"
    SYSTEM_AUTOMATION = "SYSTEM_AUTOMATION"


# 1. Users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    customer_profile = relationship("Customer", back_populates="user", uselist=False)
    delivery_agent_profile = relationship("DeliveryAgent", back_populates="user", uselist=False)


# 2. Customers
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="customer_profile")
    orders = relationship("Order", back_populates="customer")


# 3. Addresses
class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    street_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), default="USA")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_serviceable = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)


# 4. Warehouses
class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=5000)
    current_occupancy = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    storage_locations = relationship("StorageLocation", back_populates="warehouse")


# 5. Storage Locations (Bins / Shelves in Warehouse)
class StorageLocation(Base):
    __tablename__ = "storage_locations"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    bin_code = Column(String(50), index=True, nullable=False)  # e.g. ZONE-A-SHELF-3-BIN-12
    zone = Column(String(50), nullable=False)
    is_occupied = Column(Boolean, default=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=True)

    warehouse = relationship("Warehouse", back_populates="storage_locations")


# 6. Vehicles
class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(50), default="Van")  # Van, Bike, Truck
    capacity_kg = Column(Float, default=500.0)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    status = Column(String(50), default="AVAILABLE")


# 7. Delivery Agents
class DeliveryAgent(Base):
    __tablename__ = "delivery_agents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    service_zone = Column(String(100), nullable=True)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=4.9)
    completed_deliveries = Column(Integer, default=0)

    user = relationship("User", back_populates="delivery_agent_profile")
    vehicle = relationship("Vehicle")
    assignments = relationship("AgentAssignment", back_populates="agent")


# 8. Orders
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    delivery_address_id = Column(Integer, ForeignKey("addresses.id"), nullable=False)
    pickup_address_id = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    total_amount = Column(Float, default=0.0)
    item_description = Column(String(255), nullable=False)
    order_timestamp = Column(DateTime, default=utcnow)
    status = Column(String(50), default="CREATED")

    customer = relationship("Customer", back_populates="orders")
    delivery_address = relationship("Address", foreign_keys=[delivery_address_id])
    pickup_address = relationship("Address", foreign_keys=[pickup_address_id])
    packages = relationship("Package", back_populates="order")


# 9. Packages (Core Shipment)
class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(100), unique=True, index=True, nullable=False)  # TRK-YYYYMMDD-XXXX
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    weight_kg = Column(Float, default=1.0)
    dimensions = Column(String(100), default="20x15x10 cm")
    is_fragile = Column(Boolean, default=False)
    current_status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.ORDER_PLACED, nullable=False, index=True)
    current_risk_category = Column(SQLEnum(RiskCategory), default=RiskCategory.NORMAL, nullable=False)
    risk_explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Location Telemetry
    last_known_lat = Column(Float, nullable=True)
    last_known_lng = Column(Float, nullable=True)
    last_known_location_name = Column(String(255), nullable=True)
    last_location_timestamp = Column(DateTime, nullable=True)
    is_location_verified = Column(Boolean, default=True)

    # ETA & SLA
    estimated_delivery_date = Column(DateTime, nullable=True)
    promised_sla_deadline = Column(DateTime, nullable=True)
    pickup_otp = Column(String(10), nullable=True)
    delivery_otp = Column(String(10), nullable=True)

    current_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    current_delivery_agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    order = relationship("Order", back_populates="packages")
    current_warehouse = relationship("Warehouse")
    current_delivery_agent = relationship("DeliveryAgent")
    events = relationship("ShipmentEvent", back_populates="package", order_by="ShipmentEvent.timestamp.asc()")
    legs = relationship("ShipmentLeg", back_populates="package", order_by="ShipmentLeg.sequence.asc()")
    assignments = relationship("AgentAssignment", back_populates="package")
    proof_of_delivery = relationship("ProofOfDelivery", back_populates="package", uselist=False)
    exceptions = relationship("DeliveryException", back_populates="package")
    contact_attempts = relationship("CustomerContactAttempt", back_populates="package")
    investigations = relationship("InvestigationTicket", back_populates="package")
    predictions = relationship("ModelPrediction", back_populates="package")


# 10. Shipment Events (Immutable Audit Ledger)
class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)  # EVT-UUID
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False, index=True)
    tracking_id = Column(String(100), index=True, nullable=False)
    previous_status = Column(SQLEnum(ShipmentStatus), nullable=True)
    new_status = Column(SQLEnum(ShipmentStatus), nullable=False)
    event_type = Column(String(100), nullable=False)  # e.g., ORDER_CREATED, WAREHOUSE_CHECKIN, GPS_PING
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)

    facility_id = Column(String(100), nullable=True)
    actor_id = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)
    source = Column(SQLEnum(EventSource), default=EventSource.SYSTEM_AUTOMATION, nullable=False)
    is_verified = Column(Boolean, default=True)
    proof_reference = Column(String(255), nullable=True)
    exception_code = Column(String(100), nullable=True)

    package = relationship("Package", back_populates="events")

    __table_args__ = (
        Index("idx_events_tracking_time", "tracking_id", "timestamp"),
    )


# 11. Shipment Legs (Inter-facility / Inter-hub transit segments)
class ShipmentLeg(Base):
    __tablename__ = "shipment_legs"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    sequence = Column(Integer, default=1)
    origin_name = Column(String(255), nullable=False)
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    destination_name = Column(String(255), nullable=False)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)
    carrier_name = Column(String(100), default="TrackFlow Fleet")
    status = Column(String(50), default="PENDING")  # PENDING, IN_TRANSIT, COMPLETED
    dispatched_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)

    package = relationship("Package", back_populates="legs")


# 12. Inventory Movements
class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    from_bin = Column(String(50), nullable=True)
    to_bin = Column(String(50), nullable=False)
    movement_type = Column(String(50), nullable=False)  # INTAKE, SHELVING, SORT, DISPATCH
    scanned_by = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=utcnow)


# 13. Agent Assignments
class AgentAssignment(Base):
    __tablename__ = "agent_assignments"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=False)
    assigned_at = Column(DateTime, default=utcnow)
    handover_scan_confirmed = Column(Boolean, default=False)
    handover_timestamp = Column(DateTime, nullable=True)
    handover_proof = Column(String(255), nullable=True)
    status = Column(String(50), default="ASSIGNED")  # ASSIGNED, ACCEPTED, IN_DELIVERY, COMPLETED

    package = relationship("Package", back_populates="assignments")
    agent = relationship("DeliveryAgent", back_populates="assignments")


# 14. Routes
class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(100), nullable=False)
    delivery_agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=True)
    total_stops = Column(Integer, default=0)
    estimated_distance_km = Column(Float, default=0.0)
    estimated_duration_min = Column(Float, default=0.0)
    waypoints_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# 15. Proof Of Delivery (Strict POD)
class ProofOfDelivery(Base):
    __tablename__ = "proof_of_delivery"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), unique=True, nullable=False)
    recipient_name = Column(String(255), nullable=False)
    delivered_at = Column(DateTime, default=utcnow, nullable=False)
    verification_type = Column(String(50), nullable=False)  # OTP, SIGNATURE, PHOTO, BARCODE_SCAN
    otp_code_matched = Column(Boolean, default=True)
    signature_svg_or_url = Column(Text, nullable=True)
    photo_evidence_url = Column(String(500), nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    delivery_agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=True)
    notes = Column(Text, nullable=True)
    customer_confirmed_receipt = Column(Boolean, default=True)
    customer_reported_non_receipt = Column(Boolean, default=False)
    non_receipt_reason = Column(Text, nullable=True)

    package = relationship("Package", back_populates="proof_of_delivery")


# 16. Delivery Exceptions
class DeliveryException(Base):
    __tablename__ = "delivery_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    reason_code = Column(String(100), nullable=False)  # CUSTOMER_UNREACHABLE, ADDRESS_INCOMPLETE, ACCESS_RESTRICTED, DAMAGED
    reason_description = Column(Text, nullable=False)
    agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=True)
    occurred_at = Column(DateTime, default=utcnow)
    attempt_number = Column(Integer, default=1)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)

    package = relationship("Package", back_populates="exceptions")


# 17. Customer Contact Attempts (Authorized Telephony / SMS / Messaging)
class CustomerContactAttempt(Base):
    __tablename__ = "customer_contact_attempts"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    channel = Column(String(50), default="TELEPHONY_CALL")  # TELEPHONY_CALL, SMS, WHATSAPP, EMAIL
    destination_number = Column(String(50), nullable=False)
    status = Column(String(50), default="QUEUED")  # QUEUED, IN_PROGRESS, COMPLETED, NO_ANSWER, FAILED
    call_duration_seconds = Column(Integer, default=0)
    customer_response = Column(Text, nullable=True)  # e.g. "Confirmed reschedule for tomorrow 3 PM", "Gate code 1234"
    address_correction = Column(String(255), nullable=True)
    simulated_transcript = Column(Text, nullable=True)
    initiated_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    package = relationship("Package", back_populates="contact_attempts")


# 18. Notifications
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_email_or_phone = Column(String(255), nullable=False)
    channel = Column(String(50), default="SMS")  # SMS, EMAIL, PUSH
    event_type = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=True)
    message_body = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=utcnow)
    delivery_status = Column(String(50), default="DELIVERED")  # SENT, DELIVERED, FAILED
    idempotency_key = Column(String(100), unique=True, nullable=True)


# 19. Investigation Tickets
class InvestigationTicket(Base):
    __tablename__ = "investigation_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(100), unique=True, index=True, nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    reason = Column(String(255), nullable=False)
    severity = Column(String(50), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN")  # OPEN, IN_REVIEW, ESCALATED, RESOLVED, CLOSED
    assigned_team = Column(String(100), default="Warehouse Operations")
    assigned_user = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)

    package = relationship("Package", back_populates="investigations")


# 20. Audit Logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    actor_id = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=False)
    changes_json = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=utcnow)


# 21. Model Predictions (AI Inference History)
class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    model_name = Column(String(100), nullable=False)  # DELAY_PREDICTOR, ETA_PREDICTOR, ANOMALY_DETECTOR
    prediction_value = Column(Float, nullable=True)  # Delay probability or minutes
    risk_label = Column(String(100), nullable=True)
    feature_contributions_json = Column(Text, nullable=True)
    inference_timestamp = Column(DateTime, default=utcnow)

    package = relationship("Package", back_populates="predictions")
