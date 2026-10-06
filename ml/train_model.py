"""
AgriShift AI — Crop Suitability ML Training Pipeline
=====================================================
Tasks:
1. Synthetic dataset generator based on Bangladesh AEZ agronomic ranges with realistic overlap.
2. Proper stratified train/test split (no data leakage).
3. Reproducible scikit-learn Pipeline with ColumnTransformer (StandardScaler + OneHotEncoder).
4. Multi-model comparison: Logistic Regression, Random Forest, Gradient Boosting.
5. Evaluation: Accuracy, Precision, Recall, F1-score (macro & weighted), Confusion Matrix, 5-Fold CV.
6. Saves best model pipeline, label mapping, and model_metadata.json to backend/ml_models/.
"""

import os
import json
import warnings
from datetime import datetime, timezone
from pathlib import Path

# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT_DIR   = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "backend" / "ml_models"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

CANDIDATE_CROPS = ["rice", "wheat", "maize", "jute", "potato", "mustard"]
TARGET_CLASSES  = ["High", "Medium", "Low"]

print("=" * 65)
print("  AgriShift AI — Crop Suitability Machine Learning Pipeline")
print("=" * 65)
print(f"Artifact output directory: {OUTPUT_DIR}\n")


# ── 1. Dataset Generation ──────────────────────────────────────────────────────
# Note: In the absence of an open-access empirical multi-season field survey for
# Bangladesh AEZ, we generate a synthetic benchmark based on Bangladesh-oriented
# agronomic prototype rules with added Gaussian boundary noise to reflect real-world variance.
# THIS DATASET IS SYNTHETIC AND CLEARLY FLAGGED AS SUCH.

AGRONOMIC_RANGES = {
    "rice": {
        "High":   dict(temp=(26, 34), precip=(8, 22), hum=(70, 92), soil=(0.55, 0.95), solar=(16, 24)),
        "Medium": dict(temp=(21, 27), precip=(4, 10), hum=(55, 75), soil=(0.40, 0.65), solar=(12, 18)),
        "Low":    dict(temp=(12, 21), precip=(0,  4), hum=(30, 52), soil=(0.15, 0.38), solar=(6,  14)),
    },
    "wheat": {
        "High":   dict(temp=(15, 23), precip=(1.5, 6.0), hum=(45, 68), soil=(0.32, 0.55), solar=(13, 20)),
        "Medium": dict(temp=(11, 16), precip=(0.5, 3.5), hum=(35, 52), soil=(0.22, 0.38), solar=(10, 15)),
        "Low":    dict(temp=(25, 38), precip=(7.0, 20.0), hum=(72, 95), soil=(0.60, 0.95), solar=(5,  12)),
    },
    "jute": {
        "High":   dict(temp=(26, 37), precip=(9, 24), hum=(72, 95), soil=(0.52, 0.90), solar=(16, 25)),
        "Medium": dict(temp=(22, 28), precip=(5, 12), hum=(58, 76), soil=(0.38, 0.60), solar=(12, 19)),
        "Low":    dict(temp=(12, 22), precip=(0,  5), hum=(30, 55), soil=(0.12, 0.36), solar=(5,  13)),
    },
    "maize": {
        "High":   dict(temp=(20, 29), precip=(4, 12), hum=(55, 80), soil=(0.35, 0.68), solar=(14, 23)),
        "Medium": dict(temp=(16, 22), precip=(2,  6), hum=(42, 58), soil=(0.24, 0.38), solar=(11, 16)),
        "Low":    dict(temp=(10, 17), precip=(14, 28), hum=(82, 98), soil=(0.72, 1.00), solar=(4,  11)),
    },
    "potato": {
        "High":   dict(temp=(14, 21), precip=(1.0, 4.5), hum=(58, 78), soil=(0.34, 0.55), solar=(12, 20)),
        "Medium": dict(temp=(11, 16), precip=(0.5, 3.0), hum=(48, 62), soil=(0.22, 0.38), solar=(10, 15)),
        "Low":    dict(temp=(24, 38), precip=(7.0, 22.0), hum=(78, 98), soil=(0.62, 0.98), solar=(4,  12)),
    },
    "mustard": {
        "High":   dict(temp=(13, 23), precip=(0.2, 3.5), hum=(40, 68), soil=(0.24, 0.46), solar=(13, 21)),
        "Medium": dict(temp=(10, 15), precip=(0.0, 2.0), hum=(32, 45), soil=(0.16, 0.30), solar=(10, 15)),
        "Low":    dict(temp=(25, 38), precip=(6.0, 20.0), hum=(72, 95), soil=(0.54, 0.92), solar=(5,  12)),
    },
}

