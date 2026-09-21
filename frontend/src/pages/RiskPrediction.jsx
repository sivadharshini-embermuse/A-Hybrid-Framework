import RiskCard from "../components/RiskCard";

function RiskPrediction({
  riskPredictions = [],
  overallRisk = null,
  mlFeatures = [],
}) {
  const counts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  riskPredictions.forEach((item) => {
    const level =
      item.prediction?.riskLevel;

    if (
      level &&
      counts[level] !== undefined
    ) {
      counts[level]++;
    }
  });

  const totalFiles =
    riskPredictions.length;

  return (
    <div className="risk-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="risk-page-header">

        <div>
          <h2>ML Risk Prediction</h2>

          <p>
            AI-based risk assessment generated
            from the detected project changes.
          </p>
        </div>

        <div className="risk-file-count">
          {totalFiles} Files Analyzed
        </div>

      </div>


      {/* =====================================================
          OVERALL PROJECT RISK
          ===================================================== */}

      <div className="overall-risk-card">

        <div>

          <span>
            OVERALL PROJECT RISK
          </span>

          <h2
            className={`overall-risk-level ${
              overallRisk?.level
                ?.toLowerCase() || "low"
            }`}
          >
            {overallRisk?.level || "N/A"}
          </h2>

          <p>
            Based on ML predictions across{" "}
            {totalFiles} changed files.
          </p>

        </div>


        <div className="overall-risk-score">

          <strong>
            {overallRisk?.score != null
              ? Number(
                  overallRisk.score
                ).toFixed(1)
              : "0.0"}
            %
          </strong>

          <span>
            Overall Risk Severity
          </span>

        </div>

      </div>


      {/* =====================================================
          RISK SUMMARY
          ===================================================== */}

      <div className="risk-summary">

        <div className="risk-summary-card">

          <span className="summary-label">
            LOW RISK
          </span>

          <strong>
            {counts.LOW}
          </strong>

          <small>
            Files
          </small>

        </div>


        <div className="risk-summary-card">

          <span className="summary-label">
            MEDIUM RISK
          </span>

          <strong>
            {counts.MEDIUM}
          </strong>

          <small>
            Files
          </small>

        </div>


        <div className="risk-summary-card">

          <span className="summary-label">
            HIGH RISK
          </span>

          <strong>
            {counts.HIGH}
          </strong>

          <small>
            Files
          </small>

        </div>

      </div>


      {/* =====================================================
          FILE RISK RESULTS
          ===================================================== */}

      {riskPredictions.length === 0 ? (

        <div className="risk-empty">

          <h3>
            No risk predictions available
          </h3>

          <p>
            Run a project analysis to generate
            ML-based risk predictions.
          </p>

        </div>

      ) : (

        <div className="risk-results">

          {riskPredictions.map((item, index) => {
            const fileFeatures = mlFeatures.find((f) => f.file === item.file);
            return (
              <RiskCard
                key={item.file || index}
                item={item}
                index={index}
                fileFeatures={fileFeatures}
              />
            );
          })}

        </div>

      )}

    </div>
  );
}

export default RiskPrediction;