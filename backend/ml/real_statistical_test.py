import os
import pandas as pd
import numpy as np

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import f1_score, roc_auc_score, average_precision_score
from scipy.stats import wilcoxon


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
    "statistical_test_results.csv"
)

FEATURES_14 = [
    "ns", "nd", "nf", "entropy", "la", "ld", "lt",
    "is_fix", "ndev", "age", "nuc", "exp", "rexp", "sexp"
]

FEATURES_19 = FEATURES_14 + [
    "htmlcss", "strict", "bdom", "so", "tc"
]

TARGET = "contains_bug"


print("Loading dataset...")

df = pd.read_csv(DATASET_FILE)
df = df.sort_values("time_stamp").reset_index(drop=True)

n = len(df)

windows = [
    ("Window 1", 0.60, 0.70),
    ("Window 2", 0.65, 0.75),
    ("Window 3", 0.70, 0.80),
    ("Window 4", 0.75, 0.85),
]


traditional_results = []
javascript_results = []


for name, train_ratio, test_ratio in windows:

    print("\n===================================")
    print(name)
    print("===================================")

    train_end = int(n * train_ratio)
    test_end = int(n * test_ratio)

    train_df = df.iloc[:train_end]
    test_df = df.iloc[train_end:test_end]

    y_train = train_df[TARGET].astype(int)
    y_test = test_df[TARGET].astype(int)

    # ----------------------------------------
    # Traditional 14 Features
    # ----------------------------------------

    print("Training Traditional 14 Features...")

    model_14 = HistGradientBoostingClassifier(
        learning_rate=0.08,
        max_iter=300,
        max_leaf_nodes=31,
        random_state=42
    )

    model_14.fit(
        train_df[FEATURES_14],
        y_train
    )

    prob_14 = model_14.predict_proba(
        test_df[FEATURES_14]
    )[:, 1]

    pred_14 = (prob_14 >= 0.40).astype(int)

    f1_14 = f1_score(
        y_test,
        pred_14,
        zero_division=0
    )

    auc_14 = roc_auc_score(
        y_test,
        prob_14
    )

    pr_14 = average_precision_score(
        y_test,
        prob_14
    )

    traditional_results.append({
        "window": name,
        "f1": f1_14,
        "roc_auc": auc_14,
        "pr_auc": pr_14
    })

    print(
        f"Traditional → F1={f1_14:.4f}, "
        f"ROC-AUC={auc_14:.4f}, "
        f"PR-AUC={pr_14:.4f}"
    )

    # ----------------------------------------
    # All 19 Features
    # ----------------------------------------

    print("Training All 19 Features...")

    model_19 = HistGradientBoostingClassifier(
        learning_rate=0.08,
        max_iter=300,
        max_leaf_nodes=31,
        random_state=42
    )

    model_19.fit(
        train_df[FEATURES_19],
        y_train
    )

    prob_19 = model_19.predict_proba(
        test_df[FEATURES_19]
    )[:, 1]

    pred_19 = (prob_19 >= 0.40).astype(int)

    f1_19 = f1_score(
        y_test,
        pred_19,
        zero_division=0
    )

    auc_19 = roc_auc_score(
        y_test,
        prob_19
    )

    pr_19 = average_precision_score(
        y_test,
        prob_19
    )

    javascript_results.append({
        "window": name,
        "f1": f1_19,
        "roc_auc": auc_19,
        "pr_auc": pr_19
    })

    print(
        f"All 19 → F1={f1_19:.4f}, "
        f"ROC-AUC={auc_19:.4f}, "
        f"PR-AUC={pr_19:.4f}"
    )


# ============================================================
# STATISTICAL TEST
# ============================================================

traditional_df = pd.DataFrame(traditional_results)
javascript_df = pd.DataFrame(javascript_results)

print("\n===================================")
print("STATISTICAL COMPARISON")
print("===================================")

results = []

for metric in ["f1", "roc_auc", "pr_auc"]:

    a = traditional_df[metric].values
    b = javascript_df[metric].values

    differences = b - a

    print(f"\nMetric: {metric.upper()}")

    print("Traditional:", np.round(a, 4))
    print("All 19     :", np.round(b, 4))
    print("Difference :", np.round(differences, 4))

    # With only four paired windows, exact Wilcoxon is appropriate.
    try:
        statistic, p_value = wilcoxon(
            a,
            b,
            alternative="two-sided",
            method="exact"
        )

    except Exception:
        statistic, p_value = wilcoxon(
            a,
            b,
            alternative="two-sided"
        )

    mean_traditional = np.mean(a)
    mean_all = np.mean(b)
    mean_difference = np.mean(differences)

    print("Wilcoxon statistic:", statistic)
    print("p-value:", round(p_value, 6))
    print("Mean traditional:", round(mean_traditional, 4))
    print("Mean all 19:", round(mean_all, 4))
    print("Mean difference:", round(mean_difference, 4))

    if p_value < 0.05:
        significance = "Statistically significant"
    else:
        significance = "Not statistically significant"

    print("Conclusion:", significance)

    results.append({
        "metric": metric.upper(),
        "traditional_mean": mean_traditional,
        "all_19_mean": mean_all,
        "mean_difference": mean_difference,
        "wilcoxon_statistic": statistic,
        "p_value": p_value,
        "significance": significance
    })


# ============================================================
# FINAL SUMMARY
# ============================================================

results_df = pd.DataFrame(results)

print("\n===================================")
print("FINAL STATISTICAL TEST RESULTS")
print("===================================")

print(
    results_df.to_string(index=False)
)


os.makedirs(
    os.path.dirname(RESULT_FILE),
    exist_ok=True
)

results_df.to_csv(
    RESULT_FILE,
    index=False
)

print("\nResults saved to:")
print(RESULT_FILE)