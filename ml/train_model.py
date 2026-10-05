"""
AgriShift AI — Crop Suitability Model Training Script
======================================================
Run with:
    conda run -n ML python ml/train_model.py

Output: backend/ml_models/*.pkl  (backend auto-loads এগুলো)
"""

import numpy as np
import pandas as pd
import joblib
import os
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

import warnings
warnings.filterwarnings("ignore")

# ── Output path ───────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parent.parent
OUTPUT    = ROOT / "backend" / "ml_models"
OUTPUT.mkdir(parents=True, exist_ok=True)

print("=" * 55)
print("  AgriShift AI — Model Training")
print("=" * 55)
print(f"Output dir: {OUTPUT}\n")

# ── Synthetic Dataset ─────────────────────────────────────────────────────────
np.random.seed(42)

def make_samples(crop: str, n: int, label: str) -> pd.DataFrame:
    """প্রতিটা crop × suitability label এর জন্য realistic climate data"""
    ranges = {
        "rice": {
            "High":   dict(temp=(26,35), precip=(8,20),  hum=(70,95), soil=(0.60,1.0), solar=(15,25)),
            "Medium": dict(temp=(22,28), precip=(4,10),  hum=(55,75), soil=(0.40,0.65),solar=(12,20)),
            "Low":    dict(temp=(10,22), precip=(0, 4),  hum=(30,55), soil=(0.10,0.40),solar=(5, 14)),
        },
        "wheat": {
            "High":   dict(temp=(15,23), precip=(2, 7),  hum=(45,68), soil=(0.35,0.65),solar=(12,20)),
            "Medium": dict(temp=(12,18), precip=(1, 4),  hum=(35,50), soil=(0.25,0.40),solar=(10,16)),
            "Low":    dict(temp=(25,40), precip=(8,20),  hum=(70,95), soil=(0.60,1.0), solar=(5, 12)),
        },
        "jute": {
            "High":   dict(temp=(27,37), precip=(10,22), hum=(75,95), soil=(0.55,0.90),solar=(16,26)),
            "Medium": dict(temp=(23,29), precip=(6,12),  hum=(60,78), soil=(0.40,0.60),solar=(13,20)),
            "Low":    dict(temp=(10,23), precip=(0, 5),  hum=(30,58), soil=(0.10,0.38),solar=(5, 13)),
        },
        "maize": {
            "High":   dict(temp=(22,30), precip=(4,12),  hum=(55,80), soil=(0.35,0.70),solar=(14,24)),
            "Medium": dict(temp=(18,24), precip=(2, 6),  hum=(45,60), soil=(0.25,0.38),solar=(11,17)),
            "Low":    dict(temp=(10,18), precip=(12,25), hum=(80,98), soil=(0.70,1.0), solar=(4, 11)),
        },
    }
    r = ranges[crop][label]
    return pd.DataFrame({
        "crop":          crop,
        "temp_avg":      np.round(np.random.uniform(*r["temp"],   n), 2),
        "precipitation": np.round(np.random.uniform(*r["precip"], n), 2),
        "humidity":      np.round(np.random.uniform(*r["hum"],    n), 2),
        "soil_moisture": np.round(np.random.uniform(*r["soil"],   n), 3),
        "solar_rad":     np.round(np.random.uniform(*r["solar"],  n), 2),
        "suitability":   label,
    })


N_PER_CLASS = 500   # প্রতিটা crop × label = 500 rows → মোট 6,000 rows

frames = [
    make_samples(crop, N_PER_CLASS, label)
    for crop in ["rice", "wheat", "jute", "maize"]
    for label in ["High", "Medium", "Low"]
]
df = pd.concat(frames, ignore_index=True).sample(frac=1, random_state=42)

print(f"✅ Dataset: {len(df)} rows")
print(df["suitability"].value_counts().to_string(), "\n")

# ── Encoding ──────────────────────────────────────────────────────────────────
crop_encoder  = LabelEncoder()
label_encoder = LabelEncoder()

df["crop_enc"] = crop_encoder.fit_transform(df["crop"])
y_enc          = label_encoder.fit_transform(df["suitability"])

print("Crop  classes:", dict(zip(crop_encoder.classes_,  crop_encoder.transform(crop_encoder.classes_))))
print("Label classes:", dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_))), "\n")

FEATURES = ["crop_enc", "temp_avg", "precipitation", "humidity", "soil_moisture", "solar_rad"]
X = df[FEATURES]

# ── Train / Test Split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)
print(f"Train: {len(X_train)} | Test: {len(X_test)}\n")

# ── Model ─────────────────────────────────────────────────────────────────────
print("⏳ Training RandomForest...")
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=18,
    min_samples_split=4,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

train_acc = accuracy_score(y_train, model.predict(X_train))
test_acc  = accuracy_score(y_test,  model.predict(X_test))
print(f"Train Accuracy : {train_acc:.4f}")
print(f"Test  Accuracy : {test_acc:.4f}\n")

# ── Evaluation ────────────────────────────────────────────────────────────────
print(classification_report(
    y_test, model.predict(X_test),
    target_names=label_encoder.classes_
))

cv = cross_val_score(model, X, y_enc, cv=5, scoring="accuracy", n_jobs=-1)
print(f"5-Fold CV: {cv.mean():.4f} ± {cv.std():.4f}\n")

# Feature Importance
fi = pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False)
print("Feature Importance:")
print(fi.to_string(), "\n")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump(model,         OUTPUT / "crop_model.pkl")
joblib.dump(label_encoder, OUTPUT / "label_encoder.pkl")
joblib.dump(crop_encoder,  OUTPUT / "crop_encoder.pkl")

print("✅ Saved:")
for f in OUTPUT.glob("*.pkl"):
    print(f"   {f}  ({f.stat().st_size / 1024:.1f} KB)")

# ── Quick Test ────────────────────────────────────────────────────────────────
print("\n📋 Sanity Check:")
tests = [
    ("rice",  30, 12, 80, 0.75, 20, "High"),
    ("wheat", 18,  4, 50, 0.45, 15, "High"),
    ("jute",  32, 15, 85, 0.70, 22, "High"),
    ("maize", 12, 18, 90, 0.85,  8, "Low"),
    ("rice",  15,  2, 35, 0.20, 10, "Low"),
]
print(f"{'Crop':<8} | {'Expected':<8} | {'Got':<8} | Confidence | {'✓/?'}")
print("-" * 52)
for crop, temp, precip, hum, soil, solar, expected in tests:
    x = pd.DataFrame([{
        "crop_enc":      crop_encoder.transform([crop])[0],
        "temp_avg":      temp, "precipitation": precip,
        "humidity":      hum,  "soil_moisture": soil, "solar_rad": solar,
    }])
    pred  = label_encoder.inverse_transform(model.predict(x))[0]
    conf  = round(model.predict_proba(x).max(), 3)
    ok    = "✅" if pred == expected else "❌"
    print(f"{crop:<8} | {expected:<8} | {pred:<8} | {conf:.3f}      | {ok}")

print("\n🚀 Done! Restart backend to load the new model.")


