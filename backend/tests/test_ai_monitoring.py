import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ai_delay_and_eta_prediction():
    # Create order
    order_res = client.post("/api/v1/orders/", json={
        "customer_name": "Diana Prince",
        "customer_email": "diana@themyscira.gov",
        "customer_phone": "+1 555-0400",
        "item_description": "Composite Shield",
        "delivery_address": {
            "street_address": "100 Gateway Blvd",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94101"
        }
    })
    tracking_id = order_res.json()["tracking_id"]

    # ETA prediction
    eta_res = client.get(f"/api/v1/ai/shipments/{tracking_id}/eta-prediction")
    assert eta_res.status_code == 200
    data = eta_res.json()
    assert "prediction" in data
    assert "predicted_transit_minutes" in data["prediction"]
    assert "delay_probability" in data["prediction"]

    # Risk evaluation
    risk_res = client.get(f"/api/v1/ai/shipments/{tracking_id}/risk")
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert "risk_category" in risk_data
    assert "explanation" in risk_data
    assert "recommended_action" in risk_data

def test_admin_analytics_and_at_risk_list():
    analytics_res = client.get("/api/v1/admin/analytics")
    assert analytics_res.status_code == 200
    kpis = analytics_res.json()
    assert "total_shipments" in kpis
    assert kpis["total_shipments"] > 0
    assert "carrier_on_time_rate" in kpis

    at_risk_res = client.get("/api/v1/admin/shipments/at-risk")
    assert at_risk_res.status_code == 200
    assert isinstance(at_risk_res.json(), list)
