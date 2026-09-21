import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from sklearn.dummy import DummyClassifier
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

DATASET_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "real_labels.csv",
)

RESULT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "baseline_comparison_test.csv",
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

    print(f"Dataset: {len(df)}")

    # Chronological ordering
    df = df.sort_values("time_stamp").reset_index(drop=True)

    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    train_df = df.iloc[:train_end].copy()
    validation_df = df.iloc[train_end:validation_end].copy()
    test_df = df.iloc[validation_end:].copy()

    print(f"Train: {len(train_df)}")
    print(f"Validation: {len(validation_df)}")
    print(f"Test: {len(test_df)}")

    return train_df, validation_df, test_df


def evaluate_model(name, model, X_train, y_train, X_test, y_test):

    print(f"\nTraining: {name}")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    # Probability for positive class
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(X_test)[:, 1]
    else:
        probabilities = model.decision_function(X_test)

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

    roc_auc = roc_auc_score(
        y_test,
        probabilities,
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities,
    )

    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1        : {f1:.4f}")
    print(f"ROC-AUC   : {roc_auc:.4f}")
    print(f"PR-AUC    : {pr_auc:.4f}")

    return {
        "model": name,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
    }


def main():

    train_df, validation_df, test_df = load_data()

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["contains_bug"].astype(int)

    X_validation = validation_df[FEATURE_COLUMNS]
    y_validation = validation_df["contains_bug"].astype(int)

    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["contains_bug"].astype(int)

    print("\nFeature count:", len(FEATURE_COLUMNS))

    print("\nTraining baseline models...")

    results = []

    # --------------------------------------------------
    # 1. Majority Classifier
    # --------------------------------------------------

    majority_model = DummyClassifier(
        strategy="most_frequent"
    )

    results.append(
        evaluate_model(
            "Majority Classifier",
            majority_model,
            X_train,
            y_train,
            X_test,
            y_test,
        )
    )

    # --------------------------------------------------
    # 2. Logistic Regression
    # --------------------------------------------------

    logistic_model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(
            max_iter=5000,
            class_weight="balanced",
            solver="lbfgs",
            random_state=42,
        )),
    ])

    results.append(
        evaluate_model(
            "Logistic Regression",
            logistic_model,
            X_train,
            y_train,
            X_test,
            y_test,
        )
    )

    # --------------------------------------------------
    # 3. Random Forest
    # --------------------------------------------------

    random_forest_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    results.append(
        evaluate_model(
            "Random Forest",
            random_forest_model,
            X_train,
            y_train,
            X_test,
            y_test,
        )
    )

    # --------------------------------------------------
    # 4. HistGradientBoosting
    # --------------------------------------------------

    hgb_model = HistGradientBoostingClassifier(
        max_iter=200,
        learning_rate=0.08,
        max_leaf_nodes=31,
        random_state=42,
    )

    results.append(
        evaluate_model(
            "HistGradientBoosting",
            hgb_model,
            X_train,
            y_train,
            X_test,
            y_test,
        )
    )

    # --------------------------------------------------
    # Results
    # --------------------------------------------------

    results_df = pd.DataFrame(results)

    results_df = results_df.sort_values(
        "f1",
        ascending=False,
    ).reset_index(drop=True)

    print("\n===================================")
    print("FINAL BASELINE COMPARISON")
    print("===================================")

    print(
        results_df.to_string(
            index=False,
            float_format=lambda x: f"{x:.4f}",
        )
    )

    # --------------------------------------------------
    # Best model
    # --------------------------------------------------

    best_model = results_df.iloc[0]

    print("\n===================================")
    print("BEST MODEL")
    print("===================================")

    print("Model     :", best_model["model"])
    print("F1        :", f"{best_model['f1']:.4f}")
    print("ROC-AUC   :", f"{best_model['roc_auc']:.4f}")
    print("PR-AUC    :", f"{best_model['pr_auc']:.4f}")

    # --------------------------------------------------
    # Save results
    # --------------------------------------------------

    os.makedirs(
        os.path.dirname(RESULT_FILE),
        exist_ok=True,
    )

    results_df.to_csv(
        RESULT_FILE,
        index=False,
    )

    print("\nResults saved to:")
    print(RESULT_FILE)


if __name__ == "__main__":
    main()