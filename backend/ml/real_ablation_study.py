import os
import pandas as pd

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
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
    "ablation_results.csv",
)

ALL_FEATURES = [
    "ns", "nd", "nf", "entropy",
    "la", "ld", "lt", "is_fix",
    "ndev", "age", "nuc",
    "exp", "rexp", "sexp",
    "htmlcss", "strict", "bdom",
    "so", "tc",
]

JS_FEATURES = [
    "htmlcss",
    "strict",
    "bdom",
    "so",
    "tc",
]

TOP_FEATURES = [
    "la",
    "exp",
    "sexp",
    "rexp",
    "entropy",
    "lt",
    "ld",
    "nuc",
    "nd",
    "ndev",
]


def evaluate(name, features, X_train, y_train, X_val, y_val):

    print(f"\nTraining: {name}")
    print(f"Features: {len(features)}")

    model = HistGradientBoostingClassifier(
        max_iter=200,
        learning_rate=0.1,
        max_leaf_nodes=31,
        random_state=42,
    )

    model.fit(
        X_train[features],
        y_train,
    )

    probabilities = model.predict_proba(
        X_val[features]
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    result = {
        "experiment": name,
        "feature_count": len(features),
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

    print(f"F1      : {result['f1']:.4f}")
    print(f"ROC-AUC : {result['roc_auc']:.4f}")
    print(f"PR-AUC  : {result['pr_auc']:.4f}")

    return result


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

    X_train = train_df[ALL_FEATURES]
    y_train = train_df["contains_bug"].astype(int)

    X_val = val_df[ALL_FEATURES]
    y_val = val_df["contains_bug"].astype(int)

    results = []

    # 1. All features
    results.append(
        evaluate(
            "All 19 Features",
            ALL_FEATURES,
            X_train,
            y_train,
            X_val,
            y_val,
        )
    )

    # 2. Traditional only
    traditional = [
        f for f in ALL_FEATURES
        if f not in JS_FEATURES
    ]

    results.append(
        evaluate(
            "Traditional 14 Features",
            traditional,
            X_train,
            y_train,
            X_val,
            y_val,
        )
    )

    # 3. Without LA
    without_la = [
        f for f in ALL_FEATURES
        if f != "la"
    ]

    results.append(
        evaluate(
            "All Features Without LA",
            without_la,
            X_train,
            y_train,
            X_val,
            y_val,
        )
    )

    # 4. Top 10 features
    results.append(
        evaluate(
            "Top 10 Features",
            TOP_FEATURES,
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
    print("ABLATION STUDY RESULTS")
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