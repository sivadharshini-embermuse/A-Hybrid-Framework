const {
  buildMLInput,
  validateMLInput,
} = require("./featureAdapter");

/**
 * Convert GraphImpact analysis features
 * into the 19-feature schema expected by
 * the real JIT HistGradientBoosting model.
 *
 * IMPORTANT:
 * Historical JIT features cannot be reliably
 * derived from only Original.zip + Modified.zip.
 * They are therefore kept as explicit defaults
 * until Git-history extraction is implemented.
 */

function buildJITFeatures({
  graphFeatures = {},
  changes = [],
  file = "",
}) {
  const addedLines = Number(
    graphFeatures.addedLines || 0
  );

  const removedLines = Number(
    graphFeatures.removedLines || 0
  );

  const changedLines =
    addedLines + removedLines;

  /*
   * Change-level metrics
   */

  const nf = changes.length || 0;

  const la = addedLines;

  const ld = removedLines;

  const lt = Number(
    graphFeatures.linesBeforeChange || 0
  );

  /*
   * Approximate entropy from changed
   * file distribution.
   *
   * For a single-file prediction this
   * becomes 0.
   */
  const entropy = 0;

  /*
   * Repository structure metrics.
   * These are currently conservative values
   * until project-level extraction is added.
   */
  const ns = 1;

  const nd =
    file.split(/[\\/]/).length > 1
      ? new Set(
          file
            .split(/[\\/]/)
            .slice(0, -1)
        ).size
      : 1;

  /*
   * Historical JIT metrics.
   *
   * These cannot be inferred honestly from
   * two repository snapshots alone.
   */
  const is_fix = 0;
  const ndev = 0;
  const age = 0;
  const nuc = 0;
  const exp = 0;
  const rexp = 0;
  const sexp = 0;

  /*
   * JavaScript-specific features.
   *
   * These are currently obtained from the
   * GraphImpact change/context analysis when
   * available.
   */
  const htmlcss = Number(
    graphFeatures.htmlcss || 0
  );

  const strict = Number(
    graphFeatures.strict || 0
  );

  const bdom = Number(
    graphFeatures.bdom || 0
  );

  const so = Number(
    graphFeatures.so || 0
  );

  const tc = Number(
    graphFeatures.tc || 0
  );

  const jitFeatures = {
    ns,
    nd,
    nf,
    entropy,
    la,
    ld,
    lt,
    is_fix,
    ndev,
    age,
    nuc,
    exp,
    rexp,
    sexp,
    htmlcss,
    strict,
    bdom,
    so,
    tc,
  };

  const mlInput =
    buildMLInput(jitFeatures);

  const validation =
    validateMLInput(mlInput);

  if (!validation.valid) {
    throw new Error(
      validation.message
    );
  }

  return {
    jitFeatures,
    mlInput,

    metadata: {
      historicalFeaturesAvailable: false,
      historicalFeatures: [
        "is_fix",
        "ndev",
        "age",
        "nuc",
        "exp",
        "rexp",
        "sexp",
      ],
    },
  };
}

module.exports = {
  buildJITFeatures,
};