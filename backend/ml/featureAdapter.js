const MODEL_FEATURES = [
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
];

/**
 * Convert a JIT feature object into the exact
 * feature order expected by the trained HGB model.
 */
function buildMLInput(features = {}) {
  const missing = MODEL_FEATURES.filter(
    (feature) =>
      features[feature] === undefined ||
      features[feature] === null
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing ML features: ${missing.join(", ")}`
    );
  }

  return MODEL_FEATURES.reduce((result, feature) => {
    result[feature] = Number(features[feature]);
    return result;
  }, {});
}

/**
 * Validate that all ML features are numeric.
 */
function validateMLInput(features) {
  for (const feature of MODEL_FEATURES) {
    if (
      typeof features[feature] !== "number" ||
      !Number.isFinite(features[feature])
    ) {
      return {
        valid: false,
        message: `Invalid value for ML feature: ${feature}`,
      };
    }
  }

  return {
    valid: true,
    message: "All ML features are valid",
  };
}

module.exports = {
  MODEL_FEATURES,
  buildMLInput,
  validateMLInput,
};