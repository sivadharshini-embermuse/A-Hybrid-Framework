Impact Analyzer

A Hybrid Framework for Code Change Impact Analysis and Risk Prediction in Software Maintenance

Impact Analyzer is a software maintenance system that helps developers
understand the potential impact and risk of source-code changes. It
compares an original repository with a modified repository, detects
file-level changes, analyzes source-code dependencies, propagates
structural impact using Breadth-First Search (BFS), predicts change risk
using machine learning, and presents the results through an interactive
web interface.

Project Status: Core implementation and testing completed. IEEE
paper, final documentation, presentation, and final demonstration are
being finalized.

1. Problem Statement

Modern JavaScript and TypeScript projects contain interconnected source
files. A change in one file can therefore affect other files through
direct or indirect dependencies. Conventional diff tools show what
changed, but provide limited information about dependency impact,
potential risk, influential factors, and recommended developer actions.

Impact Analyzer addresses this gap by combining deterministic
dependency-based analysis with machine-learning-based risk prediction in
one developer-oriented workflow.

2. Objectives

Compare original and modified repositories automatically.

Detect added, deleted, modified, and unchanged files.

Analyze source-code dependencies.

Construct a dependency graph.

Identify direct and indirect impact using BFS.

Extract change-related ML features.

Estimate change risk using historical software-change data.

Explain influential prediction features.

Generate context-aware developer recommendations.

Present analysis through an interactive interface.

3. Proposed Approach

Repository Comparison and Change Detection

The user provides an original repository ZIP and a modified repository
ZIP. The backend extracts and compares both versions and categorizes
files as Added, Deleted, Modified, or Unchanged. Modified files
also contain line-level change information.

Dependency and Impact Analysis

AST-based analysis identifies source-code dependency relationships.
These relationships are represented as a dependency graph. BFS is then
used to propagate impact from modified files.

Level 0: Modified file

Level 1: Directly affected dependent files

Level 2+: Indirectly affected files

Machine Learning Risk Prediction

The ML component uses the JIT-on-JavaScript-projects replication
dataset, covering historical changes from 20 JavaScript projects. The
implemented representation contains 19 features: 14 traditional JIT
features and 5 JavaScript-specific features.

The implemented model is HistGradientBoostingClassifier.

Metric       Result

ROC-AUC       0.871
F1-score      0.540
PR-AUC        0.551

The strongest reported feature is Lines Added (la), with mean
importance of approximately 0.328.

A Wilcoxon comparison produced p = 0.125, so the JavaScript-specific
feature extension was not statistically significant over the traditional
baseline in the evaluated comparison.

4. System Workflow

Original + Modified Repository
            |
            v
   Repository Processing
            |
            v
      Change Detection
            |
            v
  AST Dependency Analysis
            |
            v
 Dependency Graph Construction
            |
            v
  BFS Impact Propagation
        /                v           v
Structural      Feature
Impact          Extraction
                  |
                  v
             ML Prediction
                  |
                  v
            Explainability
        \           /
         v         v
      Impact + Risk Evidence
              |
              v
 Context-Aware Recommendations
              |
              v
      Interactive Results

5. Application Modules

Dashboard

Main entry point for repository analysis and project overview.

Change Analysis

Displays added, deleted, modified, and unchanged files together with
file-level differences. Collapsible sections provide progressive
disclosure for large analysis results.

Impact Graph

Visualizes modified files and their direct and indirect dependencies
with impact levels.

Project Explorer

Provides repository-level file browsing and source-code inspection.

Recommendations

Converts analysis evidence into developer-oriented guidance describing
what to review and why it matters.

Risk Prediction

Displays predicted risk, influential features, and model information.

Settings

Provides application-level configuration.

6. Technology Stack

Frontend: React, Vite, JavaScript, @xyflow/react, CSS

Backend: Node.js, Express.js, REST API

Machine Learning: Python, Flask, Scikit-learn,
HistGradientBoostingClassifier

