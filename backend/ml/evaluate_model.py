import json
import os
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
from sklearn.dummy import DummyClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_FILE = os.path.join(BASE_DIR, "dataset", "risk-dataset.json")
MODEL_FILE = os.path.join(BASE_DIR, "model", "risk_model.pkl")

FEATURE_COLUMNS = [
    "changedLines",
    "addedLines",
    "removedLines",
    "changedFunctions",
    "changedVariables",
    "directDependencies",
    "indirectDependencies",
    "totalDependencies",
    "businessLogic",
    "stateChange",
    "uiChange",
    "apiChange",
    "routingChange",
    "stylingChange",
    "eventHandlingChange",
    "isJavaScript",
    "isCSS",
]

def load_dataset():
    if not os.path.exists(DATASET_FILE):
        raise FileNotFoundError(f"Dataset not found: {DATASET_FILE}")
    with open(DATASET_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)
    if len(data) == 0:
        raise ValueError("Dataset is empty.")
    return pd.DataFrame(data)

def main():
    print("=== DATASET STATISTICS ===")
    df = load_dataset()
    print(f"Total Samples: {len(df)}")
    print(f"Features: {len(FEATURE_COLUMNS)}")
    
    y = df["riskLevel"]
    class_counts = y.value_counts()
    print("Class Distribution:")
    for cls in ["LOW", "MEDIUM", "HIGH"]:
        count = class_counts.get(cls, 0)
        percentage = (count / len(df)) * 100
        print(f"  {cls}: {count} ({percentage:.1f}%)")

    X = df[FEATURE_COLUMNS]

    print("\n=== BASELINE COMPARISON ===")
    dummy_clf = DummyClassifier(strategy="most_frequent")
    dummy_clf.fit(X, y)
    baseline_pred = dummy_clf.predict(X)
    baseline_acc = accuracy_score(y, baseline_pred)
    
    # Load existing model for evaluation (we simulate testing on the full dataset or CV)
    model_data = joblib.load(MODEL_FILE)
    rf_model = model_data["model"]
    
    rf_pred = rf_model.predict(X)
    rf_acc = accuracy_score(y, rf_pred)
    
    print(f"Random Forest Accuracy (on full dataset): {rf_acc:.4f}")
    print(f"Majority Baseline Accuracy: {baseline_acc:.4f}")

    print("\n=== CROSS-VALIDATION ===")
    # Create a fresh model for CV to avoid leakage from the loaded model
    cv_model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(cv_model, X, y, cv=cv, scoring='accuracy')
    
    for i, score in enumerate(scores, 1):
        print(f"Fold {i}: {score:.4f}")
    print(f"Mean Accuracy: {scores.mean():.4f}")
    print(f"Std Deviation: {scores.std():.4f}")

    print("\n=== MODEL METRICS (using existing model on full dataset) ===")
    print(f"Accuracy: {accuracy_score(y, rf_pred):.4f}")
    print(f"Precision (macro): {precision_score(y, rf_pred, average='macro', zero_division=0):.4f}")
    print(f"Recall (macro): {recall_score(y, rf_pred, average='macro', zero_division=0):.4f}")
    print(f"F1 (macro): {f1_score(y, rf_pred, average='macro', zero_division=0):.4f}")
    print(f"Precision (weighted): {precision_score(y, rf_pred, average='weighted', zero_division=0):.4f}")
    print(f"Recall (weighted): {recall_score(y, rf_pred, average='weighted', zero_division=0):.4f}")
    print(f"F1 (weighted): {f1_score(y, rf_pred, average='weighted', zero_division=0):.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y, rf_pred, zero_division=0))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y, rf_pred, labels=["LOW", "MEDIUM", "HIGH"]))

    print("\n=== GLOBAL MODEL FEATURE IMPORTANCE ===")
    importances = rf_model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("Top 10 features:")
    for i in range(min(10, len(FEATURE_COLUMNS))):
        idx = indices[i]
        print(f"{i+1}. {FEATURE_COLUMNS[idx]} ({importances[idx]:.4f})")

if __name__ == "__main__":
    main()
