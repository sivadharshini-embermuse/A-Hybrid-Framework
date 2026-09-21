import os
import joblib
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
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

RESULT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "baseline_results.csv"
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


def evaluate_model(model, X, y):
    predictions = model.predict(X)
    probabilities = model.predict_proba(X)[:, 1]

    return {
        "precision": precision_score(
            y, predictions, zero_division=0
        ),
        "recall": recall_score(
            y, predictions, zero_division=0
        ),
        "f1": f1_score(
            y, predictions, zero_division=0
        ),
        "roc_auc": roc_auc_score(
            y, probabilities
        ),
        "pr_auc": average_precision_score(
            y, probabilities
        ),
    }


def main():

    print("Loading real dataset...")

    df = pd.read_csv(DATA_FILE)

    # Sort chronologically
    df = df.sort_values("time_stamp").reset_index(drop=True)

    X = df[FEATURES]
    y = df["contains_bug"].astype(int)

    # Time-based split
    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    X_train = X.iloc[:train_end]
    y_train = y.iloc[:train_end]

    X_val = X.iloc[train_end:validation_end]
    y_val = y.iloc[train_end:validation_end]

    X_test = X.iloc[validation_end:]
    y_test = y.iloc[validation_end:]

    print("\nDataset:", n)
    print("Train:", len(X_train))
    print("Validation:", len(X_val))
    print("Test:", len(X_test))

    print("\nTraining models...")

    models = {

        "Logistic Regression": LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=42
        ),

        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ),

        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=300,
            random_state=42
        ),
    }

    results = []

    for name, model in models.items():

        print(f"\nTraining: {name}")

        model.fit(X_train, y_train)

        metrics = evaluate_model(
            model,
            X_val,
            y_val
        )

        print(
            f"Precision : {metrics['precision']:.4f}"
        )
        print(
            f"Recall    : {metrics['recall']:.4f}"
        )
        print(
            f"F1        : {metrics['f1']:.4f}"
        )
        print(
            f"ROC-AUC   : {metrics['roc_auc']:.4f}"
        )
        print(
            f"PR-AUC    : {metrics['pr_auc']:.4f}"
        )

        results.append({
            "model": name,
            **metrics
        })

    results_df = pd.DataFrame(results)

    print("\n==============================")
    print("VALIDATION RESULTS")
    print("==============================")
    print(
        results_df.sort_values(
            "f1",
            ascending=False
        ).to_string(index=False)
    )

    os.makedirs(
        os.path.dirname(RESULT_FILE),
        exist_ok=True
    )

    results_df.to_csv(
        RESULT_FILE,
        index=False
    )

    print(
        f"\nResults saved to:\n{RESULT_FILE}"
    )


if __name__ == "__main__":
    main()