def generate_synthetic_samples(n_per_class: int = 500) -> pd.DataFrame:
    records = []
    for crop in CANDIDATE_CROPS:
        for label in TARGET_CLASSES:
            cfg = AGRONOMIC_RANGES[crop][label]
            # Draw uniform random samples inside range
            temps   = np.random.uniform(*cfg["temp"],   n_per_class)
            precips = np.random.uniform(*cfg["precip"], n_per_class)
            hums    = np.random.uniform(*cfg["hum"],    n_per_class)
            soils   = np.random.uniform(*cfg["soil"],   n_per_class)
            solars  = np.random.uniform(*cfg["solar"],  n_per_class)

            # Add mild Gaussian boundary noise (5% std) to simulate real-world sensor variability
            temps   += np.random.normal(0, 0.6, n_per_class)
            precips += np.random.normal(0, 0.4, n_per_class)
            hums    += np.random.normal(0, 1.2, n_per_class)
            soils   += np.random.normal(0, 0.02, n_per_class)
            solars  += np.random.normal(0, 0.5, n_per_class)

            # Clamp to physical bounds
            precips = np.clip(precips, 0.0, None)
            hums    = np.clip(hums, 15.0, 100.0)
            soils   = np.clip(soils, 0.05, 1.0)
            solars  = np.clip(solars, 2.0, 30.0)

            for i in range(n_per_class):
                records.append({
                    "crop":          crop,
                    "temp_avg":      round(float(temps[i]), 2),
                    "precipitation": round(float(precips[i]), 2),
                    "humidity":      round(float(hums[i]), 2),
                    "soil_moisture": round(float(soils[i]), 3),
                    "solar_rad":     round(float(solars[i]), 2),
                    "suitability":   label,
                })

    df = pd.DataFrame(records).sample(frac=1.0, random_state=RANDOM_STATE).reset_index(drop=True)
    return df


print("1. Generating synthetic training benchmark...")
raw_df = generate_synthetic_samples(n_per_class=500)
print(f"   Total rows: {len(raw_df)}")
print(f"   Target distribution:\n{raw_df['suitability'].value_counts().to_string()}\n")


# ── 2. Identify Features and Target ───────────────────────────────────────────
CATEGORICAL_FEATURES = ["crop"]
NUMERICAL_FEATURES   = ["temp_avg", "precipitation", "humidity", "soil_moisture", "solar_rad"]
ALL_FEATURES         = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
TARGET_COLUMN        = "suitability"

X = raw_df[ALL_FEATURES]
y = raw_df[TARGET_COLUMN]

print("2. Features & Target:")
print(f"   Categorical features : {CATEGORICAL_FEATURES}")
print(f"   Numerical features   : {NUMERICAL_FEATURES}")
print(f"   Target column        : '{TARGET_COLUMN}' ({TARGET_CLASSES})\n")


# ── 3 & 4. Train / Test Split (Strictly Stratified, Zero Leakage) ──────────────
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y,
)
print("3 & 4. Train/Test Split (Stratified 80/20):")
print(f"   Train samples: {len(X_train)} (80%)")
print(f"   Test samples : {len(X_test)} (20%)")
print("   Data leakage check: Preprocessing pipeline is fitted ONLY on X_train.\n")


# ── 5. Reproducible Sklearn Preprocessor ────────────────────────────────────────
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), NUMERICAL_FEATURES),
        (
            "cat",
            OneHotEncoder(
                categories=[CANDIDATE_CROPS],
                handle_unknown="ignore",
                sparse_output=False,
            ),
            CATEGORICAL_FEATURES,
        ),
    ]
)


# ── 6. Model Candidates ────────────────────────────────────────────────────────
models = {
    "LogisticRegression": LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    ),
    "RandomForest": RandomForestClassifier(
        n_estimators=200,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    ),
    "GradientBoosting": GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=5,
        random_state=RANDOM_STATE,
    ),
}

results = {}
cv_kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

print("5 & 6. Training & Comparing Candidate Models:")
print("-" * 65)