Analysis: AST-based dependency analysis, dependency graph
construction, BFS impact propagation, repository comparison, line-level
change analysis

7. Backend API

Primary analysis endpoint:

POST /api/analyze

The endpoint accepts the original and modified repositories using
multipart/form-data and returns the analysis result consumed by the
frontend.

The backend communicates with the Python ML service through:

POST http://127.0.0.1:8001/predict

8. Project Structure

Impact Analyzer
├── Frontend
│   ├── Dashboard
│   ├── Change Analysis
│   ├── Impact Graph
│   ├── Project Explorer
│   ├── Recommendations
│   ├── Risk Prediction
│   └── Settings
│
├── Backend
│   ├── Repository Processing
│   ├── Change Detection
│   ├── Dependency Analysis
│   ├── Impact Analysis
│   └── API Layer
│
└── ML Service
    ├── Feature Extraction
    ├── Model Prediction
    └── Explainability

9. Running the Project

Frontend

cd frontend
npm install
npm run dev

Backend

cd backend
npm install
node server.js

ML Service

cd backend/ml
python predict_api.py

Use the ports defined by the current project configuration.

10. Testing and Verification

The completed implementation was verified through backend and end-to-end
testing.

Backend: 14/14 tests passed, 0 failures.

The E2E verification covered repository upload, change detection,
dependency analysis, BFS impact propagation, ML prediction, risk
aggregation, Change Analysis accordions, Impact Graph, Project Explorer,
Recommendations, Risk Prediction, navigation, data consistency,
responsiveness, keyboard accessibility, API integration, and
console/error behavior.

The Change Analysis page uses a two-level progressive disclosure
structure:

Category Accordion
      |
      └── Modified Files
              |
              └── File Accordion
                      |
                      └── Diff Content

Accordion interactions do not mutate the underlying analysis data or
trigger unnecessary API requests.

11. Key Contributions

The main contribution is the integration of:

Repository-level change detection

AST-based dependency analysis

Dependency graph construction

BFS-based impact propagation

JIT-based machine-learning risk prediction

Feature-based explainability

Context-aware recommendations

Interactive visualization

The contribution is the integration of deterministic dependency evidence
and probabilistic risk evidence into a single software-maintenance
workflow, rather than introducing a new AST, BFS, or JIT algorithm
individually.

12. Limitations

Dependency analysis is focused on supported JavaScript/TypeScript
source relationships.

ML performance depends on the quality and representativeness of
historical change data.

The evaluated JavaScript-specific feature extension was not
statistically significant in the reported Wilcoxon comparison.

Risk prediction is decision support and does not guarantee that a
defect will occur.

Dependency impact indicates potential influence rather than
guaranteed downstream failure.

13. Current Status

Area                  Status

Frontend              Completed
Backend               Completed
Change Detection      Completed
Dependency Analysis   Completed
BFS Impact Analysis   Completed
ML Risk Prediction    Completed
Explainability        Completed
Recommendations       Completed
UI/UX Refinement      Completed
Backend Testing       14/14 Passed
E2E Verification      Completed
IEEE Paper            Finalizing
Documentation         Finalizing
Presentation          Pending
Final Demo            Pending

14. Conclusion

Impact Analyzer provides a unified approach for understanding the
potential impact and risk of software changes. By combining repository
comparison, dependency analysis, BFS-based impact propagation,
machine-learning risk prediction, explainability, and recommendations,
it provides developers with broader change intelligence than a
conventional file-diff workflow.

The core implementation and verification are complete. The project is
currently being prepared for final documentation, IEEE paper
preparation, presentation, and demonstration.

15. Keywords

Software Maintenance, Change Impact Analysis, JavaScript, TypeScript,
Dependency Analysis, Abstract Syntax Tree, Breadth-First Search,
Just-In-Time Defect Prediction, Machine Learning, Risk Prediction,
Explainable AI, Software Change Analysis#   A - H y b r i d - F r a m e w o r k  
 