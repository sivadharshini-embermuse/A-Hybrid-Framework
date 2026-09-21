import os
import joblib
import pandas as pd

from sklearn.inspection import permutation_importance
from sklearn.metrics import roc_auc_score


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(
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
    "feature_importance.csv"
)

FEATURES = [
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


def main():

    print("Loading dataset...")

    df = pd.read_csv(DATA_FILE)

    df = df.sort_values(
        "time_stamp"
    ).reset_index(drop=True)

    X = df[FEATURES]
    y = df["contains_bug"].astype(int)

    # Same test set used in final evaluation
    n = len(df)
    test_start = int(n * 0.85)

    X_test = X.iloc[test_start:]
    y_test = y.iloc[test_start:]

    print(
        f"Test samples: {len(X_test)}"
    )

    print("\nLoading final model...")

    saved = joblib.load(MODEL_FILE)

    model = saved["model"]

    print("Model loaded successfully.")

    print("\nCalculating permutation importance...")

    baseline_auc = roc_auc_score(
        y_test,
        model.predict_proba(X_test)[:, 1]
    )

    print(
        f"Baseline ROC-AUC: {baseline_auc:.4f}"
    )

    result = permutation_importance(
        model,
        X_test,
        y_test,
        scoring="roc_auc",
        n_repeats=5,
        random_state=42,
        n_jobs=-1
    )

    importance_df = pd.DataFrame({
        "feature": FEATURES,
        "importance_mean": result.importances_mean,
        "importance_std": result.importances_std,
    })

    importance_df = importance_df.sort_values(
        "importance_mean",
        ascending=False
    ).reset_index(drop=True)

    print("\n===================================")
    print("FEATURE IMPORTANCE")
    print("===================================")

    print(
        importance_df.to_string(index=False)
    )

    importance_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        f"\nFeature importance saved to:\n{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()