# 📦 TrackFlow AI — End-to-End Package Tracking & Intelligent Delivery Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**TrackFlow AI** is a production-grade, AI-powered package tracking and intelligent delivery management platform. It provides end-to-end auditability across the entire supply chain—from order confirmation, merchant pickup, and warehouse sortation to line-haul dispatch, last-mile courier tracking, strict proof-of-delivery (POD) verification, and automated recovery workflows.

---

## 📑 Table of Contents

- [1. Executive Summary & Vision](#1-executive-summary--vision)
- [2. System Architecture](#2-system-architecture)
  - [High-Level Component Architecture](#high-level-component-architecture)
  - [End-to-End Sequence Diagram](#end-to-end-sequence-diagram)
- [3. The 8-Stage Package Lifecycle](#3-the-8-stage-package-lifecycle)
- [4. Intelligent AI & Machine Learning Layer](#4-intelligent-ai--machine-learning-layer)
  - [Delay Prediction Model](#delay-prediction-model)
  - [Dynamic ETA Regressor](#dynamic-eta-regressor)
  - [Anomaly Detection Engine](#anomaly-detection-engine)
  - [Risk Classification Categories](#risk-classification-categories)
- [5. Database Schema & Data Models](#5-database-schema--data-models)
- [6. Multi-Persona User Interfaces](#6-multi-persona-user-interfaces)
  - [1. Public Customer Tracking Portal](#1-public-customer-tracking-portal)
  - [2. Operations & AI Radar Dashboard](#2-operations--ai-radar-dashboard)
  - [3. Warehouse Intake & Sortation Terminal](#3-warehouse-intake--sortation-terminal)
  - [4. Courier Handheld Console](#4-courier-handheld-console)
  - [5. Simulation & Edge-Case Lab](#5-simulation--edge-case-lab)
- [7. Telephony & Automated Recovery Workflows](#7-telephony--automated-recovery-workflows)
- [8. Complete REST & WebSocket API Catalog](#8-complete-rest--websocket-api-catalog)
- [9. Security, Privacy & Audit Guarantees](#9-security-privacy--audit-guarantees)
- [10. Step-by-Step Installation & Local Quickstart](#10-step-by-step-installation--local-quickstart)
- [11. Containerized Deployment (Docker Compose)](#11-containerized-deployment-docker-compose)
- [12. Automated Testing Suite](#12-automated-testing-suite)
- [13. Repository Structure](#13-repository-structure)
- [14. Troubleshooting & FAQ](#14-troubleshooting--faq)

---

## 1. Executive Summary & Vision

Modern e-commerce and logistics networks suffer from opaque delivery statuses, misplaced packages, missed warehouse scans, falsified delivery attempts, and poor customer communication during exceptions.

**TrackFlow AI** resolves these systemic failures through:
1. **Cryptographically Traceable Event Ledger**: Every package custody change, GPS ping, and warehouse transfer is permanently recorded into an append-only event stream that cannot be silently modified.
2. **Predictive AI Oversight**: Machine learning models constantly evaluate transit velocity, warehouse dwell time, weather severity, and traffic bottlenecks to predict delays before they occur.
3. **Strict Proof-of-Delivery (POD)**: Couriers cannot mark packages as delivered without authentic customer verification (6-digit OTP matching, digital signature, or timestamped doorstep photo).
4. **Automated Telephony & Exception Recovery**: When a courier encounters locked gates, incorrect addresses, or unreachable recipients, the system automatically triggers an interactive voice call (IVR) or SMS to resolve the bottleneck and schedule redelivery.

---

## 2. System Architecture

### High-Level Component Architecture

```mermaid
flowchart TD
    subgraph Clients [Frontend Client Interfaces (React + Vite)]
        CustomerUI["Customer Tracking Portal"]
        AdminUI["Operations & AI Radar"]
        WarehouseUI["Warehouse Scan Terminal"]
        CourierUI["Courier Mobile Console"]
        SimLabUI["Simulation & Scenario Lab"]
    end

    subgraph Gateway [API & Routing Layer]
        FastAPI["FastAPI Application Gateway (:8000)"]
        WSServer["WebSocket Telemetry Engine (:8000/ws)"]
    end

    subgraph CoreServices [Core Application Services]
        OrderService["Order & SLA Management"]
        LifecycleService["Shipment State Machine"]
        EventLedgerService["Immutable Event Audit Ledger"]
        TelephonyService["Telephony & Voice IVR Gateway"]
        NotificationService["Idempotent Notification Dispatcher"]
    end

    subgraph AIEngine [Machine Learning & Anomaly Layer]
        DelayModel["Random Forest Delay Predictor (96.8% Acc)"]
        ETAModel["Random Forest Transit Regressor (RMSE 91m)"]
        AnomalyDetector["Telemetry & Speed Glitch Detector"]
        RiskRadar["Operational Risk Classifier"]
    end

    subgraph Storage [Persistence & Cache]
        SQLDB[("Relational DB (PostgreSQL / SQLite)")]
        ModelStore[("Trained Joblib Model Artifacts")]
    end

    Clients -->|REST API / HTTP| FastAPI
    Clients -->|Real-Time Telemetry / Pings| WSServer

    FastAPI --> OrderService
    FastAPI --> LifecycleService
    FastAPI --> TelephonyService
    FastAPI --> NotificationService

    LifecycleService --> EventLedgerService
    LifecycleService --> AIEngine
    EventLedgerService --> SQLDB
    AIEngine --> ModelStore
    AIEngine --> SQLDB
    WSServer --> Clients
```

### End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    actor Merchant
    actor Courier
    actor WarehouseStaff
    participant System as TrackFlow Backend
    participant AI as AI Monitoring Engine
    participant Phone as Telephony Gateway

    Customer->>System: Place Order (Destination Address)
    System->>System: Generate TRK-ID, Dynamic SLA & 6-Digit Delivery OTP
    System->>Customer: Order Confirmed + Secure Delivery OTP (882194)
    
    Merchant->>System: Package Packed & Ready
    Courier->>System: Pickup Scan + Merchant Handover Verification
    System->>System: Status: PICKED_UP -> IN_TRANSIT_TO_WAREHOUSE

    WarehouseStaff->>System: Inbound Scan at Central Distribution Hub
    System->>System: Status: RECEIVED_AT_WAREHOUSE (Bin: ZONE-A-SHELF-04)
    System->>System: Status: DISPATCHED (Line-haul truck to delivery depot)

    Courier->>System: Delivery Assignment & Handover Scan
    System->>System: Status: OUT_FOR_DELIVERY
    loop Last-Mile Telemetry
        Courier->>System: Live GPS Ping (37.7792, -122.4175 @ 28 km/h)
        System->>AI: Evaluate transit progress & dwell anomalies
        System->>Customer: Live Map Radar Update
    end

    alt Normal Delivery Flow
        Courier->>Customer: Arrive at Doorstep & Request OTP
        Customer->>Courier: Provide OTP (882194)
        Courier->>System: Submit POD (OTP + Recipient Signature)
        System->>System: Validate OTP -> Status: DELIVERED
        System->>Customer: Delivery Confirmation Notification
    else Delivery Exception Flow (Gate Locked / Unreachable)
        Courier->>System: Report Exception (GATE_ACCESS_DENIED)
        System->>System: Status: DELIVERY_EXCEPTION
        System->>Phone: Trigger Authorized Voice Call to Customer
        Phone->>Customer: "Delivery agent at gate. Please confirm access code."
        Customer->>Phone: "Code is 4491, leave with leasing office."
        Phone->>System: Log Call Transcript & Update Resolution Notes
    end
```

---

## 3. The 8-Stage Package Lifecycle

TrackFlow AI enforces an immutable state machine where transitions must be backed by verified telemetry, barcode scans, or authentic digital proof:

| Stage | Name | Status Code | Actor | Verification Requirement |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Order Placement** | `ORDER_PLACED` | Customer / E-Commerce API | Address serviceability check, tracking ID generation, delivery OTP creation. |
| **2** | **Preparation & Collection** | `PICKUP_ASSIGNED` → `PICKED_UP` | Pickup Courier | Physical condition notes, pickup courier ID, barcode or OTP check. |
| **3** | **Warehouse Entry** | `IN_TRANSIT_TO_WAREHOUSE` → `RECEIVED_AT_WAREHOUSE` | Warehouse Inbound Staff | Barcode scan, warehouse GPS match, bin/shelf allocation (`ZONE-B-SHELF-04-BIN-18`). |
| **4** | **Processing & Sortation** | `PROCESSING` → `SORTED` → `DISPATCHED` → `IN_TRANSIT` | Distribution Supervisor | Outbound sorting scan, inter-hub freight leg generation, line-haul carrier assignment. |
| **5** | **Courier Assignment** | `OUT_FOR_DELIVERY` | Delivery Courier | Courier acceptance, vehicle assignment, physical handover scan before dispatch. |
| **6** | **Last-Mile Telemetry** | `OUT_FOR_DELIVERY` | IoT GPS Unit / Driver Mobile | Timestamped GPS coordinate pings, velocity checks, distinguishing verified device locks from stale estimates. |
| **7** | **Verified Delivery (POD)** | `DELIVERED` | Recipient & Courier | **Strict Validation:** Customer 6-digit OTP verification, recipient name, signature image, doorstep photo evidence. |
| **8** | **Exception Handling** | `DELIVERY_EXCEPTION` / `UNDER_INVESTIGATION` | Courier / Automated System | Structured reason code (`CUSTOMER_UNREACHABLE`, `GATE_ACCESS_DENIED`, `INCOMPLETE_ADDRESS`), automated telephony IVR call, investigation ticketing. |

---

## 4. Intelligent AI & Machine Learning Layer

TrackFlow AI does not treat machine learning as an afterthought; it runs an active AI inference layer on every event and location update.

### Delay Prediction Model
- **Algorithm**: Random Forest Classifier (100 estimators, max depth 10) trained on synthetic realistic logistics datasets.
- **Model Accuracy**: **96.83%** on out-of-fold validation sets.
- **Input Features**:
  1. `distance_km`: Haversine distance between current location and destination.
  2. `weight_kg`: Package weight impacting transit mode.
  3. `transit_hops`: Number of warehouse hub transfers.
  4. `warehouse_dwell_hours`: Elapsed time in facility without dispatch.
  5. `weather_severity`: 0 (clear), 1 (rain/snow), 2 (severe storm).
  6. `traffic_congestion`: 0 (freeflow), 1 (moderate), 2 (gridlock).
  7. `carrier_on_time`: Historical on-time performance rate of carrier.
  8. `failed_attempts`: Number of prior unsuccessful delivery attempts.

### Dynamic ETA Regressor
- **Algorithm**: Random Forest Regressor (RMSE: **91.51 minutes**).
- **Function**: Continuously recalculates expected delivery minute timestamps based on live vehicle speed, route distance, and local hub queue congestion.

### Anomaly Detection Engine
Evaluates telemetry against strict physical and behavioral heuristics:
- **Stale Telemetry Alerts**: Flags packages with no GPS or scan updates for more than **4.0 hours** during active transit.
- **Excessive Warehouse Dwell**: Flags packages sitting in warehouse storage for more than **18.0 hours** without outbound sortation.
- **Impossible Velocity / GPS Jumps**: Detects telemetry pings implying travel speeds greater than **160 km/h** between consecutive coordinates.
- **Status Reversal Protection**: Blocks or alerts on unauthorized transitions (e.g. attempting to move from `OUT_FOR_DELIVERY` back to `ORDER_PLACED`).
- **Disputed Delivery Alerts**: Immediately triggers an investigation ticket if a customer files a non-receipt dispute on a delivered package.

### Risk Classification Categories
1. `Normal`: Shipment progressing on schedule.
2. `At risk of delay`: Machine learning model predicts > 50% probability of missing promised SLA deadline.
3. `Delayed`: Real-world timestamp has surpassed promised SLA delivery window.
4. `Location unavailable`: No GPS telemetry ping or barcode scan received for > 4 hours during active delivery.
5. `Potentially misplaced`: Package has resided in warehouse storage beyond expected sorting window (> 18h).
6. `Delivery failed`: Last-mile attempt unsuccessful due to access restriction, customer absence, or wrong address.
7. `Under investigation`: Package subject to customer dispute, multiple failed attempts, or supervisory review.

---

## 5. Database Schema & Data Models

The system architecture utilizes a normalized relational schema with 21 core entities:

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "has profile"
    USERS ||--o| DELIVERY_AGENTS : "has profile"
    CUSTOMERS ||--o{ ORDERS : "places"
    ADDRESSES ||--o{ ORDERS : "delivery address"
    ADDRESSES ||--o{ ORDERS : "pickup address"
    ORDERS ||--|{ PACKAGES : "contains"
    WAREHOUSES ||--o{ STORAGE_LOCATIONS : "contains"
    WAREHOUSES ||--o{ PACKAGES : "stores"
    VEHICLES ||--o{ DELIVERY_AGENTS : "assigned to"
    DELIVERY_AGENTS ||--o{ AGENT_ASSIGNMENTS : "receives"
    PACKAGES ||--o{ AGENT_ASSIGNMENTS : "assigned in"
    PACKAGES ||--o{ SHIPMENT_EVENTS : "audit history"
    PACKAGES ||--o{ SHIPMENT_LEGS : "transit legs"
    PACKAGES ||--o| PROOF_OF_DELIVERY : "verified by"
    PACKAGES ||--o{ DELIVERY_EXCEPTIONS : "encounters"
    PACKAGES ||--o{ CUSTOMER_CONTACT_ATTEMPTS : "triggers"
    PACKAGES ||--o{ INVESTIGATION_TICKETS : "escalates to"
    PACKAGES ||--o{ MODEL_PREDICTIONS : "scored by"
```

### Core Entities Summary
1. **`User`**: System authentication, bcrypt passwords, and RBAC roles (`ADMIN`, `LOGISTICS_MANAGER`, `WAREHOUSE_STAFF`, `DELIVERY_AGENT`, `CUSTOMER`).
2. **`Order`**: Order header, customer reference, items, delivery/pickup address foreign keys.
3. **`Package`**: Core shipment record, tracking ID (`TRK-YYYYMMDD-XXXX`), weight, fragile flag, current status, risk category, delivery OTP, pickup OTP, and telemetry timestamps.
4. **`ShipmentEvent`**: Append-only immutable audit trail storing every location fix, scan, actor ID, source (`BARCODE_SCAN`, `GPS_DEVICE`, `QR_SCAN`, `SYSTEM_AUTOMATION`), verification status, and proof reference.
5. **`ProofOfDelivery`**: Strict POD entity storing matching OTP status, recipient name, timestamp, digital signature vector, doorstep photo evidence URL, and customer dispute flags.
6. **`DeliveryException`**: Detailed exception logs with reason codes, attempt counters, and GPS coordinates.
7. **`CustomerContactAttempt`**: Record of IVR telephone calls, call duration, simulated voice transcripts, and recorded customer responses.
8. **`InvestigationTicket`**: Supervisory escalation tickets for disputed deliveries, lost inventory, or repeat exceptions.
9. **`Warehouse` & `StorageLocation`**: Physical hubs, GPS boundaries, capacities, and granular bin/shelf coordinates.

---

## 6. Multi-Persona User Interfaces

TrackFlow AI includes a modern, responsive web application built with React, Vite, and Tailwind CSS offering 5 dedicated perspectives:

### 1. Public Customer Tracking Portal
- **Tracking ID Search**: Look up shipments via tracking number or order ID, with one-click demo pills.
- **Secure Delivery OTP Badge**: Highlighting the customer's 6-digit verification code required upon arrival.
- **Live Telemetry Radar**: Visual canvas displaying origin depot, courier position, route line, destination pin, speed, and carrier GPS lock status.
- **Interactive 8-Stage Progress Stepper**: Visual indicators for completed, active, and exceptional stages.
- **Non-Receipt Dispute Modal**: If a package is marked delivered, the recipient can trigger a non-receipt dispute directly from the portal.

### 2. Operations & AI Radar Dashboard
- **12 Real-Time Logistics KPIs**: Total shipments, active deliveries, warehouse volume, line-haul transit counts, courier out-for-delivery counts, verified deliveries, exceptions, at-risk flags, and carrier on-time rate.
- **Real-Time AI Anomaly Radar**: Live table displaying every anomalous package, delay probability %, ML root-cause explanation, and recommended operational intervention.
- **Interactive Action Buttons**: Directly initiate an automated telephony voice call to the recipient or re-route shipments.
- **Investigation Ticket Console**: Supervisor review and resolution workflows with audit notes.

### 3. Warehouse Intake & Sortation Terminal
- **Barcode Scanner Simulator**: Scan package tracking numbers into inbound conveyor queues.
- **Bin & Shelf Allocation**: Assign packages to specific physical warehouse bins (`ZONE-A-SHELF-04-BIN-12`).
- **Line-Haul Dispatcher**: Organize outbound packages into regional freight corridors.
- **Dwell Time Monitor**: Identifies lingering packages before they become delivery delays.

### 4. Courier Handheld Console
- **Mobile-Responsive Runsheet**: Assigned delivery stops and customer addresses.
- **Live GPS Broadcaster**: Send real-time GPS fixes and velocity telemetry back to the tracking system.
- **Strict POD Submitter**: Requires entry of the customer's 6-digit OTP, signature vector, and doorstep verification notes.
- **Exception Reporter**: Report failed delivery reasons (`CUSTOMER_UNREACHABLE`, `SECURITY_GATE_LOCKED`, `INCOMPLETE_ADDRESS`) with automatic telephony recovery triggering.

### 5. Simulation & Edge-Case Lab
- **Scenario 1 (Create Order)**: Instant placement of a new package with dynamic SLA.
- **Scenario 2 (Simulate Full Journey)**: Fast-forward a shipment through collection, warehouse sort, line-haul dispatch, and verified POD delivery.
- **Scenario 3 (Inject Stale Telemetry)**: Rewind last location timestamp by 6.5 hours to observe the AI risk radar flag `Location unavailable`.
- **Scenario 4 (Inject Delivery Exception)**: Simulate locked gate failure, observe automated IVR voice calling, and inspect the customer speech transcript.
- **Scenario 5 (Fleet Re-Seed)**: Populate the database with realistic San Francisco Bay Area logistics hubs, vans, and drivers.

---

## 7. Telephony & Automated Recovery Workflows

In compliance with delivery regulations, TrackFlow AI does not assume customer contact unless confirmed by the telephony adapter.

```mermaid
flowchart LR
    Exception[Delivery Exception Reported] --> Trigger[Telephony Sandbox Adapter]
    Trigger --> OutboundCall[Outbound Voice Call Dialed]
    OutboundCall --> SpeechRecognition[IVR Voice Assistant]
    SpeechRecognition --> CustomerReply["Customer Response Recorded"]
    CustomerReply --> EventLog[Log into Immutable Event History]
    CustomerReply --> TicketUpdate[Update Ticket with Instructions]
```

### Sandbox IVR Call Example
```
[OUTBOUND IVR CALL]: Hello, this is the TrackFlow AI automated delivery assistant regarding package TRK-20261020-1003. Your delivery courier encountered an issue: Security gate locked; intercom unresponsive. Please provide access instructions or confirm availability.

[CUSTOMER RESPONSE]: "Please leave with reception/security or re-attempt tomorrow after 2 PM."

[SYSTEM ACTION]: Call duration 45s recorded. Proof reference CALL-REF-14 generated. Status preserved. Resolution notes updated in ticket.
```

---

## 8. Complete REST & WebSocket API Catalog

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, name, and version |
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Authenticate user and receive JWT access token |
| `POST` | `/api/v1/orders/` | Create order, assign tracking ID, and generate OTP |
| `GET` | `/api/v1/shipments/{tracking_id}` | Retrieve real-time shipment status, telemetry, and POD |
| `GET` | `/api/v1/shipments/{tracking_id}/timeline` | Retrieve immutable event history |
| `POST` | `/api/v1/shipments/{tracking_id}/pickup` | Confirm package collection with pickup agent |
| `POST` | `/api/v1/shipments/{tracking_id}/warehouse-receipt` | Inbound warehouse scan and bin shelving |
| `POST` | `/api/v1/shipments/{tracking_id}/dispatch` | Outbound warehouse line-haul dispatch |
| `POST` | `/api/v1/shipments/{tracking_id}/assign-agent` | Assign delivery courier with custody handover |
| `POST` | `/api/v1/shipments/{tracking_id}/location` | Submit verified GPS telemetry and speed |
| `POST` | `/api/v1/shipments/{tracking_id}/proof-of-delivery` | Validate customer OTP and confirm delivery |
| `POST` | `/api/v1/shipments/{tracking_id}/delivery-attempt` | Record exception & trigger automated telephony call |
| `POST` | `/api/v1/shipments/{tracking_id}/report-non-receipt` | Customer dispute workflow for delivered packages |
| `POST` | `/api/v1/shipments/{tracking_id}/contact-customer` | Manually initiate IVR voice call or SMS to customer |
| `GET` | `/api/v1/ai/shipments/{tracking_id}/risk` | Retrieve AI risk score, explanation & actions |
| `GET` | `/api/v1/ai/shipments/{tracking_id}/eta-prediction` | ML regression prediction of remaining transit minutes |
| `GET` | `/api/v1/admin/analytics` | Retrieve system KPIs, delay rates, and fleet stats |
| `GET` | `/api/v1/admin/shipments/at-risk` | Filter all shipments flagged by AI risk radar |
| `GET` | `/api/v1/admin/investigations` | List escalated customer and logistics investigation tickets |
| `POST` | `/api/v1/admin/investigations/{id}/resolve`| Resolve open investigation ticket with notes |
| `POST` | `/api/v1/simulation/simulate-full-journey/{id}` | Fast-forward shipment through stages 2-7 |
| `POST` | `/api/v1/simulation/inject-stale-scan/{id}` | Simulate 6.5h tracking stoppage to test AI alert |
| `POST` | `/api/v1/simulation/inject-delivery-exception/{id}` | Simulate failed attempt and automated IVR phone call |
| `POST` | `/api/v1/simulation/seed-demo-data` | Seed logistics network with hubs, vans, and shipments |

### WebSocket Real-Time Channels
- `ws://127.0.0.1:8000/ws/tracking/{tracking_id}`: Dedicated live channel for package location pings, custody handovers, and status transitions.
- `ws://127.0.0.1:8000/ws/admin/live-feed`: System-wide telemetry channel for newly created orders, exceptions, and anomalies.

---

## 9. Security, Privacy & Audit Guarantees

1. **Immutable Audit Ledger**: The `ShipmentEvent` table has no `UPDATE` or `DELETE` endpoints. All state adjustments are recorded as new, auditable entries with event IDs, actor tags, and timestamps.
2. **Fraud-Resistant POD**: Delivery couriers cannot mark an order as delivered without providing a customer-matched OTP, biometric/digital signature, or verified photo proof.
3. **Role-Based Access Control (RBAC)**: Distinct permissions for `CUSTOMER`, `DELIVERY_AGENT`, `WAREHOUSE_STAFF`, `LOGISTICS_MANAGER`, and `ADMIN`.
4. **Data Isolation**: Simulated telemetry and sandbox phone calls are explicitly separated from external production credentials.

---

## 10. Step-by-Step Installation & Local Quickstart

### Prerequisites
- **Python**: Version 3.10+ (Python 3.11 or 3.12 recommended)
- **Package Manager**: `uv` (recommended) or standard `pip`
- **Node.js**: Version 18+ and `npm`

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "d:\lpu\project ml\TrackFlow AI"
```

### Step 2: Set Up Backend
```powershell
# 1. Navigate to backend
cd backend

# 2. Create virtual environment using uv or python
uv venv .venv
# Or: py -m venv .venv

# 3. Install backend dependencies
uv pip install -r requirements.txt --python .venv\Scripts\python.exe
# Or: .venv\Scripts\pip install -r requirements.txt

# 4. Train the AI machine learning models
.venv\Scripts\python.exe ml\train_models.py
# (Outputs delay_predictor.joblib and eta_predictor.joblib into models_store/)

# 5. Launch the FastAPI server
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: **http://127.0.0.1:8000/docs**
- Health Check: **http://127.0.0.1:8000/health**

### Step 3: Set Up Frontend
Open a separate terminal window:
```powershell
# 1. Navigate to frontend
cd "d:\lpu\project ml\TrackFlow AI\frontend"

# 2. Install Node dependencies
npm install

# 3. Launch Vite dev server
npm run dev
```
- Open browser at: **http://localhost:3000**

---

## 11. Containerized Deployment (Docker Compose)

For production or containerized testing with PostgreSQL:

```bash
# From the project root
docker-compose up --build
```

Services started:
- `trackflow_postgres`: PostgreSQL 15 database on port `5432`.
- `trackflow_backend`: FastAPI backend on port `8000`.
- `trackflow_frontend`: Nginx-served optimized React production build on port `3000`.

---

## 12. Automated Testing Suite

The repository includes a comprehensive `pytest` test suite covering order creation, state transitions, strict POD verification, exception handling, telephony logs, and ML predictions.

```powershell
cd backend
.venv\Scripts\python.exe -m pytest -v
```

### Test Output:
```
tests/test_ai_monitoring.py::test_ai_delay_and_eta_prediction PASSED     [20%]
tests/test_ai_monitoring.py::test_admin_analytics_and_at_risk_list PASSED [40%]
tests/test_orders_shipments.py::test_order_creation_and_tracking_id PASSED [60%]
tests/test_orders_shipments.py::test_full_shipment_lifecycle PASSED      [80%]
tests/test_orders_shipments.py::test_failed_delivery_and_telephony_workflow PASSED [100%]
======================== 5 passed in 11.22s ========================
```

---

## 13. Repository Structure

```
TrackFlow AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── admin.py                 # Analytics, at-risk list, investigation tickets
│   │   │   ├── ai_monitoring.py         # ML risk scoring and anomaly check endpoints
│   │   │   ├── auth.py                  # JWT authentication and registration
│   │   │   ├── orders.py                # Order placement, SLA calculation, OTP generation
│   │   │   ├── shipments.py             # 8-stage lifecycle endpoints, POD & exceptions
│   │   │   └── simulation.py            # Simulation lab endpoints and scenario triggers
│   │   ├── core/
│   │   │   ├── config.py                # Application settings, CORS, sandbox toggles
│   │   │   ├── database.py              # SQLAlchemy engine and session factory
│   │   │   └── security.py              # Password hashing and token utilities
│   │   ├── models/
│   │   │   └── schemas_db.py            # 21 Normalized SQLAlchemy relational entities
│   │   ├── schemas/
│   │   │   └── schemas_pydantic.py      # Pydantic v2 schemas and validation contracts
│   │   ├── services/
│   │   │   ├── ai_service.py            # ML inference, heuristics & anomaly engine
│   │   │   ├── event_service.py         # Immutable event ledger & WebSocket manager
│   │   │   ├── notification_service.py  # Idempotent notification dispatcher
│   │   │   └── telephony_sandbox.py     # PSTN/IVR customer voice call simulator
│   │   └── main.py                      # FastAPI app entry point, WebSockets & auto-seed
│   ├── ml/
│   │   └── train_models.py              # Script to train delay & ETA models
│   ├── models_store/
│   │   ├── delay_predictor.joblib       # Serialized Random Forest delay classifier
│   │   └── eta_predictor.joblib         # Serialized Random Forest ETA regressor
│   ├── tests/
│   │   ├── conftest.py                  # Global database and seed fixture
│   │   ├── test_ai_monitoring.py        # Tests for AI delay and anomaly detection
│   │   └── test_orders_shipments.py     # Tests for order lifecycle, POD and telephony
│   ├── Dockerfile                       # Backend containerization file
│   ├── pytest.ini                       # Pytest configuration
│   └── requirements.txt                 # Backend Python package requirements
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveMap.tsx              # Telemetry radar & visual GPS canvas
│   │   │   ├── Navbar.tsx               # Navigation across the 5 persona views
│   │   │   ├── ProofOfDeliveryModal.tsx # Courier POD verification dialog
│   │   │   ├── StatusBadge.tsx          # Dynamic 8-stage and AI risk badges
│   │   │   ├── TelephonyCallModal.tsx   # Interactive customer IVR call simulator
│   │   │   └── TrackingTimeline.tsx     # Progress stepper and event audit list
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx       # Operations & AI Radar control center
│   │   │   ├── CustomerTracking.tsx     # Public tracking portal with dispute modal
│   │   │   ├── DeliveryAgentConsole.tsx # Courier runsheet and POD submission
│   │   │   ├── SimulatorView.tsx        # Edge-case simulation and scenario lab
│   │   │   └── WarehouseTerminal.tsx    # Inbound barcode scan and bin shelving
│   │   ├── services/
│   │   │   └── api.ts                   # Typed API service client
│   │   ├── App.tsx                      # Root component with live WebSocket state
│   │   ├── index.css                    # Tailwind CSS configuration
│   │   └── main.tsx                     # Vite React entry point
│   ├── Dockerfile                       # Multi-stage frontend containerization
│   ├── nginx.conf                       # Production Nginx reverse-proxy configuration
│   ├── package.json                     # Frontend npm dependencies and scripts
│   ├── tailwind.config.js               # Tailwind CSS theme configuration
│   └── vite.config.ts                   # Vite build tool and API proxy config
├── .github/
│   └── workflows/
│       └── ci.yml                       # GitHub Actions CI/CD pipeline
├── docker-compose.yml                   # Multi-service container orchestration
├── .gitignore                           # Git ignore rules
└── README.md                            # Comprehensive project documentation
```

---

## 14. Troubleshooting & FAQ

#### Q1: Why did the tracking ID return 404 on initial launch?
**A:** Ensure the database has been seeded with demo packages (`TRK-20261020-1001`, `TRK-20261020-1002`, `TRK-20261020-1003`). The system automatically seeds these upon application startup in `lifespan`. You can also click **Re-Seed Logistics Hubs & Fleet** inside the **Simulation Lab** tab.

#### Q2: Can a courier mark an order delivered without the customer's OTP?
**A:** No. The `/proof-of-delivery` endpoint rejects submissions where `verification_type == "OTP"` and the provided code does not match the generated delivery OTP stored on the package.

#### Q3: How do I switch from SQLite to PostgreSQL?
**A:** Update the `DATABASE_URL` environment variable in `backend/.env` or Docker Compose:
```env
DATABASE_URL=postgresql://trackflow_user:trackflow_password@localhost:5432/trackflow
```

#### Q4: Are external telephony and SMS credentials required?
**A:** No. `TELEPHONY_SANDBOX=True` and `SMS_SANDBOX=True` are enabled by default. Outbound calls and customer speech responses are synthesized with full audit logging so the complete recovery lifecycle can be verified locally without third-party telecommunications fees.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
