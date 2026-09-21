import { useState } from "react";

const FEATURE_MAPPING = {
  // Traditional JIT Features
  ns: { name: "Modified Subsystems", description: "The number of subsystems affected by the code change." },
  nd: { name: "Modified Directories", description: "The number of directories touched in the repository." },
  nf: { name: "Modified Files", description: "The total number of files modified by this change." },
  entropy: { name: "Code Entropy", description: "The distribution of modifications across the affected files." },
  la: { name: "Lines Added", description: "Large code changes can introduce more opportunities for defects." },
  ld: { name: "Lines Deleted", description: "The volume of code removed during the modification." },
  lt: { name: "File Size", description: "The original size of the file before modifications were made." },
  fix: { name: "Bug Fix Commit", description: "Whether this change was explicitly labeled as a bug fix." },
  ndev: { name: "Number of Developers", description: "The number of different developers who previously touched this code." },
  age: { name: "File Age", description: "The amount of time since the file was last modified." },
  nuc: { name: "Unique Changes", description: "The historical frequency of modifications to the affected files." },
  exp: { name: "Developer Experience", description: "Changes made by developers with less experience in the relevant project area may carry higher defect risk." },
  rexp: { name: "Recent Developer Experience", description: "The recent activity level of the developer on this specific project." },
  sexp: { name: "Subsystem Experience", description: "The developer's familiarity with the specific subsystem being modified." },

  // JavaScript-Specific Features
  htmlcss: { name: "HTML/CSS Changes", description: "Whether the change involves HTML or CSS modifications alongside JavaScript." },
  strict: { name: "Strict Mode Usage", description: "The presence of 'use strict' declarations in the code." },
  bdom: { name: "Browser DOM Changes", description: "Whether the modification directly interacts with browser DOM APIs." },
  so: { name: "Special Operators", description: "Usage of complex JavaScript-specific operators." },
  tc: { name: "Type Checking", description: "Presence of type-checking logic (e.g., typeof, instanceof)." },
};