for name, clf in models.items():
    pipe = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", clf),
    ])

    # 5-Fold Stratified Cross-Validation on Training Set
    cv_scores = cross_validate(
        pipe,
        X_train,
        y_train,
        cv=cv_kfold,
        scoring=["accuracy", "f1_macro"],
        n_jobs=-1,
    )
    cv_acc_mean = float(cv_scores["test_accuracy"].mean())
    cv_acc_std  = float(cv_scores["test_accuracy"].std())
    cv_f1_mean  = float(cv_scores["test_f1_macro"].mean())

    # Fit on full training set
    pipe.fit(X_train, y_train)

    # Evaluate on held-out test set
    y_pred = pipe.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average="macro"))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted"))
    rec_macro = float(recall_score(y_test, y_pred, average="macro"))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted"))
    f1_mac = float(f1_score(y_test, y_pred, average="macro"))
    f1_wt  = float(f1_score(y_test, y_pred, average="weighted"))
    cm = confusion_matrix(y_test, y_pred, labels=TARGET_CLASSES).tolist()
    report = classification_report(y_test, y_pred, target_names=TARGET_CLASSES, output_dict=True)

    results[name] = {
        "pipeline": pipe,
        "accuracy": acc,
        "precision_macro": prec_macro,
        "precision_weighted": prec_weighted,
        "recall_macro": rec_macro,
        "recall_weighted": rec_weighted,
        "f1_macro": f1_mac,
        "f1_weighted": f1_wt,
        "cv_accuracy_mean": cv_acc_mean,
        "cv_accuracy_std": cv_acc_std,
        "cv_f1_macro_mean": cv_f1_mean,
        "confusion_matrix": cm,
        "classification_report": report,
    }

    print(f"▶ Model: {name:<20}")
    print(f"    5-Fold CV Accuracy : {cv_acc_mean:.4f} ± {cv_acc_std:.4f}")
    print(f"    Test Accuracy      : {acc:.4f}")
    print(f"    Test Precision (M) : {prec_macro:.4f} | Weighted: {prec_weighted:.4f}")
    print(f"    Test Recall (M)    : {rec_macro:.4f} | Weighted: {rec_weighted:.4f}")
    print(f"    Test F1-Score (M)  : {f1_mac:.4f} | Weighted: {f1_wt:.4f}\n")


# ── 7. Confusion Matrices ──────────────────────────────────────────────────────
print("7. Detailed Confusion Matrices (Rows: True, Cols: Predicted [High, Medium, Low]):")
for name, data in results.items():
    print(f"\n--- {name} Confusion Matrix ---")
    cm_arr = np.array(data["confusion_matrix"])
    print(f"{'':>10} {'Pred High':>12} {'Pred Med':>12} {'Pred Low':>12}")
    for idx, true_cls in enumerate(TARGET_CLASSES):
        print(f"{'True ' + true_cls:>10}: {cm_arr[idx, 0]:>12} {cm_arr[idx, 1]:>12} {cm_arr[idx, 2]:>12}")


# ── 8 & 9. Select Best Model and Save Artifacts ────────────────────────────────
best_model_name = max(results.keys(), key=lambda k: results[k]["f1_macro"])
best_entry = results[best_model_name]
best_pipeline = best_entry["pipeline"]

print("\n" + "=" * 65)
print(f"8. Best Model Selected: {best_model_name} (F1-macro: {best_entry['f1_macro']:.4f})")
print("=" * 65)

# Save pipeline (includes both preprocessor and classifier)
pipeline_file = OUTPUT_DIR / "best_model_pipeline.joblib"
joblib.dump(best_pipeline, pipeline_file)
print(f"   Saved best pipeline: {pipeline_file} ({pipeline_file.stat().st_size / 1024:.1f} KB)")

# Also save standalone legacy crop_model.pkl and encoders for backwards compatibility
legacy_model_file = OUTPUT_DIR / "crop_model.pkl"
joblib.dump(best_pipeline.named_steps["classifier"], legacy_model_file)


