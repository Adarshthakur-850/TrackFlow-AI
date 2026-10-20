from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas_db import Package
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Monitoring & Predictions"])


@router.get("/shipments/{tracking_id}/risk")
def get_risk_assessment(tracking_id: str, db: Session = Depends(get_db)):
    """Evaluate package risk classification, anomaly signals, and operational next actions."""
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    result = AIService.detect_anomalies_and_classify_risk(db, package)
    return {
        "tracking_id": package.tracking_id,
        "current_status": package.current_status,
        "risk_category": result["risk_category"],
        "explanation": result["explanation"],
        "recommended_action": result["recommended_action"],
        "anomalies_detected": result["anomalies"]
    }


@router.get("/shipments/{tracking_id}/eta-prediction")
def get_eta_prediction(tracking_id: str, db: Session = Depends(get_db)):
    """Run ML regression model to predict transit duration and delay probability."""
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    pred = AIService.predict_delay_and_eta(
        distance_km=180.0,
        weight_kg=package.weight_kg,
        transit_hops=len(package.legs) or 1,
        failed_attempts=len(package.exceptions)
    )

    return {
        "tracking_id": tracking_id,
        "current_status": package.current_status,
        "prediction": pred,
        "estimated_delivery_date": package.estimated_delivery_date
    }


@router.post("/shipments/{tracking_id}/run-anomaly-check")
def run_anomaly_check(tracking_id: str, db: Session = Depends(get_db)):
    package = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    result = AIService.detect_anomalies_and_classify_risk(db, package)
    return result
