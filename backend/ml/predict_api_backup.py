from flask import Flask, request, jsonify
import joblib
import os
import pandas as pd

app = Flask(__name__)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model",
    "real_hgb_model.pkl"
)

model_data = joblib.load(MODEL_PATH)

if not isinstance(model_data, dict):
    raise ValueError("Expected model dictionary")

model = model_data["model"]
FEATURE_ORDER = model_data["features"]

LOCKED_THRESHOLD = 0.40


@app.post("/predict")
def predict():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No features provided"
        }), 400

    try:
        missing_features = [
            feature
            for feature in FEATURE_ORDER
            if feature not in data
        ]

        if missing_features:
            return jsonify({
                "success": False,
                "message": "Missing required model features",
                "missingFeatures": missing_features
            }), 400

        input_data = pd.DataFrame(
            [[data[feature] for feature in FEATURE_ORDER]],
            columns=FEATURE_ORDER
        )

        probabilities = model.predict_proba(input_data)[0]

        classes = model.classes_

        probability_map = {
            str(label): float(probability)
            for label, probability in zip(
                classes,
                probabilities
            )
        }

        bug_probability = probability_map.get("1", 0.0)

        prediction = int(
            bug_probability >= LOCKED_THRESHOLD
        )

        risk_level = (
            "HIGH"
            if bug_probability >= 0.70
            else "MEDIUM"
            if bug_probability >= LOCKED_THRESHOLD
            else "LOW"
        )

        feature_importance = {}

        if hasattr(model, "feature_importances_"):
            feature_importance = {
                name: float(importance)
                for name, importance in zip(
                    FEATURE_ORDER,
                    model.feature_importances_
                )
            }

        return jsonify({
            "success": True,

            "prediction": prediction,

            "riskLevel": risk_level,

            "riskScore": round(
                bug_probability * 100,
                2
            ),

            "bugProbability": round(
                bug_probability,
                6
            ),

            "threshold": LOCKED_THRESHOLD,

            "probabilities": probability_map,

            "featureImportance": feature_importance
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8001,
        debug=True
    )