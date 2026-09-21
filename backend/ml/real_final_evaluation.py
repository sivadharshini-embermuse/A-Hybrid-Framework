import os
import joblib
import pandas as pd

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "real_labels.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "real_hgb_model.pkl"
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

    # Chronological ordering
    df = df.sort_values("time_stamp").reset_index(drop=True)

    X = df[FEATURES]
    y = df["contains_bug"].astype(int)

    # Same temporal boundaries used in baseline experiment
    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    X_train = X.iloc[:train_end]
    y_train = y.iloc[:train_end]

    X_validation = X.iloc[train_end:validation_end]
    y_validation = y.iloc[train_end:validation_end]

    X_test = X.iloc[validation_end:]
    y_test = y.iloc[validation_end:]

    print("\nDataset:", n)
    print("Train:", len(X_train))
    print("Validation:", len(X_validation))
    print("Test:", len(X_test))

    # --------------------------------------------------
    # STEP 1: Select HGB based on previous validation
    # --------------------------------------------------

    print("\nPrevious validation winner:")
    print("HistGradientBoosting")

    # --------------------------------------------------
    # STEP 2: Retrain on TRAIN + VALIDATION
    # --------------------------------------------------

    X_train_validation = pd.concat(
        [X_train, X_validation],
        ignore_index=True
    )

    y_train_validation = pd.concat(
        [y_train, y_validation],
        ignore_index=True
    )

    print(
        "\nRetraining HistGradientBoosting on "
        f"{len(X_train_validation)} samples..."
    )

    model = HistGradientBoostingClassifier(
        max_iter=300,
        random_state=42
    )

    model.fit(
        X_train_validation,
        y_train_validation
    )

    # --------------------------------------------------
    # STEP 3: FINAL TEST EVALUATION
    # --------------------------------------------------

    print("\nEvaluating on untouched TEST set...")

    predictions = model.predict(X_test)

    probabilities = model.predict_proba(X_test)[:, 1]

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

    print("\n===================================")
    print("FINAL TEST RESULTS")
    print("===================================")

    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1-score  : {f1:.4f}")
    print(f"ROC-AUC   : {roc_auc:.4f}")
    print(f"PR-AUC    : {pr_auc:.4f}")

    print("\nConfusion Matrix:")

    cm = confusion_matrix(
        y_test,
        predictions
    )

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

    # --------------------------------------------------
    # STEP 4: Save final model
    # --------------------------------------------------

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    joblib.dump(
        {
            "model": model,
            "features": FEATURES,
        },
        MODEL_FILE
    )

    print(
        f"\nFinal model saved to:\n{MODEL_FILE}"
    )


if __name__ == "__main__":
    main()