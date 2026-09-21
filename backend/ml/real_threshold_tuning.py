import os
import joblib
import pandas as pd

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
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


def load_data():

    print("Loading dataset...")

    df = pd.read_csv(DATASET_FILE)

    df = df.sort_values("time_stamp").reset_index(drop=True)

    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    validation = df.iloc[train_end:validation_end].copy()

    X_validation = validation[FEATURE_COLUMNS]
    y_validation = validation["contains_bug"].astype(int)

    print(f"Validation samples: {len(validation)}")

    return X_validation, y_validation


def main():

    X_validation, y_validation = load_data()

    print("\nLoading final model...")

    bundle = joblib.load(MODEL_FILE)

    if isinstance(bundle, dict) and "model" in bundle:
        model = bundle["model"]
    else:
        model = bundle

    print("Model loaded successfully.")

    probabilities = model.predict_proba(X_validation)[:, 1]

    roc_auc = roc_auc_score(
        y_validation,
        probabilities
    )

    pr_auc = average_precision_score(
        y_validation,
        probabilities
    )

    print("\n===================================")
    print("THRESHOLD TUNING")
    print("===================================")

    print(f"ROC-AUC : {roc_auc:.4f}")
    print(f"PR-AUC  : {pr_auc:.4f}")

    thresholds = [
        0.20,
        0.25,
        0.30,
        0.35,
        0.40,
        0.45,
        0.50,
        0.55,
        0.60,
        0.65,
        0.70,
    ]

    results = []

    print("\nThreshold Performance:")
    print(
        f"{'Threshold':<12}"
        f"{'Precision':<12}"
        f"{'Recall':<12}"
        f"{'F1':<12}"
    )

    for threshold in thresholds:

        predictions = (
            probabilities >= threshold
        ).astype(int)

        precision = precision_score(
            y_validation,
            predictions,
            zero_division=0
        )

        recall = recall_score(
            y_validation,
            predictions,
            zero_division=0
        )

        f1 = f1_score(
            y_validation,
            predictions,
            zero_division=0
        )

        results.append({
            "threshold": threshold,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
        })

        print(
            f"{threshold:<12.2f}"
            f"{precision:<12.4f}"
            f"{recall:<12.4f}"
            f"{f1:<12.4f}"
        )

    results_df = pd.DataFrame(results)

    best = results_df.loc[
        results_df["f1"].idxmax()
    ]

    print("\n===================================")
    print("BEST THRESHOLD")
    print("===================================")

    print(
        f"Threshold : {best['threshold']:.2f}"
    )

    print(
        f"Precision : {best['precision']:.4f}"
    )

    print(
        f"Recall    : {best['recall']:.4f}"
    )

    print(
        f"F1-score  : {best['f1']:.4f}"
    )

    print(
        f"ROC-AUC   : {best['roc_auc']:.4f}"
    )

    print(
        f"PR-AUC    : {best['pr_auc']:.4f}"
    )

    output_file = os.path.join(
        BASE_DIR,
        "real_dataset",
        "processed",
        "threshold_results.csv"
    )

    results_df.to_csv(
        output_file,
        index=False
    )

    print(
        f"\nResults saved to:\n{output_file}"
    )


if __name__ == "__main__":
    main()