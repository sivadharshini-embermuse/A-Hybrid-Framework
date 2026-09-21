import os
import joblib
import pandas as pd

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "real_labels.csv"
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "model",
    "real_hgb_model.pkl"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "final_test_results_threshold_040.csv"
)

FEATURE_COLUMNS = [
    "ns",
    "nd",
    "nf",
    "entropy",
    "la",
    "ld",
    "lt",
    "is_fix",
    "ndev",
    "age",
    "nuc",
    "exp",
    "rexp",
    "sexp",
    "htmlcss",
    "strict",
    "bdom",
    "so",
    "tc",
]

THRESHOLD = 0.40


def main():

    print("Loading dataset...")

    df = pd.read_csv(DATASET_FILE)

    df = df.sort_values("time_stamp").reset_index(drop=True)

    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    test = df.iloc[validation_end:].copy()

    X_test = test[FEATURE_COLUMNS]
    y_test = test["contains_bug"].astype(int)

    print(f"Test samples: {len(test)}")

    print("\nLoading final model...")

    bundle = joblib.load(MODEL_FILE)

    if isinstance(bundle, dict) and "model" in bundle:
        model = bundle["model"]
    else:
        model = bundle

    print("Model loaded successfully.")

    print(f"\nLocked threshold: {THRESHOLD}")

    probabilities = model.predict_proba(X_test)[:, 1]

    predictions = (
        probabilities >= THRESHOLD
    ).astype(int)

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities
    )

    cm = confusion_matrix(
        y_test,
        predictions
    )

    print("\n===================================")
    print("FINAL TEST RESULTS")
    print("===================================")

    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1-score  : {f1:.4f}")
    print(f"ROC-AUC   : {roc_auc:.4f}")
    print(f"PR-AUC    : {pr_auc:.4f}")

    print("\nConfusion Matrix:")
    print(cm)

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Non-Bug",
                "Bug"
            ],
            zero_division=0
        )
    )

    results = pd.DataFrame([
        {
            "threshold": THRESHOLD,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
            "true_negative": cm[0, 0],
            "false_positive": cm[0, 1],
            "false_negative": cm[1, 0],
            "true_positive": cm[1, 1],
            "test_samples": len(test),
        }
    ])

    results.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nResults saved to:\n{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()