function CollapsibleSection({ title, children, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div style={{ marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '14px 16px', background: '#f8fafc', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s' }}
      >
        <span style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginRight: '10px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>▶</span>
        <strong style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>{title}</strong>
      </div>
      {expanded && (
        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function RiskCard({ item, index, fileFeatures }) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const prediction = item.prediction;

  if (!prediction?.success) {
    return null;
  }

  const level = prediction.riskLevel || "LOW";
  const score = Number(prediction.riskScore || 0);
  const probabilities = prediction.probabilities || {};

  const lowPercent = ((probabilities.LOW || 0) * 100).toFixed(1);
  const mediumPercent = ((probabilities.MEDIUM || 0) * 100).toFixed(1);
  const highPercent = ((probabilities.HIGH || 0) * 100).toFixed(1);

  const rawFeatureImportance = prediction.featureImportance;
  const isImportanceValid = rawFeatureImportance && typeof rawFeatureImportance === "object" && Object.keys(rawFeatureImportance).length > 0;

  let sortedFeatures = [];
  if (isImportanceValid) {
    sortedFeatures = Object.entries(rawFeatureImportance)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => {
        const mapping = FEATURE_MAPPING[key] || { name: key, description: "Influential feature." };
        return {
          key,
          name: mapping.name,
          description: mapping.description,
          value: Number(value)
        };
      })
      .sort((a, b) => b.value - a.value);
  }

  const visibleFeatures = showAllFeatures ? sortedFeatures : sortedFeatures.slice(0, 5);
  const maxFeatureValue = sortedFeatures.length > 0 ? sortedFeatures[0].value : 1;

  return (
    <div className={`risk-card ${level.toLowerCase()}`} style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* CARD HEADER */}
      <div 
        className="risk-card-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', transition: 'background 0.2s', borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none' }}
      >
        <div className="risk-file-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b', fontSize: '14px', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
          <div className="risk-file-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◇</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', wordBreak: 'break-all', fontWeight: '600' }}>{item.file}</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <strong style={{ fontSize: '15px', color: '#334155' }}>{score.toFixed(1)}%</strong>
          <div className={`risk-badge ${level.toLowerCase()}`}>
            {level}
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="risk-expanded-content" style={{ padding: '20px', background: '#fff' }}>
          
          <CollapsibleSection title="Risk Overview">
            <div className="risk-score-section" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>RISK SCORE</span>
                <strong style={{ fontSize: '18px', color: '#1e293b' }}>{score.toFixed(1)}%</strong>
              </div>
              <div className="risk-progress" style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  className="risk-progress-fill"
                  style={{ width: `${score}%`, height: '100%', background: level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f97316' : '#22c55e', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div className="risk-probabilities" style={{ display: 'flex', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div className="probability" style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>LOW</span>
                <strong style={{ fontSize: '16px', color: '#22c55e' }}>{lowPercent}%</strong>
              </div>
              <div className="probability" style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>MEDIUM</span>
                <strong style={{ fontSize: '16px', color: '#f97316' }}>{mediumPercent}%</strong>
              </div>
              <div className="probability" style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>HIGH</span>
                <strong style={{ fontSize: '16px', color: '#ef4444' }}>{highPercent}%</strong>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Why This Risk?">
            <div className="risk-explanation-summary" style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
              Based on the machine learning assessment, this file was classified with a <strong>{level}</strong> defect risk.
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Code Changes / Evidence">
            {!fileFeatures ? (
              <div className="risk-explanation-missing" style={{ fontSize: '13px', color: '#64748b' }}>
                Detailed risk indicators are not available for this file.
              </div>
            ) : (
              <ul className="file-factors-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fileFeatures.changedLines > 0 ? `🔴 ${fileFeatures.changedLines} lines changed` : `🟢 No lines changed`}
                </li>
                <li style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fileFeatures.changedFunctions > 0 ? `🔴 ${fileFeatures.changedFunctions} functions modified` : `🟢 No functions modified`}
                </li>
                <li style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {prediction.affectedFiles > 0 ? `🟠 ${prediction.affectedFiles} dependent files affected` : `🟢 No dependent files affected`}
                </li>
                <li style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fileFeatures.apiChange ? `🔴 API change detected` : `🟢 No API change detected`}
                </li>
                <li style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fileFeatures.stateChange ? `🔴 State change detected` : `🟢 No state change detected`}
                </li>
                {fileFeatures.businessLogic > 0 && (
                  <li style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>🔴 Business Logic change detected</li>
                )}
              </ul>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Model-Level Feature Importance">
            {!isImportanceValid || sortedFeatures.length === 0 ? (
              <div className="risk-explanation-missing" style={{ fontSize: '13px', color: '#64748b' }}>
                Model feature importance is not available for this prediction.
              </div>
            ) : (
              <>
                {sortedFeatures.length > 0 && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      TOP CONTRIBUTING FACTOR
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                      {sortedFeatures[0].name} — {(sortedFeatures[0].value * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                <div className="feature-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {visibleFeatures.map((feature) => {
                    const widthPercent = Math.min(100, Math.max(2, (feature.value / maxFeatureValue) * 100));
                    const percentageStr = (feature.value * 100).toFixed(1);
                    
                    return (
                      <div key={feature.key} className="feature-item">
                        <div className="feature-item-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="feature-name" style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>{feature.name}</span>
                          <span className="feature-value" style={{ fontWeight: '700', fontSize: '14px', color: '#0ea5e9' }}>{percentageStr}%</span>
                        </div>
                        
                        <div className="feature-bar-bg" style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div className="feature-bar-fill" style={{ width: `${widthPercent}%`, height: '100%', background: '#0ea5e9', borderRadius: '4px' }} />
                        </div>
                        
                        <div className="feature-desc" style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                          <strong style={{ color: '#475569' }}>Why it matters:</strong> {feature.description}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {sortedFeatures.length > 5 && (
                  <button 
                    className="view-all-features-btn"
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    style={{ marginTop: '24px', width: '100%', padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    {showAllFeatures ? "Collapse features" : "View all features"}
                  </button>
                )}
              </>
            )}
          </CollapsibleSection>

        </div>
      )}
    </div>
  );
}

export default RiskCard;
