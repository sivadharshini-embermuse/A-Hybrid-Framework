import { useState } from "react";

function ChangeAnalysis({
  result,
  error,
  setActivePage,
}) {
  if (!result) {
    return (
      <div className="empty-page">

        <div className="empty-icon">
          ◈
        </div>

        <h2>
          No analysis available
        </h2>

        <p>
          Upload your project
          versions and run an
          analysis first.
        </p>

        <button
          className="primary-button"
          onClick={() =>
            setActivePage(
              "analyze"
            )
          }
        >
          Analyze Project →
        </button>

      </div>
    );
  }

  return (
    <div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="stats-grid">

        <Stat
          title="Total Files"
          value={
            result.summary
              .totalFiles
          }
        />

        <Stat
          title="Added"
          value={
            result.summary.added
          }
          type="added"
        />

        <Stat
          title="Deleted"
          value={
            result.summary.deleted
          }
          type="deleted"
        />

        <Stat
          title="Modified"
          value={
            result.summary.modified
          }
          type="modified"
        />

        <Stat
          title="Unchanged"
          value={
            result.summary.unchanged
          }
        />

      </div>

      {/* FILE SECTIONS */}

      <FileSection
        title="Added Files"
        icon="+"
        type="added"
        files={
          result.added
        }
      />

      <FileSection
        title="Deleted Files"
        icon="−"
        type="deleted"
        files={
          result.deleted
        }
      />

      <ModifiedFiles
        files={
          result.modified
        }
      />

      <FileSection
        title="Unchanged Files"
        icon="✓"
        files={
          result.unchanged
        }
      />

    </div>
  );
}

function Stat({
  title,
  value,
  type = "",
}) {
  return (
    <div
      className={`stat-card ${type}`}
    >
      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function FileSection({ title, icon, type = "", files = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="result-section" style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div 
        className="result-header" 
        onClick={() => setIsOpen(!isOpen)}
        role="button" 
        tabIndex={0} 
        aria-expanded={isOpen} 
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}  
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: isOpen ? '#f8fafc' : '#fff', transition: 'background 0.2s', borderBottom: isOpen ? '1px solid #e2e8f0' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className={`result-icon ${type}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', fontSize: '18px' }}>
            {icon}
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{title}</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{files.length} files</span>
          </div>
        </div>
        <div style={{ color: '#64748b', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', fontSize: '14px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
      </div>
      
      {isOpen && (
        <div style={{ padding: '20px' }}>
          {files.length === 0 ? (
            <div className="no-files" style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>No files</div>
          ) : (
            <div className="file-list">
              {files.map((file) => (
                <div className="file-row" key={file} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#94a3b8' }}>*</span>
                  <code>{file}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SectionAccordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        role="button" 
        tabIndex={0} 
        aria-expanded={isOpen} 
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} 
        style={{ padding: '10px 16px', background: '#f8fafc', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', fontSize: '13px', fontWeight: '600', color: '#475569' }}
      >
        <span style={{ marginRight: '8px', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
        {title}
      </div>
      {isOpen && (
        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ModifiedFileCard({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate added and removed lines count
  const addedLines = item.changes.filter(c => c.added).reduce((acc, c) => acc + (c.value.match(/\n/g) || []).length, 0) || item.changes.filter(c => c.added).length;
  const removedLines = item.changes.filter(c => c.removed).reduce((acc, c) => acc + (c.value.match(/\n/g) || []).length, 0) || item.changes.filter(c => c.removed).length;

  return (
    <div className="modified-file-card" style={{ marginBottom: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* HEADER */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button" 
        tabIndex={0} 
        aria-expanded={isExpanded} 
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} 
        style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff', transition: 'background 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{ color: '#64748b', fontSize: '14px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▶</div>
          <code style={{ fontSize: '14px', color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.file}</code>
          <span style={{ fontSize: '11px', padding: '2px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '12px', fontWeight: 700, flexShrink: 0 }}>MODIFIED</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
          <span style={{ color: '#16a34a' }}>+{addedLines} added</span>
          <span style={{ color: '#dc2626' }}>-{removedLines} removed</span>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
          
          <SectionAccordion title="Code Diff">
            <div className="diff-container" style={{ margin: 0 }}>
              {item.changes.map((change, index) => (
                <pre
                  key={index}
                  className={change.added ? "diff-added" : change.removed ? "diff-removed" : "diff-normal"}
                  style={{ margin: 0, padding: change.added || change.removed ? '2px 8px' : '0 8px' }}
                >
                  {change.value}
                </pre>
              ))}
            </div>
          </SectionAccordion>

          {addedLines > 0 && (
            <SectionAccordion title="Added Lines">
              <div className="diff-container" style={{ margin: 0 }}>
                {item.changes.filter(c => c.added).map((change, index) => (
                  <pre key={index} className="diff-added" style={{ margin: 0, padding: '2px 8px' }}>
                    {change.value}
                  </pre>
                ))}
              </div>
            </SectionAccordion>
          )}

          {removedLines > 0 && (
            <SectionAccordion title="Removed Lines">
              <div className="diff-container" style={{ margin: 0 }}>
                {item.changes.filter(c => c.removed).map((change, index) => (
                  <pre key={index} className="diff-removed" style={{ margin: 0, padding: '2px 8px' }}>
                    {change.value}
                  </pre>
                ))}
              </div>
            </SectionAccordion>
          )}

        </div>
      )}
    </div>
  );
}

function ModifiedFiles({ files = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="result-section" style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div 
        className="result-header" 
        onClick={() => setIsOpen(!isOpen)}
        role="button" 
        tabIndex={0} 
        aria-expanded={isOpen} 
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}  
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: isOpen ? '#f8fafc' : '#fff', transition: 'background 0.2s', borderBottom: isOpen ? '1px solid #e2e8f0' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="result-icon modified" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', fontSize: '18px' }}>◈</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Modified Files</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{files.length} files</span>
          </div>
        </div>
        <div style={{ color: '#64748b', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', fontSize: '14px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
      </div>

      {isOpen && (
        <div style={{ padding: '24px 20px 8px 20px', background: '#f8fafc' }}>
          {files.length === 0 ? (
            <div className="no-files" style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', paddingBottom: '16px' }}>No modified files</div>
          ) : (
            <div className="modified-list">
              {files.map(item => (
                <ModifiedFileCard key={item.file} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ChangeAnalysis;