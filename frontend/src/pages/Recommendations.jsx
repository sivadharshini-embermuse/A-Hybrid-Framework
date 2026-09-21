function Recommendations({
  recommendations = [],
}) {
  if (
    recommendations.length === 0
  ) {
    return (
      <div className="empty-page">
        <div className="empty-icon">
          ✓
        </div>

        <h2>
          No recommendations
        </h2>

        <p>
          No context-aware actions
          were generated from the
          current project changes.
        </p>
      </div>
    );
  }

  return (
    <div className="recommendations-page">

      <div className="page-intro">
        <div>
          <h2>
            Recommended Actions
          </h2>

          <p>
            Recommendations generated
            from actual code changes
            and project dependencies.
          </p>
        </div>

        <div className="recommendation-count">
          {recommendations.length}
          {" "}
          recommendations
        </div>
      </div>

      <div className="recommendation-list">

        {recommendations.map(
          (item, index) => (
            <RecommendationCard
              key={`${item.file}-${index}`}
              item={item}
            />
          )
        )}

      </div>
    </div>
  );
}

function parseReason(reasonStr, item) {
  if (!reasonStr) return [];
  const sentences = reasonStr.split('. ').filter(s => s.trim().length > 0);
  
  return sentences.map(s => {
    let clean = s.trim();
    if (!clean.endsWith('.')) clean += '.';
    
    clean = clean.replace(/The change affects application routing\./, "This file controls application navigation.");
    clean = clean.replace(/The change affects UI rendering or interaction\./, "The change affects how users see or interact with the page.");
    clean = clean.replace(/The change involves core business logic\./, "This change modifies important core logic.");
    clean = clean.replace(/The change involves state management\./, "This file manages application data state.");
    clean = clean.replace(/The change affects API communication\./, "This code talks to the backend API.");
    clean = clean.replace(/It directly affects/, "It directly affects other files like");
    clean = clean.replace(/It indirectly affects/, "It can indirectly affect downstream files like");
    return clean;
  });
}

function parseRecommendation(recStr, item) {
  if (!recStr) return { checks: ["Check that the changes work as expected."], action: "Review the changed code.", summary: "Test the affected code before considering this change safe." };
  
  const sentences = recStr.split('. ').filter(s => s.trim().length > 0);
  const checks = [];
  let action = "Review the affected code and test its behavior.";
  let summary = "Test the affected code before considering this change safe.";
  
  sentences.forEach(s => {
    let clean = s.trim();
    if (!clean.endsWith('.')) clean += '.';
    
    if (clean.toLowerCase().startsWith('review')) {
       action = clean;
    } else {
       clean = clean.replace(/Verify that/, "Check whether");
       clean = clean.replace(/Verify/, "Check");
       checks.push(clean);
    }
  });

  if (checks.length === 0) {
    checks.push("Check that the changes work as expected.");
    checks.push("Make sure no related features are broken.");
  }

  if (item.categories?.includes('routing')) summary = "Test the affected navigation before merging.";
  else if (item.categories?.includes('ui')) summary = "Check the visual UI and interactions before merging.";
  else if (item.categories?.includes('api')) summary = "Test the API communication before merging.";
  else if (item.categories?.includes('state-management')) summary = "Test application state flow before merging.";
  else summary = "Thoroughly test the affected features before merging.";

  return { checks, action, summary };
}

function RecommendationCard({
  item,
}) {
  const severityClass =
    item.severity.toLowerCase();

  const whyMatters = parseReason(item.reason, item);
  const { checks, action, summary } = parseRecommendation(item.recommendation, item);

  return (
    <div
      className={`recommendation-card ${severityClass}`}
      style={{ marginBottom: '32px', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
    >

      {/* HEADER */}

      <div className="recommendation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>

        <div className="recommendation-file" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          <div className="recommendation-file-icon" style={{ fontSize: '20px', color: '#64748b' }}>
            ◈
          </div>

          <div>
            <code className="recommendation-bocc" style={{ fontSize: '15px', color: '#1e293b', wordBreak: 'break-all', display: 'block', fontWeight: 600 }}>
              {item.file}
            </code>

            <div className="recommendation-meta" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              {item.impactType} IMPACT
            </div>
          </div>

        </div>

        <span
          className={`severity-badge ${severityClass}`}
        >
          {item.severity}
        </span>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* WHY THIS MATTERS */}
        <div className="recommendation-context">
          <div className="context-title" style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Why This Matters
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
            {whyMatters.map((point, idx) => <li key={idx} style={{ marginBottom: '6px' }}>{point}</li>)}
          </ul>
        </div>

        {/* WHAT YOU SHOULD CHECK */}
        <div className="recommendation-context">
          <div className="context-title" style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            What You Should Check
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
            {checks.map((point, idx) => <li key={idx} style={{ marginBottom: '6px' }}>{point}</li>)}
          </ul>
        </div>

        {/* RECOMMENDED ACTION */}
        <div style={{ background: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '0 8px 8px 0' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>💡</span> RECOMMENDED ACTION
          </div>
          <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500', lineHeight: '1.5' }}>
            {action}
          </div>
        </div>

        {/* IN SHORT */}
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ color: '#475569' }}>IN SHORT:</strong> {summary}
        </div>

      </div>

      {/* CHANGED CONTEXT */}

      <div className="context-grid" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>

        {item.changedFunctions
          ?.length > 0 && (
          <ContextBlock
            title="Changed Functions"
            values={
              item.changedFunctions
            }
          />
        )}

        {item.changedVariables
          ?.length > 0 && (
          <ContextBlock
            title="Changed Variables"
            values={
              item.changedVariables
            }
          />
        )}

        {item.categories
          ?.length > 0 && (
          <ContextBlock
            title="Change Type"
            values={
              item.categories
            }
          />
        )}

      </div>

      {/* DIRECT IMPACT */}

      {item.directImpact
        ?.length > 0 && (
        <div className="impact-block">

          <div className="impact-title direct">
            Directly affected
          </div>

          <div className="impact-files">

            {item.directImpact.map(
              (file) => (
                <span
                  key={file}
                >
                  {file}
                </span>
              )
            )}

          </div>

        </div>
      )}

      {item.jsSymbolConsumers &&
        Object.keys(item.jsSymbolConsumers).length > 0 && (
          <div className="impact-block">
            <div className="impact-title direct">
              Changed Symbols Used By
            </div>

            <div className="symbol-consumers">
              {Object.entries(
                item.jsSymbolConsumers
              ).map(([symbol, files]) => (
                <div
                  key={symbol}
                  className="symbol-consumer-row"
                >
                  <code>{symbol}</code>

                  <div className="impact-files">
                    {files.map((file) => (
                      <span key={file}>
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      {/* INDIRECT IMPACT */}

      {item.indirectImpact
        ?.length > 0 && (
        <div className="impact-block">

          <div className="impact-title indirect">
            Indirectly affected
          </div>

          <div className="impact-files">

            {item.indirectImpact.map(
              (file) => (
                <span
                  key={file}
                >
                  {file}
                </span>
              )
            )}

          </div>

        </div>
      )}



    </div>
  );
}

function ContextBlock({
  title,
  values,
}) {
  return (
    <div className="context-block">

      <div className="context-block-title">
        {title}
      </div>

      <div className="context-values">

        {values.map(
          (value) => (
            <span key={value}>
              {value}
            </span>
          )
        )}

      </div>

    </div>
  );
}

export default Recommendations;