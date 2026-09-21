import os
import pandas as pd
import numpy as np
import joblib

from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_FILE = os.path.join(
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

RESULT_FILE = os.path.join(
    BASE_DIR,
    "real_dataset",
    "processed",
    "robustness_results.csv"
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


# ============================================================
# TIME-BASED WINDOWS
# ============================================================

n = len(df)

windows = [
    ("Window 1", 0.60, 0.70),
    ("Window 2", 0.65, 0.75),
    ("Window 3", 0.70, 0.80),
    ("Window 4", 0.75, 0.85),
]


print("\nLoading final model...")

saved = joblib.load(MODEL_FILE)

model = saved["model"] if isinstance(saved, dict) and "model" in saved else saved

print("Model loaded successfully.")


results = []


# ============================================================
# EVALUATION
# ============================================================

for name, train_end_ratio, test_end_ratio in windows:

    train_end = int(n * train_end_ratio)
    test_end = int(n * test_end_ratio)

    train_df = df.iloc[:train_end]
    test_df = df.iloc[train_end:test_end]

    X_train = train_df[FEATURES]
    y_train = train_df[TARGET].astype(int)

    X_test = test_df[FEATURES]
    y_test = test_df[TARGET].astype(int)

    print("\n===================================")
    print(name)
    print("===================================")

    print("Train:", len(train_df))
    print("Test :", len(test_df))

    print(
        "Train bug rate:",
        round(y_train.mean() * 100, 2),
        "%"
    )

    print(
        "Test bug rate:",
        round(y_test.mean() * 100, 2),
        "%"
    )

    # Retrain a fresh model for each chronological window
    from sklearn.ensemble import HistGradientBoostingClassifier

    window_model = HistGradientBoostingClassifier(
        learning_rate=0.08,
        max_iter=300,
        max_leaf_nodes=31,
        random_state=42
    )

    window_model.fit(X_train, y_train)

    probabilities = window_model.predict_proba(X_test)[:, 1]

    # Locked threshold
    predictions = (probabilities >= 0.40).astype(int)

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

    print("Precision :", round(precision, 4))
    print("Recall    :", round(recall, 4))
    print("F1        :", round(f1, 4))
    print("ROC-AUC   :", round(roc_auc, 4))
    print("PR-AUC    :", round(pr_auc, 4))

    results.append({
        "window": name,
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "train_bug_rate": y_train.mean(),
        "test_bug_rate": y_test.mean(),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "pr_auc": pr_auc
    })


# ============================================================
# SUMMARY
# ============================================================

results_df = pd.DataFrame(results)

print("\n===================================")
print("ROBUSTNESS ANALYSIS RESULTS")
print("===================================")

print(
    results_df.to_string(index=False)
)


print("\n===================================")
print("STABILITY SUMMARY")
print("===================================")

metrics = [
    "precision",
    "recall",
    "f1",
    "roc_auc",
    "pr_auc"
]

for metric in metrics:

    mean = results_df[metric].mean()
    std = results_df[metric].std()
    minimum = results_df[metric].min()
    maximum = results_df[metric].max()

    print(
        f"{metric.upper():8} "
        f"Mean={mean:.4f} "
        f"Std={std:.4f} "
        f"Min={minimum:.4f} "
        f"Max={maximum:.4f}"
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