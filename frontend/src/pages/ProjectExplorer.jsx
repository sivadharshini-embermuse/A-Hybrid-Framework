import { useState, useMemo } from "react";
import ExplorerGraph from "../components/ExplorerGraph";

function ProjectExplorer({
  result,
  dependencyMap,
  riskPredictions
}) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Derive the complete file list
  const allFiles = useMemo(() => {
    if (!result) return [];
    
    const files = new Set();
    
    // Unchanged
    (result.unchanged || []).forEach(f => files.add(f));
    // Added
    (result.added || []).forEach(f => files.add(f));
    // Deleted
    (result.deleted || []).forEach(f => files.add(f));
    // Modified
    (result.modified || []).forEach(item => files.add(item.file));
    
    return Array.from(files).sort();
  }, [result]);

  if (!result) {
    return (
      <div className="page-intro">
        <div>
          <h2>Project Explorer</h2>
          <p>No project analysis available. Please run an analysis first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", height: "850px" }}>
      <div className="page-intro">
        <div>
          <h2>Project Explorer</h2>
          <p>
            Visually explore the complete project structure and understand how files are connected.
          </p>
        </div>
        
        <div className="graph-summary">
          <div>
            <span>Total Files</span>
            <strong>{allFiles.length}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3.5fr 1fr", gap: "20px", flex: 1, overflow: "hidden", minHeight: "750px" }}>
        
        {/* GRAPH AREA */}
        <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          
          {/* TOOLBAR */}
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input 
              type="text" 
              placeholder="Search file..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", minWidth: "200px" }}
            />
            
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setFilter("all")} 
                style={{ padding: "6px 12px", borderRadius: "6px", background: filter === "all" ? "#f1f5f9" : "transparent", border: "1px solid #e2e8f0", cursor: "pointer" }}
              >
                All Files
              </button>
              <button 
                onClick={() => setFilter("changed")}
                style={{ padding: "6px 12px", borderRadius: "6px", background: filter === "changed" ? "#f1f5f9" : "transparent", border: "1px solid #e2e8f0", cursor: "pointer" }}
              >
                Changed Files
              </button>
              <button 
                onClick={() => setFilter("dependencies")}
                style={{ padding: "6px 12px", borderRadius: "6px", background: filter === "dependencies" ? "#f1f5f9" : "transparent", border: "1px solid #e2e8f0", cursor: "pointer" }}
              >
                Dependencies
              </button>
              <button 
                onClick={() => { setFilter("all"); setSearchQuery(""); }}
                style={{ padding: "6px 12px", borderRadius: "6px", background: "transparent", border: "1px solid #e2e8f0", cursor: "pointer" }}
              >
                Reset View
              </button>
            </div>
            
            <div style={{ marginLeft: "auto", display: "flex", gap: "12px", fontSize: "12px" }}>
              <span>🔴 Modified</span>
              <span>🟢 Added</span>
              <span>⚫ Deleted</span>
              <span>⚪ Unchanged</span>
            </div>
          </div>
          
          {/* FLOW CHART */}
          <div style={{ flex: 1, minHeight: "650px" }}>
            <ExplorerGraph 
              allFiles={allFiles}
              result={result}
              dependencyMap={dependencyMap}
              filter={filter}
              searchQuery={searchQuery}
              onNodeClick={setSelectedFile}
            />
          </div>
        </div>
        
        {/* FILE DETAILS PANEL */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", overflowY: "auto" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>File Details</h3>
          
          {selectedFile ? (
            <FileDetails 
              file={selectedFile} 
              result={result}
              dependencyMap={dependencyMap}
              riskPredictions={riskPredictions}
            />
          ) : (
            <div style={{ color: "#64748b", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
              Click on a file node to view details.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

// File details helper component
function FileDetails({ file, result, dependencyMap, riskPredictions }) {
  // Determine status
  let status = "Unchanged";
  if ((result.modified || []).some(m => m.file === file)) status = "Modified";
  if ((result.added || []).includes(file)) status = "Added";
  if ((result.deleted || []).includes(file)) status = "Deleted";
  
  // Risk
  const riskInfo = riskPredictions.find(r => r.file === file)?.prediction;
  
  // Dependencies
  const dependsOn = dependencyMap[file] || [];
  
  // Imported by
  const importedBy = [];
  Object.entries(dependencyMap).forEach(([source, deps]) => {
    if (Array.isArray(deps) && deps.includes(file)) {
      importedBy.push(source);
    }
  });

  return (
    <div style={{ fontSize: "14px", color: "#334155" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}>FILE</div>
        <div style={{ wordBreak: "break-all", fontWeight: "500" }}>{file}</div>
      </div>
      
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}>STATUS</div>
        <div style={{ 
          display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600",
          background: status === "Modified" ? "#fee2e2" : status === "Added" ? "#dcfce7" : status === "Deleted" ? "#f1f5f9" : "#f8fafc",
          color: status === "Modified" ? "#991b1b" : status === "Added" ? "#166534" : status === "Deleted" ? "#475569" : "#334155"
        }}>
          {status}
        </div>
      </div>
      
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}>RISK</div>
        <div>
          {riskInfo ? (
            <span style={{ 
              fontWeight: "600",
              color: riskInfo.riskLevel === "HIGH" ? "#dc2626" : riskInfo.riskLevel === "MEDIUM" ? "#ea580c" : "#16a34a" 
            }}>
              {riskInfo.riskLevel} ({riskInfo.riskScore})
            </span>
          ) : (
            "Not available"
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}>DEPENDS ON</div>
        {dependsOn.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: "20px", wordBreak: "break-all" }}>
            {dependsOn.map(dep => <li key={dep} style={{ marginBottom: "4px" }}>{dep}</li>)}
          </ul>
        ) : (
          <div>None</div>
        )}
      </div>
      
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", marginBottom: "4px" }}>IMPORTED BY</div>
        {importedBy.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: "20px", wordBreak: "break-all" }}>
            {importedBy.map(imp => <li key={imp} style={{ marginBottom: "4px" }}>{imp}</li>)}
          </ul>
        ) : (
          <div>None</div>
        )}
      </div>
    </div>
  );
}

export default ProjectExplorer;
