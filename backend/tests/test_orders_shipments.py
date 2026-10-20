import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.schemas_db import Package, ShipmentStatus

client = TestClient(app)

def test_order_creation_and_tracking_id():
    payload = {
        "customer_name": "Alice Johnson",
        "customer_email": "alice@example.com",
        "customer_phone": "+1 555-0100",
        "item_description": "Mechanical Keyboard",
        "total_amount": 129.99,
        "weight_kg": 1.2,
        "delivery_address": {
            "street_address": "123 Market St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94105",
            "country": "USA"
        }
    }
    response = client.post("/api/v1/orders/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "tracking_id" in data
    assert data["tracking_id"].startswith("TRK-")
    assert data["current_status"] == "ORDER_PLACED"
    assert len(data["events"]) == 1
    assert data["events"][0]["event_type"] == "ORDER_PLACED"

def test_full_shipment_lifecycle():
    # 1. Create order
    order_res = client.post("/api/v1/orders/", json={
        "customer_name": "Bob Smith",
        "customer_email": "bob@example.com",
        "customer_phone": "+1 555-0200",
        "item_description": "Wireless Headphones",
        "delivery_address": {
            "street_address": "456 Mission St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94105"
        }
    })
    pkg = order_res.json()
    tracking_id = pkg["tracking_id"]

    # 2. Pickup
    pickup_res = client.post(f"/api/v1/shipments/{tracking_id}/pickup", json={
        "pickup_agent_id": "DRIVER-01",
        "condition_notes": "All packages intact"
    })
    assert pickup_res.status_code == 200

    # 3. Warehouse Receipt
    wh_res = client.post(f"/api/v1/shipments/{tracking_id}/warehouse-receipt", json={
        "warehouse_code": "WH-SFO-01",
        "scanned_barcode": tracking_id,
        "storage_bin": "BIN-A1-09"
    })
    assert wh_res.status_code == 200
    assert wh_res.json()["new_status"] == "RECEIVED_AT_WAREHOUSE"

    # 4. Warehouse Dispatch
    disp_res = client.post(f"/api/v1/shipments/{tracking_id}/dispatch", json={
        "warehouse_code": "WH-SFO-01",
        "next_destination": "Local Delivery Hub 4",
        "carrier_name": "TrackFlow Express"
    })
    assert disp_res.status_code == 200
    assert disp_res.json()["new_status"] == "IN_TRANSIT"

    # 5. Agent Assignment
    agent_res = client.post(f"/api/v1/shipments/{tracking_id}/assign-agent", json={
        "agent_id": 1,
        "vehicle_info": "Van #TF-88"
    })
    assert agent_res.status_code == 200
    assert agent_res.json()["new_status"] == "OUT_FOR_DELIVERY"

    # 6. Location Update
    loc_res = client.post(f"/api/v1/shipments/{tracking_id}/location", json={
        "latitude": 37.785,
        "longitude": -122.410,
        "speed_kmh": 32.5
    })
    assert loc_res.status_code == 200

    # 7. Proof of Delivery with invalid OTP should fail
    fail_pod = client.post(f"/api/v1/shipments/{tracking_id}/proof-of-delivery", json={
        "recipient_name": "Bob Smith",
        "verification_type": "OTP",
        "otp_code": "000000"
    })
    assert fail_pod.status_code == 400

    # Retrieve valid delivery OTP from database
    db = SessionLocal()
    db_pkg = db.query(Package).filter(Package.tracking_id == tracking_id).first()
    valid_otp = db_pkg.delivery_otp
    db.close()

    # Success POD
    success_pod = client.post(f"/api/v1/shipments/{tracking_id}/proof-of-delivery", json={
        "recipient_name": "Bob Smith",
        "verification_type": "OTP",
        "otp_code": valid_otp,
        "signature_data": "data:image/svg+xml;base64,mocksignature"
    })
    assert success_pod.status_code == 200
    assert success_pod.json()["new_status"] == "DELIVERED"

    # Verify timeline length
    timeline_res = client.get(f"/api/v1/shipments/{tracking_id}/timeline")
    assert timeline_res.status_code == 200
    events = timeline_res.json()
    assert len(events) >= 6

def test_failed_delivery_and_telephony_workflow():
    order_res = client.post("/api/v1/orders/", json={
        "customer_name": "Charlie Chaplin",
        "customer_email": "charlie@example.com",
        "customer_phone": "+1 555-0300",
        "item_description": "Vintage Camera",
        "delivery_address": {
            "street_address": "789 Broadway",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94133"
        }
    })
    tracking_id = order_res.json()["tracking_id"]

    # Record delivery exception
    exc_res = client.post(f"/api/v1/shipments/{tracking_id}/delivery-attempt", json={
        "reason_code": "CUSTOMER_UNREACHABLE",
        "description": "Recipient did not answer doorbell or phone after 3 attempts.",
        "trigger_customer_contact": True
    })
    assert exc_res.status_code == 200
    assert exc_res.json()["new_status"] == "DELIVERY_EXCEPTION"

    # Verify package detail reflects exception and contact attempt
    detail_res = client.get(f"/api/v1/shipments/{tracking_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["current_status"] == "DELIVERY_EXCEPTION"
