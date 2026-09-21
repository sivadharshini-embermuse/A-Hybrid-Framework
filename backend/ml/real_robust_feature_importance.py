import os
import pandas as pd
import numpy as np

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import roc_auc_score


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "real_labels.csv"
)

RESULT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "robust_feature_importance.csv"
)

FEATURES = [
    "ns", "nd", "nf", "entropy", "la", "ld", "lt",
    "is_fix", "ndev", "age", "nuc", "exp", "rexp", "sexp",
    "htmlcss", "strict", "bdom", "so", "tc"
]

TARGET = "contains_bug"


print("Loading dataset...")

df = pd.read_csv(DATASET_FILE)
df = df.sort_values("time_stamp").reset_index(drop=True)

print("Dataset:", len(df))


n = len(df)

windows = [
    ("Window 1", 0.60, 0.70),
    ("Window 2", 0.65, 0.75),
    ("Window 3", 0.70, 0.80),
    ("Window 4", 0.75, 0.85),
]


all_results = []


for name, train_ratio, test_ratio in windows:

    print("\n===================================")
    print(name)
    print("===================================")

    train_end = int(n * train_ratio)
    test_end = int(n * test_ratio)

    train_df = df.iloc[:train_end]
    test_df = df.iloc[train_end:test_end]

    X_train = train_df[FEATURES]
    y_train = train_df[TARGET].astype(int)

    X_test = test_df[FEATURES]
    y_test = test_df[TARGET].astype(int)

    model = HistGradientBoostingClassifier(
        learning_rate=0.08,
        max_iter=300,
        max_leaf_nodes=31,
        random_state=42
    )

    print("Training model...")

    model.fit(X_train, y_train)

    baseline_auc = roc_auc_score(
        y_test,
        model.predict_proba(X_test)[:, 1]
    )

    print("Baseline ROC-AUC:", round(baseline_auc, 4))

    print("Calculating permutation importance...")

    importance = permutation_importance(
        model,
        X_test,
        y_test,
        scoring="roc_auc",
        n_repeats=5,
        random_state=42,
        n_jobs=-1
    )

    for feature, mean, std in zip(
        FEATURES,
        importance.importances_mean,
        importance.importances_std
    ):

        all_results.append({
            "window": name,
            "feature": feature,
            "importance_mean": mean,
            "importance_std": std,
            "baseline_auc": baseline_auc
        })


results_df = pd.DataFrame(all_results)


# ============================================================
# AGGREGATE FEATURE IMPORTANCE
# ============================================================

summary = (
    results_df
    .groupby("feature")
    .agg(
        mean_importance=("importance_mean", "mean"),
        std_across_windows=("importance_mean", "std"),
        min_importance=("importance_mean", "min"),
        max_importance=("importance_mean", "max")
    )
    .sort_values("mean_importance", ascending=False)
)


print("\n===================================")
print("ROBUST FEATURE IMPORTANCE")
print("===================================")

print(summary.to_string())


# ============================================================
# TOP FEATURES
# ============================================================

print("\n===================================")
print("TOP 10 FEATURES")
print("===================================")

print(
    summary.head(10).to_string()
)


# ============================================================
# FEATURE GROUP SUMMARY
# ============================================================

traditional = [
    "ns", "nd", "nf", "entropy", "la", "ld", "lt",
    "is_fix", "ndev", "age", "nuc", "exp", "rexp", "sexp"
]

javascript = [
    "htmlcss", "strict", "bdom", "so", "tc"
]


traditional_importance = summary.loc[
    summary.index.intersection(traditional),
    "mean_importance"
].sum()

javascript_importance = summary.loc[
    summary.index.intersection(javascript),
    "mean_importance"
].sum()


print("\n===================================")
print("FEATURE GROUP IMPORTANCE")
print("===================================")

print(
    "Traditional JIT importance:",
    round(traditional_importance, 4)
)

print(
    "JavaScript-specific importance:",
    round(javascript_importance, 4)
)


# ============================================================
# SAVE
# ============================================================

os.makedirs(
    os.path.dirname(RESULT_FILE),
    exist_ok=True
)

results_df.to_csv(
    RESULT_FILE,
    index=False
)

print("\nDetailed results saved to:")
print(RESULT_FILE)

summary_file = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "robust_feature_importance_summary.csv"
)

summary.reset_index().to_csv(
    summary_file,
    index=False
)

print("\nSummary saved to:")
print(summary_file)