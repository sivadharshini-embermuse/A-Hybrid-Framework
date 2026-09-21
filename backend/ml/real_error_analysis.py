import os
import pandas as pd
import numpy as np
import joblib

from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    precision_score,
    recall_score,
    f1_score,
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

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
)

ERROR_FILE = os.path.join(
    OUTPUT_DIR,
    "error_analysis.csv",
)

PROJECT_ERROR_FILE = os.path.join(
    OUTPUT_DIR,
    "project_error_analysis.csv",
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


def load_test_data():

    print("Loading dataset...")

    df = pd.read_csv(DATASET_FILE)

    df = df.sort_values(
        "time_stamp"
    ).reset_index(drop=True)

    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    test_df = df.iloc[
        validation_end:
    ].copy()

    print(f"Test samples: {len(test_df)}")

    return test_df


def load_model():

    print("\nLoading final model...")

    bundle = joblib.load(MODEL_FILE)

    # Support both bundled and direct sklearn models
    if isinstance(bundle, dict) and "model" in bundle:
        model = bundle["model"]
    else:
        model = bundle

    print("Model loaded successfully.")

    return model


def create_error_labels(
    y_true,
    probabilities,
):

    predictions = (
        probabilities >= THRESHOLD
    ).astype(int)

    labels = []

    for actual, predicted in zip(
        y_true,
        predictions,
    ):

        if actual == 1 and predicted == 1:
            labels.append("True Positive")

        elif actual == 0 and predicted == 0:
            labels.append("True Negative")

        elif actual == 0 and predicted == 1:
            labels.append("False Positive")

        else:
            labels.append("False Negative")

    return predictions, labels


def main():

    test_df = load_test_data()

    model = load_model()

    X_test = test_df[
        FEATURE_COLUMNS
    ]

    y_test = (
        test_df["contains_bug"]
        .astype(int)
        .values
    )

    print(
        f"\nLocked threshold: {THRESHOLD}"
    )

    print(
        "\nGenerating predictions..."
    )

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions, error_labels = (
        create_error_labels(
            y_test,
            probabilities,
        )
    )

    test_df["bug_probability"] = probabilities

    test_df["prediction"] = predictions

    test_df["error_type"] = error_labels

    # --------------------------------------------------
    # Overall metrics
    # --------------------------------------------------

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    cm = confusion_matrix(
        y_test,
        predictions,
    )

    tn, fp, fn, tp = cm.ravel()

    print("\n===================================")
    print("ERROR ANALYSIS")
    print("===================================")

    print(f"Threshold       : {THRESHOLD}")
    print(f"Precision       : {precision:.4f}")
    print(f"Recall          : {recall:.4f}")
    print(f"F1-score        : {f1:.4f}")

    print("\nConfusion Matrix:")
    print(cm)

    print("\nError Counts:")
    print(f"True Positives  : {tp}")
    print(f"True Negatives  : {tn}")
    print(f"False Positives : {fp}")
    print(f"False Negatives : {fn}")

    print("\nError Rates:")

    total = len(test_df)

    print(
        f"False Positive Rate : "
        f"{fp / (fp + tn):.4f}"
    )

    print(
        f"False Negative Rate : "
        f"{fn / (fn + tp):.4f}"
    )

    # --------------------------------------------------
    # Error type distribution
    # --------------------------------------------------

    print(
        "\nError Type Distribution:"
    )

    print(
        test_df["error_type"]
        .value_counts()
        .to_string()
    )

    # --------------------------------------------------
    # Feature statistics by error type
    # --------------------------------------------------

    print(
        "\n==================================="
    )
    print(
        "FEATURE PROFILE BY ERROR TYPE"
    )
    print(
        "==================================="
    )

    profile = (
        test_df
        .groupby("error_type")[FEATURE_COLUMNS]
        .mean()
        .round(4)
    )

    print(
        profile.to_string()
    )

    # --------------------------------------------------
    # Save detailed error analysis
    # --------------------------------------------------

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True,
    )

    columns_to_save = [
        "project",
        "commit_id",
        "contains_bug",
        "bug_probability",
        "prediction",
        "error_type",
        "time_stamp",
    ] + FEATURE_COLUMNS

    test_df[
        columns_to_save
    ].to_csv(
        ERROR_FILE,
        index=False,
    )

    # --------------------------------------------------
    # Per-project error analysis
    # --------------------------------------------------

    project_results = []

    for project, group in test_df.groupby(
        "project"
    ):

        actual = group[
            "contains_bug"
        ].astype(int)

        predicted = group[
            "prediction"
        ].astype(int)

        project_tp = (
            (
                (actual == 1)
                & (predicted == 1)
            )
            .sum()
        )

        project_tn = (
            (
                (actual == 0)
                & (predicted == 0)
            )
            .sum()
        )

        project_fp = (
            (
                (actual == 0)
                & (predicted == 1)
            )
            .sum()
        )

        project_fn = (
            (
                (actual == 1)
                & (predicted == 0)
            )
            .sum()
        )

        project_precision = (
            precision_score(
                actual,
                predicted,
                zero_division=0,
            )
        )

        project_recall = (
            recall_score(
                actual,
                predicted,
                zero_division=0,
            )
        )

        project_f1 = (
            f1_score(
                actual,
                predicted,
                zero_division=0,
            )
        )

        project_results.append(
            {
                "project": project,
                "samples": len(group),
                "bugs": int(actual.sum()),
                "true_positive": int(project_tp),
                "true_negative": int(project_tn),
                "false_positive": int(project_fp),
                "false_negative": int(project_fn),
                "precision": project_precision,
                "recall": project_recall,
                "f1": project_f1,
            }
        )

    project_df = pd.DataFrame(
        project_results
    )

    project_df = project_df.sort_values(
        "f1",
        ascending=False,
    )

    print(
        "\n==================================="
    )
    print(
        "PROJECT ERROR ANALYSIS"
    )
    print(
        "==================================="
    )

    print(
        project_df.to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}",
        )
    )

    project_df.to_csv(
        PROJECT_ERROR_FILE,
        index=False,
    )

    # --------------------------------------------------
    # Final output
    # --------------------------------------------------

    print(
        "\n==================================="
    )
    print(
        "FILES SAVED"
    )
    print(
        "==================================="
    )

    print(
        f"Detailed errors:\n{ERROR_FILE}"
    )

    print(
        f"\nProject errors:\n"
        f"{PROJECT_ERROR_FILE}"
    )


if __name__ == "__main__":
    main()