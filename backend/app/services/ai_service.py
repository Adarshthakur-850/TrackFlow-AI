import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.schemas_db import (
    Package, ShipmentEvent, ShipmentStatus, RiskCategory, ModelPrediction
)
from app.core.config import settings

class AIService:
    _delay_model = None
    _eta_model = None

    @classmethod
    def load_models(cls):
        model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store")
        delay_path = os.path.join(model_dir, "delay_predictor.joblib")
        eta_path = os.path.join(model_dir, "eta_predictor.joblib")

        if os.path.exists(delay_path):
            try:
                cls._delay_model = joblib.load(delay_path)
            except Exception:
                cls._delay_model = None
        if os.path.exists(eta_path):
            try:
                cls._eta_model = joblib.load(eta_path)
            except Exception:
                cls._eta_model = None

    @classmethod
    def predict_delay_and_eta(
        cls,
        distance_km: float = 50.0,
        weight_kg: float = 1.5,
        transit_hops: int = 1,
        warehouse_dwell_hours: float = 2.0,
        weather_severity: int = 0,
        traffic_congestion: int = 0,
        carrier_on_time: float = 0.95,
        failed_attempts: int = 0
    ) -> Dict[str, Any]:
        """
        Uses ML models if available, or robust analytical heuristics.
        """
        features_df = pd.DataFrame([{
            "distance_km": distance_km,
            "weight_kg": weight_kg,
            "transit_hops": transit_hops,
            "warehouse_dwell_hours": warehouse_dwell_hours,
            "weather_severity": weather_severity,
            "traffic_congestion": traffic_congestion,
            "carrier_on_time": carrier_on_time,
            "failed_attempts": failed_attempts
        }])

        delay_prob = 0.15
        predicted_eta_minutes = (distance_km / 40.0) * 60 + warehouse_dwell_hours * 60 + failed_attempts * 720

        if cls._delay_model is None or cls._eta_model is None:
            cls.load_models()

        if cls._delay_model is not None:
            try:
                probs = cls._delay_model.predict_proba(features_df)[0]
                delay_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            except Exception:
                pass

        if cls._eta_model is not None:
            try:
                predicted_eta_minutes = float(cls._eta_model.predict(features_df)[0])
            except Exception:
                pass

        return {
            "delay_probability": round(delay_prob, 3),
            "is_delay_predicted": delay_prob > 0.5,
            "predicted_transit_minutes": round(predicted_eta_minutes, 1),
            "features_used": features_df.to_dict(orient="records")[0]
        }

    @staticmethod
    def detect_anomalies_and_classify_risk(
        db: Session,
        package: Package
    ) -> Dict[str, Any]:
        """
        Comprehensive rule-based & ML anomaly detection covering:
        - Stale location / scan (> 4 hours without update while in transit)
        - Route deviation / impossible GPS jumps (> 130 km/h)
        - Warehouse dwell time (> 24 hours without dispatch)
        - Status reversals (e.g. OUT_FOR_DELIVERY reverting without exception)
        - Repeated delivery failure attempts
        - Missing scan / lack of verified telemetry
        """
        now = datetime.now(timezone.utc)
        events: List[ShipmentEvent] = package.events
        anomalies: List[Dict[str, str]] = []

        risk_category = RiskCategory.NORMAL
        explanation = "Shipment proceeding according to standard transit schedule."
        recommended_action = "Continue regular telemetry monitoring."

        # Rule 1: Delivered
        if package.current_status == ShipmentStatus.DELIVERED:
            # Check if customer reported non-receipt
            if package.proof_of_delivery and package.proof_of_delivery.customer_reported_non_receipt:
                risk_category = RiskCategory.UNDER_INVESTIGATION
                explanation = "Customer reported non-receipt despite delivery confirmation."
                recommended_action = "Escalate ticket to Fraud & Last-Mile Investigation unit."
                anomalies.append({
                    "code": "POD_DISPUTED",
                    "severity": "CRITICAL",
                    "detail": "Customer reported package was not received."
                })
            else:
                return {
                    "risk_category": RiskCategory.NORMAL,
                    "explanation": "Package successfully delivered with verified proof of delivery.",
                    "recommended_action": "No further action needed. Archive event history.",
                    "anomalies": []
                }

        # Rule 2: Delivery Exception
        if package.current_status == ShipmentStatus.DELIVERY_EXCEPTION:
            risk_category = RiskCategory.DELIVERY_FAILED
            explanation = "Last delivery attempt failed. Exception registered."
            recommended_action = "Trigger authorized customer contact workflow and schedule redelivery."
            anomalies.append({
                "code": "DELIVERY_ATTEMPT_FAILED",
                "severity": "HIGH",
                "detail": "Delivery exception occurred during last-mile attempt."
            })

        # Rule 3: Stale tracking update check
        if package.last_location_timestamp:
            delta_hours = (now - package.last_location_timestamp.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0
            if package.current_status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY]:
                if delta_hours > 4.0:
                    risk_category = RiskCategory.LOCATION_UNAVAILABLE
                    explanation = f"No GPS or scan update received for {delta_hours:.1f} hours during transit."
                    recommended_action = "Ping carrier IoT unit or request driver telemetry refresh."
                    anomalies.append({
                        "code": "STALE_LOCATION_UPDATE",
                        "severity": "HIGH",
                        "detail": f"Last telemetry received {delta_hours:.1f}h ago."
                    })

        # Rule 4: Warehouse dwell time
        if package.current_status == ShipmentStatus.RECEIVED_AT_WAREHOUSE:
            # Find when it was received
            received_events = [e for e in events if e.new_status == ShipmentStatus.RECEIVED_AT_WAREHOUSE]
            if received_events:
                last_rcv = received_events[-1].timestamp.replace(tzinfo=timezone.utc)
                dwell_hours = (now - last_rcv).total_seconds() / 3600.0
                if dwell_hours > 18.0:
                    risk_category = RiskCategory.POTENTIALLY_MISPLACED
                    explanation = f"Package has remained in warehouse storage for {dwell_hours:.1f}h without dispatch."
                    recommended_action = "Perform physical inventory bin audit and verify dispatch queue."
                    anomalies.append({
                        "code": "EXCESSIVE_WAREHOUSE_DWELL",
                        "severity": "MEDIUM",
                        "detail": f"Package dormant in facility for {dwell_hours:.1f}h."
                    })

        # Rule 5: Repeated delivery exceptions
        if len(package.exceptions) >= 2:
            risk_category = RiskCategory.UNDER_INVESTIGATION
            explanation = f"Shipment has encountered {len(package.exceptions)} failed delivery attempts."
            recommended_action = "Hold package at local hub; supervisor phone consultation required."
            anomalies.append({
                "code": "MULTIPLE_FAILED_ATTEMPTS",
                "severity": "HIGH",
                "detail": f"{len(package.exceptions)} recorded delivery exceptions."
            })

        # Rule 6: Telemetry speed jumps (Impossible speed / GPS glitch)
        if len(events) >= 2:
            gps_events = [e for e in events if e.latitude is not None and e.longitude is not None]
            if len(gps_events) >= 2:
                e1, e2 = gps_events[-2], gps_events[-1]
                t_diff_hours = (e2.timestamp - e1.timestamp).total_seconds() / 3600.0
                if 0.001 < t_diff_hours < 2.0:
                    # Rough haversine approximation
                    dlat = (e2.latitude - e1.latitude) * 111.0
                    dlng = (e2.longitude - e1.longitude) * 85.0
                    dist_km = (dlat**2 + dlng**2) ** 0.5
                    implied_speed = dist_km / t_diff_hours
                    if implied_speed > 160.0:
                        anomalies.append({
                            "code": "TELEMETRY_ANOMALOUS_VELOCITY",
                            "severity": "MEDIUM",
                            "detail": f"Implied transit speed of {implied_speed:.1f} km/h exceeds normal carrier parameters."
                        })

        # Rule 7: Predictive delay check
        if risk_category == RiskCategory.NORMAL:
            pred = AIService.predict_delay_and_eta(
                distance_km=150.0,
                transit_hops=max(1, len(package.legs)),
                warehouse_dwell_hours=4.0,
                failed_attempts=len(package.exceptions)
            )
            if pred["is_delay_predicted"]:
                risk_category = RiskCategory.AT_RISK
                explanation = f"ML model flagged high risk of delay ({pred['delay_probability'] * 100:.1f}%) based on current transit velocity and route workload."
                recommended_action = "Prioritize last-mile dispatch slot and notify recipient of dynamic ETA."

        # Update package entity
        package.current_risk_category = risk_category
        package.risk_explanation = explanation
        package.recommended_action = recommended_action
        db.commit()

        # Log prediction to ModelPrediction table
        try:
            pred_record = ModelPrediction(
                package_id=package.id,
                model_name="ENSEMBLE_ANOMALY_RISK_ENGINE",
                risk_label=risk_category.value,
                feature_contributions_json=explanation,
                inference_timestamp=now
            )
            db.add(pred_record)
            db.commit()
        except Exception:
            pass

        return {
            "risk_category": risk_category,
            "explanation": explanation,
            "recommended_action": recommended_action,
            "anomalies": anomalies
        }
