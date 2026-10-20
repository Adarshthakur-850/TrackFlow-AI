from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.schemas_db import ShipmentStatus, RiskCategory, EventSource, UserRole


# Auth & User
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    full_name: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    phone_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Addresses
class AddressBase(BaseModel):
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str = "USA"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


class AddressCreate(AddressBase):
    pass


class AddressOut(AddressBase):
    id: int
    is_serviceable: bool

    model_config = ConfigDict(from_attributes=True)


# Orders & Packages
class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    item_description: str
    total_amount: float = 0.0
    weight_kg: float = 1.0
    dimensions: str = "20x15x10 cm"
    is_fragile: bool = False
    delivery_address: AddressCreate
    pickup_address: Optional[AddressCreate] = None


class ShipmentEventOut(BaseModel):
    id: int
    event_id: str
    tracking_id: str
    previous_status: Optional[ShipmentStatus] = None
    new_status: ShipmentStatus
    event_type: str
    description: str
    timestamp: datetime
    facility_id: Optional[str] = None
    actor_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    source: EventSource
    is_verified: bool
    proof_reference: Optional[str] = None
    exception_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProofOfDeliveryOut(BaseModel):
    id: int
    recipient_name: str
    delivered_at: datetime
    verification_type: str
    otp_code_matched: bool
    signature_svg_or_url: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    notes: Optional[str] = None
    customer_confirmed_receipt: bool
    customer_reported_non_receipt: bool
    non_receipt_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PackageOut(BaseModel):
    id: int
    tracking_id: str
    order_id: int
    weight_kg: float
    dimensions: str
    is_fragile: bool
    current_status: ShipmentStatus
    current_risk_category: RiskCategory
    risk_explanation: Optional[str] = None
    recommended_action: Optional[str] = None
    last_known_lat: Optional[float] = None
    last_known_lng: Optional[float] = None
    last_known_location_name: Optional[str] = None
    last_location_timestamp: Optional[datetime] = None
    is_location_verified: bool
    estimated_delivery_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PackageDetailOut(PackageOut):
    events: List[ShipmentEventOut] = []
    proof_of_delivery: Optional[ProofOfDeliveryOut] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    destination_city: Optional[str] = None
    delivery_otp_required: bool = True


# Action Payloads
class PickupConfirmRequest(BaseModel):
    pickup_agent_id: str
    pickup_otp: Optional[str] = None
    scanned_barcode: Optional[str] = None
    condition_notes: str = "Good condition"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class WarehouseReceiptRequest(BaseModel):
    warehouse_code: str
    scanned_barcode: str
    storage_bin: Optional[str] = "BIN-INBOUND-01"
    condition_notes: str = "Received intact"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class WarehouseDispatchRequest(BaseModel):
    warehouse_code: str
    next_destination: str
    carrier_name: str = "TrackFlow Fleet"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AgentAssignRequest(BaseModel):
    agent_id: int
    vehicle_info: Optional[str] = "Van #TF-401"
    dispatch_location: Optional[str] = "Central Distribution Hub"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    speed_kmh: Optional[float] = 0.0
    battery_level: Optional[float] = 100.0
    source: EventSource = EventSource.GPS_DEVICE
    is_verified: bool = True


class DeliveryAttemptRequest(BaseModel):
    reason_code: str  # CUSTOMER_UNREACHABLE, ADDRESS_INCOMPLETE, etc.
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    trigger_customer_contact: bool = True


class ProofOfDeliveryRequest(BaseModel):
    recipient_name: str
    verification_type: str = "OTP"  # OTP, SIGNATURE, PHOTO
    otp_code: Optional[str] = None
    signature_data: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


class ReportNonReceiptRequest(BaseModel):
    reason: str
    additional_details: Optional[str] = None


class ContactCustomerRequest(BaseModel):
    channel: str = "TELEPHONY_CALL"  # TELEPHONY_CALL, SMS
    reason: str = "Delivery address clarification"
    custom_message: Optional[str] = None


# Analytics
class AdminAnalyticsOut(BaseModel):
    total_shipments: int
    active_deliveries: int
    awaiting_pickup: int
    packages_in_warehouses: int
    in_transit: int
    out_for_delivery: int
    delivered_count: int
    delivery_exceptions: int
    delayed_or_at_risk: int
    stale_location_alerts: int
    open_investigations: int
    carrier_on_time_rate: float
