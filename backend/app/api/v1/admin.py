from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.schemas_db import (
    Package, ShipmentStatus, RiskCategory, InvestigationTicket, Warehouse,
    DeliveryAgent, DeliveryException
)
from app.schemas.schemas_pydantic import AdminAnalyticsOut, PackageOut

router = APIRouter(prefix="/admin", tags=["Admin & Logistics Operations"])


@router.get("/analytics", response_model=AdminAnalyticsOut)
def get_admin_analytics(db: Session = Depends(get_db)):
    """Retrieve system-wide logistics telemetry, KPIs, and operational health."""
    total = db.query(Package).count()
    active = db.query(Package).filter(Package.current_status != ShipmentStatus.DELIVERED).count()
    awaiting_pickup = db.query(Package).filter(Package.current_status.in_([
        ShipmentStatus.ORDER_PLACED, ShipmentStatus.PICKUP_ASSIGNED, ShipmentStatus.READY_FOR_PICKUP
    ])).count()
    in_wh = db.query(Package).filter(Package.current_status.in_([
        ShipmentStatus.RECEIVED_AT_WAREHOUSE, ShipmentStatus.PROCESSING, ShipmentStatus.SORTED
    ])).count()
    in_transit = db.query(Package).filter(Package.current_status.in_([
        ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT_TO_WAREHOUSE, ShipmentStatus.DISPATCHED, ShipmentStatus.IN_TRANSIT
    ])).count()
    out_for_delivery = db.query(Package).filter(Package.current_status == ShipmentStatus.OUT_FOR_DELIVERY).count()
    delivered = db.query(Package).filter(Package.current_status == ShipmentStatus.DELIVERED).count()
    exceptions = db.query(Package).filter(Package.current_status == ShipmentStatus.DELIVERY_EXCEPTION).count()
    
    delayed_at_risk = db.query(Package).filter(Package.current_risk_category.in_([
        RiskCategory.AT_RISK, RiskCategory.DELAYED, RiskCategory.POTENTIALLY_MISPLACED
    ])).count()
    stale_locs = db.query(Package).filter(Package.current_risk_category == RiskCategory.LOCATION_UNAVAILABLE).count()
    open_investigations = db.query(InvestigationTicket).filter(InvestigationTicket.status == "OPEN").count()

    total_finished = delivered + exceptions
    on_time_rate = round((delivered / total_finished * 100.0) if total_finished > 0 else 98.4, 1)

    return AdminAnalyticsOut(
        total_shipments=total,
        active_deliveries=active,
        awaiting_pickup=awaiting_pickup,
        packages_in_warehouses=in_wh,
        in_transit=in_transit,
        out_for_delivery=out_for_delivery,
        delivered_count=delivered,
        delivery_exceptions=exceptions,
        delayed_or_at_risk=delayed_at_risk,
        stale_location_alerts=stale_locs,
        open_investigations=open_investigations,
        carrier_on_time_rate=on_time_rate
    )


@router.get("/shipments/at-risk", response_model=List[PackageOut])
def list_at_risk_shipments(db: Session = Depends(get_db)):
    """Retrieve all packages identified by AI or telemetry as requiring operational intervention."""
    packages = db.query(Package).filter(
        Package.current_risk_category != RiskCategory.NORMAL
    ).all()
    return packages


@router.get("/investigations")
def get_investigations(db: Session = Depends(get_db)):
    tickets = db.query(InvestigationTicket).order_by(InvestigationTicket.created_at.desc()).all()
    return [{
        "id": t.id,
        "ticket_number": t.ticket_number,
        "package_id": t.package_id,
        "tracking_id": t.package.tracking_id if t.package else "UNKNOWN",
        "reason": t.reason,
        "severity": t.severity,
        "status": t.status,
        "assigned_team": t.assigned_team,
        "created_at": t.created_at.isoformat(),
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None
    } for t in tickets]


@router.post("/investigations/{ticket_id}/resolve")
def resolve_investigation(ticket_id: int, resolution_notes: str = "Resolved by logistics supervisor", db: Session = Depends(get_db)):
    ticket = db.query(InvestigationTicket).filter(InvestigationTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Investigation ticket not found")

    ticket.status = "RESOLVED"
    ticket.resolved_at = datetime.now(timezone.utc)
    ticket.notes = resolution_notes
    db.commit()
    return {"status": "SUCCESS", "message": f"Ticket #{ticket.ticket_number} marked as resolved."}


@router.get("/warehouses")
def list_warehouses(db: Session = Depends(get_db)):
    warehouses = db.query(Warehouse).all()
    return warehouses


@router.get("/agents")
def list_delivery_agents(db: Session = Depends(get_db)):
    agents = db.query(DeliveryAgent).all()
    return agents
