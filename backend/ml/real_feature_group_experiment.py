import os
import joblib
import pandas as pd

from sklearn.ensemble import HistGradientBoostingClassifier
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
    "real_labels.csv",
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "feature_group_results.csv",
)


TRADITIONAL_FEATURES = [
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
]

JAVASCRIPT_FEATURES = [
    "htmlcss",
    "strict",
    "bdom",
    "so",
    "tc",
]


def evaluate_model(name, features, X_train, y_train, X_val, y_val):

    print(f"\nTraining: {name}")

    model = HistGradientBoostingClassifier(
        max_iter=200,
        learning_rate=0.1,
        max_leaf_nodes=31,
        random_state=42,
    )

    model.fit(X_train[features], y_train)

    probabilities = model.predict_proba(
        X_val[features]
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    results = {
        "model": name,
        "features": len(features),
        "precision": precision_score(
            y_val,
            predictions,
            zero_division=0,
        ),
        "recall": recall_score(
            y_val,
            predictions,
            zero_division=0,
        ),
        "f1": f1_score(
            y_val,
            predictions,
            zero_division=0,
        ),
        "roc_auc": roc_auc_score(
            y_val,
            probabilities,
        ),
        "pr_auc": average_precision_score(
            y_val,
            probabilities,
        ),
    }

    print(
        f"Precision : {results['precision']:.4f}"
    )
    print(
        f"Recall    : {results['recall']:.4f}"
    )
    print(
        f"F1        : {results['f1']:.4f}"
    )
    print(
        f"ROC-AUC   : {results['roc_auc']:.4f}"
    )
    print(
        f"PR-AUC    : {results['pr_auc']:.4f}"
    )

    return results


def main():

    print("Loading dataset...")

    df = pd.read_csv(DATA_FILE)

    df = df.sort_values(
        "time_stamp"
    ).reset_index(drop=True)

    n = len(df)

    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]

    X_train = train_df[
        TRADITIONAL_FEATURES +
        JAVASCRIPT_FEATURES
    ]

    y_train = train_df[
        "contains_bug"
    ].astype(int)

    X_val = val_df[
        TRADITIONAL_FEATURES +
        JAVASCRIPT_FEATURES
    ]

    y_val = val_df[
        "contains_bug"
    ].astype(int)

    print(
        f"\nTrain samples: {len(train_df)}"
    )

    print(
        f"Validation samples: {len(val_df)}"
    )

    results = []

    # Experiment 1
    results.append(
        evaluate_model(
            "Traditional JIT Features",
            TRADITIONAL_FEATURES,
            X_train,
            y_train,
            X_val,
            y_val,
        )
    )

    # Experiment 2
    results.append(
        evaluate_model(
            "Traditional + JavaScript Features",
            TRADITIONAL_FEATURES +
            JAVASCRIPT_FEATURES,
            X_train,
            y_train,
            X_val,
            y_val,
        )
    )

    results_df = pd.DataFrame(results)

    print(
        "\n==================================="
    )
    print(
        "FEATURE GROUP COMPARISON"
    )
    print(
        "==================================="
    )

    print(
        results_df.to_string(
            index=False
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
    