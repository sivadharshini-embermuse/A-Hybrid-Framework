const ML_API_URL =
  "http://127.0.0.1:8001/predict";

async function predictRisk(features) {
  try {
    const response = await fetch(
      ML_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(features),
      }
    );

    if (!response.ok) {
      throw new Error(
        `ML API returned ${response.status}`
      );
    }

    return await response.json();

  } catch (error) {
    console.error(
      "ML prediction failed:",
      error.message
    );

    return {
      success: false,
      riskLevel: null,
      riskScore: null,
      probabilities: {},
      featureImportance: {},
    };
  }
}

module.exports = {
  predictRisk,
};