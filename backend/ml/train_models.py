import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error

def generate_synthetic_logistics_data(n_samples=5000):
    np.random.seed(42)
    
    # Features:
    # 1. distance_km (5 to 1500 km)
    # 2. weight_kg (0.2 to 30 kg)
    # 3. transit_hops (1 to 5 warehouses)
    # 4. warehouse_dwell_hours (0.5 to 48 hours)
    # 5. weather_severity (0: clear, 1: mild rain/snow, 2: severe storm)
    # 6. traffic_congestion (0: low, 1: medium, 2: heavy)
    # 7. carrier_historical_on_time_rate (0.6 to 0.99)
    # 8. failed_attempts_count (0 to 3)

    distance_km = np.random.uniform(5, 1200, n_samples)
    weight_kg = np.random.uniform(0.5, 25, n_samples)
    transit_hops = np.random.randint(1, 5, n_samples)
    warehouse_dwell_hours = np.random.exponential(scale=6, size=n_samples)
    weather_severity = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1], size=n_samples)
    traffic_congestion = np.random.choice([0, 1, 2], p=[0.5, 0.35, 0.15], size=n_samples)
    carrier_on_time = np.random.uniform(0.70, 0.98, n_samples)
    failed_attempts = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03], size=n_samples)

    # Calculate actual transit minutes: baseline + distance/speed + dwell + weather/traffic delays
    speed_kmh = 45.0
    transit_hours = (distance_km / speed_kmh) + warehouse_dwell_hours + (weather_severity * 4.0) + (traffic_congestion * 2.5) + (failed_attempts * 12.0)
    actual_transit_minutes = transit_hours * 60 + np.random.normal(0, 15, n_samples)
    actual_transit_minutes = np.maximum(actual_transit_minutes, 30)

    # Standard SLA expected minutes
    expected_sla_minutes = (distance_km / 50.0 + transit_hops * 4.0) * 60 + 120
    is_delayed = (actual_transit_minutes > expected_sla_minutes).astype(int)

    df = pd.DataFrame({
        "distance_km": distance_km,
        "weight_kg": weight_kg,
        "transit_hops": transit_hops,
        "warehouse_dwell_hours": warehouse_dwell_hours,
        "weather_severity": weather_severity,
        "traffic_congestion": traffic_congestion,
        "carrier_on_time": carrier_on_time,
        "failed_attempts": failed_attempts,
        "actual_transit_minutes": actual_transit_minutes,
        "is_delayed": is_delayed
    })

    return df

def train_and_save_models():
    os.makedirs("models_store", exist_ok=True)
    df = generate_synthetic_logistics_data(6000)
    
    feature_cols = [
        "distance_km", "weight_kg", "transit_hops", "warehouse_dwell_hours",
        "weather_severity", "traffic_congestion", "carrier_on_time", "failed_attempts"
    ]
    X = df[feature_cols]
    y_delay = df["is_delayed"]
    y_eta = df["actual_transit_minutes"]

    # Train Delay Classifier
    X_train, X_test, y_d_train, y_d_test = train_test_split(X, y_delay, test_size=0.2, random_state=42)
    delay_clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    delay_clf.fit(X_train, y_d_train)
    acc = accuracy_score(y_d_test, delay_clf.predict(X_test))
    print(f"Delay Classifier Accuracy: {acc * 100:.2f}%")

    # Train ETA Regressor
    X_train_eta, X_test_eta, y_eta_train, y_eta_test = train_test_split(X, y_eta, test_size=0.2, random_state=42)
    eta_reg = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    eta_reg.fit(X_train_eta, y_eta_train)
    rmse = np.sqrt(mean_squared_error(y_eta_test, eta_reg.predict(X_test_eta)))
    print(f"ETA Regressor RMSE: {rmse:.2f} minutes")

    joblib.dump(delay_clf, os.path.join("models_store", "delay_predictor.joblib"))
    joblib.dump(eta_reg, os.path.join("models_store", "eta_predictor.joblib"))
    print("Models successfully saved to models_store/")

if __name__ == "__main__":
    train_and_save_models()
