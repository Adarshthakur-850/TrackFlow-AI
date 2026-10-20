import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import WebSocket

from app.models.schemas_db import (
    ShipmentEvent, Package, ShipmentStatus, EventSource, AuditLog
)

# Global in-memory WebSocket connection manager for live tracking & admin telemetry
class ConnectionManager:
    def __init__(self):
        self.tracking_connections: dict[str, List[WebSocket]] = {}
        self.admin_connections: List[WebSocket] = []

    async def connect_tracking(self, tracking_id: str, websocket: WebSocket):
        await websocket.accept()
        if tracking_id not in self.tracking_connections:
            self.tracking_connections[tracking_id] = []
        self.tracking_connections[tracking_id].append(websocket)

    def disconnect_tracking(self, tracking_id: str, websocket: WebSocket):
        if tracking_id in self.tracking_connections:
            if websocket in self.tracking_connections[tracking_id]:
                self.tracking_connections[tracking_id].remove(websocket)

    async def broadcast_tracking(self, tracking_id: str, data: dict):
        if tracking_id in self.tracking_connections:
            for connection in self.tracking_connections[tracking_id]:
                try:
                    await connection.send_json(data)
                except Exception:
                    pass

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)

    def disconnect_admin(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)

    async def broadcast_admin(self, data: dict):
        for connection in self.admin_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass


ws_manager = ConnectionManager()


def record_shipment_event(
    db: Session,
    package: Package,
    new_status: ShipmentStatus,
    event_type: str,
    description: str,
    actor_id: Optional[str] = "SYSTEM",
    facility_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_name: Optional[str] = None,
    source: EventSource = EventSource.SYSTEM_AUTOMATION,
    is_verified: bool = True,
    proof_reference: Optional[str] = None,
    exception_code: Optional[str] = None,
    timestamp: Optional[datetime] = None
) -> ShipmentEvent:
    """
    Appends an immutable event to the package ledger.
    Never alters or overwrites existing records.
    Updates the package's current state and telemetry coordinates.
    """
    event_time = timestamp or datetime.now(timezone.utc)
    event_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"

    event = ShipmentEvent(
        event_id=event_id,
        package_id=package.id,
        tracking_id=package.tracking_id,
        previous_status=package.current_status,
        new_status=new_status,
        event_type=event_type,
        description=description,
        timestamp=event_time,
        facility_id=facility_id,
        actor_id=actor_id,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        source=source,
        is_verified=is_verified,
        proof_reference=proof_reference,
        exception_code=exception_code
    )

    db.add(event)

    # Update package state
    package.current_status = new_status
    if latitude is not None and longitude is not None:
        package.last_known_lat = latitude
        package.last_known_lng = longitude
        package.last_known_location_name = location_name or package.last_known_location_name
        package.last_location_timestamp = event_time
        package.is_location_verified = is_verified

    package.updated_at = event_time
    db.commit()
    db.refresh(event)
    db.refresh(package)

    return event
