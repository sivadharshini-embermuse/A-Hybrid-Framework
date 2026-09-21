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
    "real_labels.csv",
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "model",
    "real_hgb_model.pkl",
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "per_project_test_results.csv",
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

    validation_end = int(n * 0.85)

    test = df.iloc[validation_end:].copy()

    print(f"Test samples: {len(test)}")
    print(f"Projects: {test['project'].nunique()}")

    print("\nLoading final model...")

    bundle = joblib.load(MODEL_FILE)

    if isinstance(bundle, dict) and "model" in bundle:
        model = bundle["model"]
    else:
        model = bundle

    print("Model loaded successfully.")

    results = []

    for project, group in test.groupby("project"):

        X = group[FEATURE_COLUMNS]
        y = group["contains_bug"].astype(int)

        probabilities = model.predict_proba(X)[:, 1]

        predictions = (
            probabilities >= THRESHOLD
        ).astype(int)

        precision = precision_score(
            y,
            predictions,
            zero_division=0,
        )

        recall = recall_score(
            y,
            predictions,
            zero_division=0,
        )

        f1 = f1_score(
            y,
            predictions,
            zero_division=0,
        )

        bug_rate = y.mean()

        if y.nunique() == 2:
            roc_auc = roc_auc_score(
                y,
                probabilities,
            )

            pr_auc = average_precision_score(
                y,
                probabilities,
            )
        else:
            roc_auc = None
            pr_auc = None

        results.append({
            "project": project,
            "samples": len(group),
            "bugs": int(y.sum()),
            "bug_rate": bug_rate,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
        })

    results_df = pd.DataFrame(results)

    results_df = results_df.sort_values(
        "f1",
        ascending=False,
    )

    print("\n===================================")
    print("PER-PROJECT TEST RESULTS")
    print("===================================")

    print(
        results_df.to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}",
        )
    )

    print("\n===================================")
    print("BEST PROJECTS BY F1")
    print("===================================")

    print(
        results_df[
            [
                "project",
                "samples",
                "bug_rate",
                "precision",
                "recall",
                "f1",
                "roc_auc",
                "pr_auc",
            ]
        ].head(5).to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}",
        )
    )

    print("\n===================================")
    print("LOWEST PROJECTS BY F1")
    print("===================================")

    print(
        results_df[
            [
                "project",
                "samples",
                "bug_rate",
                "precision",
                "recall",
                "f1",
            ]
        ].tail(5).to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}",
        )
    )

    results_df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print(
        f"\nResults saved to:\n{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()