# ── 10. Model Metadata JSON ────────────────────────────────────────────────────
metadata = {
    "model_name": best_model_name,
    "algorithm_family": best_pipeline.named_steps["classifier"].__class__.__name__,
    "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
    "feature_names": {
        "categorical": CATEGORICAL_FEATURES,
        "numerical": NUMERICAL_FEATURES,
        "all_input_features": ALL_FEATURES,
    },
    "candidate_crops": CANDIDATE_CROPS,
    "target_classes": TARGET_CLASSES,
    "best_model_metrics": {
        "test_accuracy": best_entry["accuracy"],
        "test_precision_macro": best_entry["precision_macro"],
        "test_precision_weighted": best_entry["precision_weighted"],
        "test_recall_macro": best_entry["recall_macro"],
        "test_recall_weighted": best_entry["recall_weighted"],
        "test_f1_macro": best_entry["f1_macro"],
        "test_f1_weighted": best_entry["f1_weighted"],
        "cv_5fold_accuracy_mean": best_entry["cv_accuracy_mean"],
        "cv_5fold_accuracy_std": best_entry["cv_accuracy_std"],
        "confusion_matrix": best_entry["confusion_matrix"],
    },
    "all_models_comparison": {
        name: {
            "accuracy": d["accuracy"],
            "f1_macro": d["f1_macro"],
            "precision_macro": d["precision_macro"],
            "recall_macro": d["recall_macro"],
            "cv_accuracy_mean": d["cv_accuracy_mean"],
        }
        for name, d in results.items()
    },
    "dataset": {
        "source": "Programmatic Synthetic Agronomic Simulator (AEZ Bangladesh Rules)",
        "version": "2.0-synthetic-noisy",
        "is_synthetic": True,
        "total_samples": len(raw_df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "sampling_method": "Uniform distribution with 5% Gaussian boundary noise across Bangladesh-oriented agronomic prototype rules",
        "limitations": (
            "CRITICAL ACADEMIC NOTE: This dataset was programmatically generated from agronomic physiological "
            "rules rather than an empirical multi-year field trial. While it reflects Bangladesh-oriented "
            "agronomic prototype rules, real-world microclimate interactions, soil microbiomes, and pest vectors require future "
            "validation with empirical farmer yield records."
        ),
    },
    "inference_schema": {
        "type": "object",
        "properties": {
            "crop": {"type": "string", "enum": CANDIDATE_CROPS},
            "temp_avg": {"type": "number", "unit": "°C"},
            "precipitation": {"type": "number", "unit": "mm"},
            "humidity": {"type": "number", "unit": "%"},
            "soil_moisture": {"type": "number", "unit": "0.0-1.0 fraction"},
            "solar_rad": {"type": "number", "unit": "kWh/m²/day"},
        },
        "required": ["crop", "temp_avg", "precipitation", "humidity", "soil_moisture"],
    },
}

metadata_file = OUTPUT_DIR / "model_metadata.json"
with open(metadata_file, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print(f"10. Saved metadata JSON: {metadata_file} ({metadata_file.stat().st_size / 1024:.1f} KB)")


# ── Sanity Inference Verification ──────────────────────────────────────────────
print("\n11. Sanity Inference Verification on Pipeline:")
sample_tests = [
    {"crop": "rice",   "temp_avg": 29.0, "precipitation": 14.0, "humidity": 82.0, "soil_moisture": 0.75, "solar_rad": 18.0},
    {"crop": "wheat",  "temp_avg": 18.0, "precipitation": 2.5,  "humidity": 55.0, "soil_moisture": 0.42, "solar_rad": 15.0},
    {"crop": "potato", "temp_avg": 17.0, "precipitation": 2.0,  "humidity": 68.0, "soil_moisture": 0.45, "solar_rad": 16.0},
    {"crop": "wheat",  "temp_avg": 32.0, "precipitation": 15.0, "humidity": 88.0, "soil_moisture": 0.85, "solar_rad": 10.0},
]

test_df = pd.DataFrame(sample_tests)
loaded_pipe = joblib.load(pipeline_file)
preds = loaded_pipe.predict(test_df)
probs = loaded_pipe.predict_proba(test_df)

for i, t in enumerate(sample_tests):
    pred_cls = preds[i]
    prob_dict = {cls: round(probs[i][j], 3) for j, cls in enumerate(loaded_pipe.classes_)}
    print(f"   [{t['crop']:<6}] Temp: {t['temp_avg']}°C, Precip: {t['precipitation']}mm -> Pred: {pred_cls:<6} (Probs: {prob_dict})")

print("\nPipeline training and verification complete!")
