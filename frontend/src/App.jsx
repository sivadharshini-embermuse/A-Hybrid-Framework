import { useState } from "react";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import AnalyzePage from "./pages/AnalyzePage";
import ChangeAnalysis from "./pages/ChangeAnalysis";
import ImpactGraph from "./pages/ImpactGraph";
import Recommendations from "./pages/Recommendations";
import RiskPrediction from "./pages/RiskPrediction";
import ProjectExplorer from "./pages/ProjectExplorer";

import Sidebar from "./components/Sidebar";

function App() {
  const [activePage, setActivePage] =
    useState("dashboard");

  const [recommendations, setRecommendations] =
  useState([]);

  const [riskPredictions, setRiskPredictions] =
  useState([]);

  const [mlFeatures, setMlFeatures] =
  useState([]);

  const [overallRisk, setOverallRisk] =
  useState(null);

  const [originalFile, setOriginalFile] =
    useState(null);

  const [modifiedFile, setModifiedFile] =
    useState(null);

  const [dependencyMap, setDependencyMap] =
    useState({});

  const [impactMap, setImpactMap] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  // =====================================================
  // EXISTING ANALYSE FUNCTION
  // =====================================================

  const analyseChanges = async () => {
    if (
      !originalFile ||
      !modifiedFile
    ) {
      setError(
        "Please upload both Original and Modified project ZIP files."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append(
        "original",
        originalFile
      );

      formData.append(
        "modified",
        modifiedFile
      );

      const response = await fetch(
        "http://localhost:5000/api/analysis/analyse",
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Analysis failed"
        );
      }

      setResult(data.result);

      setDependencyMap(
        data.dependencyMap || {}
      );

      setImpactMap(
        data.impactMap || {}
      );

      setRecommendations(
        data.recommendations || []
      );

      setRiskPredictions(
        data.riskPredictions || []
      );

      setMlFeatures(
        data.mlFeatures || []
      );

      setOverallRisk(
        data.overallRisk || null
      );

      // Automatically move to results
      setActivePage(
        "changes"
      );

    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PAGE TITLE
  // =====================================================

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";

      case "analyze":
        return "Analyze Project";

      case "changes":
        return "Change Analysis";

      case "graph":
        return "Impact Graph";

      case "explorer":
        return "Project Explorer";

      case "settings":
        return "Settings";

      default:
        return "Dashboard";
    }
  };

  return (
    <div className="app-shell">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        hasResult={!!result}
      />

      {/* =================================================
          MAIN AREA
          ================================================= */}

      <main className="main-area">

        {/* TOP BAR */}

        <header className="topbar">

          <div>
            <div className="breadcrumb">
              Project Change Analyzer
              <span>/</span>
              {getPageTitle()}
            </div>

            <h1>
              {getPageTitle()}
            </h1>
          </div>

          <div className="topbar-status">
            <span className="status-dot"></span>

            {result
              ? "Analysis completed"
              : "Ready to analyze"}
          </div>

        </header>

        {/* PAGE CONTENT */}

        <section className="page-container" style={activePage === "explorer" ? { maxWidth: "none" } : {}}>

          {activePage ===
            "dashboard" && (
            <Dashboard
              result={result}
              setActivePage={
                setActivePage
              }
            />
          )}

          {activePage ===
            "analyze" && (
            <AnalyzePage
              originalFile={
                originalFile
              }
              modifiedFile={
                modifiedFile
              }
              setOriginalFile={
                setOriginalFile
              }
              setModifiedFile={
                setModifiedFile
              }
              analyseChanges={
                analyseChanges
              }
              loading={loading}
              error={error}
            />
          )}

          {activePage ===
            "changes" && (
            <ChangeAnalysis
              result={result}
              error={error}
              setActivePage={
                setActivePage
              }
            />
          )}

          {activePage ===
            "graph" && (
            <ImpactGraph
              dependencyMap={
                dependencyMap
              }
              impactMap={impactMap}
              modifiedFiles={
                result?.modified?.map(
                  (item) =>
                    item.file
                ) || []
              }
              result={result}
            />
          )}

          {activePage ===
            "recommendations" && (
            <Recommendations
              recommendations={
                recommendations
              }
            />
          )}

          {activePage ===
            "risk" && (
            <RiskPrediction
              riskPredictions={riskPredictions}
              overallRisk={overallRisk}
              mlFeatures={mlFeatures}
            />
          )}

          {activePage ===
            "explorer" && (
            <ProjectExplorer
              result={result}
              dependencyMap={dependencyMap}
              riskPredictions={riskPredictions}
            />
          )}




        </section>

      </main>
    </div>
  );
}

export default App;