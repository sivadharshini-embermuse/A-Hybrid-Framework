import pandas as pd
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = (
    BASE_DIR
    / "real_dataset"
    / "processed"
    / "real_labels.csv"
)

TARGET = "contains_bug"

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

JS_FEATURES = [
    "htmlcss",
    "strict",
    "bdom",
    "so",
    "tc",
]

ALL_FEATURES = TRADITIONAL_FEATURES + JS_FEATURES


def load_data():
    df = pd.read_csv(DATASET_PATH)

    # Chronological ordering is essential for JIT prediction.
    df = df.sort_values("time_stamp").reset_index(drop=True)

    return df


def temporal_split(df):
    n = len(df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    train = df.iloc[:train_end].copy()
    validation = df.iloc[train_end:validation_end].copy()
    test = df.iloc[validation_end:].copy()

    return train, validation, test


def prepare_xy(df, features):
    X = df[features].copy()
    y = df[TARGET].astype(int).copy()

    return X, y


if __name__ == "__main__":
    df = load_data()

    train, validation, test = temporal_split(df)

    print("Dataset:", len(df))
    print("Train:", len(train))
    print("Validation:", len(validation))
    print("Test:", len(test))

    print("\nFeatures:")
    print("Traditional:", len(TRADITIONAL_FEATURES))
    print("JavaScript-specific:", len(JS_FEATURES))
    print("Total:", len(ALL_FEATURES))

    print("\nTarget distribution:")
    print(df[TARGET].value_counts())

    print("\nSplit target rates:")
    print("Train:", round(train[TARGET].mean() * 100, 2), "%")
    print("Validation:", round(validation[TARGET].mean() * 100, 2), "%")
    print("Test:", round(test[TARGET].mean() * 100, 2), "%")

    print("\nTime ranges:")
    print(
        "Train:",
        pd.to_datetime(train["time_stamp"].min(), unit="s"),
        "→",
        pd.to_datetime(train["time_stamp"].max(), unit="s"),
    )

    print(
        "Validation:",
        pd.to_datetime(validation["time_stamp"].min(), unit="s"),
        "→",
        pd.to_datetime(validation["time_stamp"].max(), unit="s"),
    )

    print(
        "Test:",
        pd.to_datetime(test["time_stamp"].min(), unit="s"),
        "→",
        pd.to_datetime(test["time_stamp"].max(), unit="s"),
    )