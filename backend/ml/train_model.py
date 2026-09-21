import json
import os

import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_FILE = os.path.join(
    BASE_DIR,
    "dataset",
    "risk-dataset.json"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "risk_model.pkl"
)


FEATURE_COLUMNS = [
    "changedLines",
    "addedLines",
    "removedLines",
    "changedFunctions",
    "changedVariables",
    "directDependencies",
    "indirectDependencies",
    "totalDependencies",
    "businessLogic",
    "stateChange",
    "uiChange",
    "apiChange",
    "routingChange",
    "stylingChange",
    "eventHandlingChange",
    "isJavaScript",
    "isCSS",
]


def load_dataset():

    if not os.path.exists(DATASET_FILE):
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_FILE}"
        )

    with open(DATASET_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    if len(data) == 0:
        raise ValueError(
            "Dataset is empty. Add real labelled samples first."
        )

    return pd.DataFrame(data)


def train_model():

    df = load_dataset()

    missing_columns = [
        column
        for column in FEATURE_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing feature columns: {missing_columns}"
        )

    if "riskLevel" not in df.columns:
        raise ValueError(
            "riskLevel column is missing."
        )

    X = df[FEATURE_COLUMNS]
    y = df["riskLevel"]

    if y.nunique() < 2:
        raise ValueError(
            "At least 2 different risk levels are required."
        )

    print("\nDataset:")
    print(df)

    print("\nRisk distribution:")
    print(y.value_counts())

    if len(df) < 10:
        print(
            "\nWARNING: Dataset has fewer than 10 samples."
        )
        print(
            "Training can run, but the model will not be reliable."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
        if y.value_counts().min() >= 2
        else None
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("\nModel Evaluation:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    joblib.dump(
        {
            "model": model,
            "features": FEATURE_COLUMNS,
        },
        MODEL_FILE
    )

    print(
        f"\nModel saved to:\n{MODEL_FILE}"
    )


if __name__ == "__main__":
    train_model()