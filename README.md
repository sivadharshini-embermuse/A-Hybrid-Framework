<div align="center">

# 🚀 Impact Analyzer

### A Hybrid Framework for Code Change Impact Analysis and Risk Prediction in Software Maintenance

<p>
  <b>Understand what changed • Identify what may be affected • Predict change risk • Recommend what to review</b>
</p>

<br>

<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white">
<img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white">
<img src="https://img.shields.io/badge/ML-Python%20%2B%20Scikit--learn-F7931E?style=for-the-badge&logo=python&logoColor=white">
<img src="https://img.shields.io/badge/Testing-14%2F14%20Passed-success?style=for-the-badge">

</div>

---

## 📌 Overview

**Impact Analyzer** is a software maintenance system designed to help
developers understand the potential **impact and risk of source-code changes**.

The system compares an **original repository** with a **modified repository**,
detects file-level changes, analyzes source-code dependencies, constructs a
dependency graph, propagates structural impact using **Breadth-First Search
(BFS)**, predicts change risk using **Machine Learning**, and generates
**context-aware developer recommendations**.

---

## 🎯 Problem Statement

Modern JavaScript and TypeScript applications contain highly interconnected
source files.

A small modification in one file can potentially affect multiple files through
direct or indirect dependencies.

Traditional diff tools mainly answer:

> **"What changed?"**

Impact Analyzer extends this question to:

> **"What could be affected, how risky is the change, why is it risky, and what should the developer review?"**

### The system addresses this gap by combining:

- 🔍 Repository-level change detection
- 🌳 AST-based dependency analysis
- 🕸️ Dependency graph construction
- 🔄 BFS-based impact propagation
- 🤖 Machine-learning risk prediction
- 💡 Feature-based explainability
- 🎯 Context-aware recommendations
- 📊 Interactive visualization

---

## 🎯 Objectives

<table>
<tr>
<td>

### 🔎 Analysis

- Compare original and modified repositories
- Detect added, deleted, modified, and unchanged files
- Analyze source-code dependencies
- Construct a dependency graph
- Identify direct and indirect impact using BFS

</td>
<td>

### 🤖 Intelligence

- Extract change-related ML features
- Estimate software-change risk
- Explain influential prediction features
- Generate context-aware recommendations
- Present actionable analysis results

</td>
</tr>
</table>

---

# 🏗️ Proposed Approach

## 1️⃣ Repository Comparison & Change Detection

The user provides:

```text
Original Repository (.ZIP)
             +
Modified Repository (.ZIP)
             ↓
      Repository Processing
             ↓
       Change Detection
```

Files are categorized as:

| Category | Description |
|---|---|
| 🟢 Added | New files introduced in the modified repository |
| 🔴 Deleted | Files removed from the modified repository |
| 🟡 Modified | Existing files whose contents changed |
| ⚪ Unchanged | Files that remain unchanged |

Modified files also contain **line-level change information**.

---

## 2️⃣ Dependency & Impact Analysis

AST-based analysis identifies source-code dependency relationships.

These relationships are represented using a **dependency graph**.

Impact is propagated using **Breadth-First Search (BFS)**.

```text
Level 0
   │
   ▼
Modified File
   │
   ├──────────────┐
   ▼              ▼
Level 1        Level 1
Direct         Direct
Impact         Impact
   │
   ▼
Level 2+
Indirect Impact
```

### Impact Levels

| Level | Meaning |
|---|---|
| `Level 0` | Modified file |
| `Level 1` | Directly affected dependent files |
| `Level 2+` | Indirectly affected files |

---

# 🤖 Machine Learning Risk Prediction

The ML component uses the **JIT-on-JavaScript-projects replication dataset**,
covering historical changes from **20 JavaScript projects**.

The implemented representation contains:

- **19 total features**
- 14 traditional JIT features
- 5 JavaScript-specific features

### Model

```text
HistGradientBoostingClassifier
```

### Evaluation Results

| Metric | Result |
|---|---:|
| ROC-AUC | **0.871** |
| F1-Score | **0.540** |
| PR-AUC | **0.551** |

### ⭐ Feature Importance

The strongest reported feature is:

```text
Lines Added (la)
Mean Importance ≈ 0.328
```

### Statistical Comparison

A Wilcoxon comparison produced:

```text
p = 0.125
```

Therefore, the JavaScript-specific feature extension was **not statistically
significant** over the traditional baseline in the evaluated comparison.

---

# 🔄 System Workflow

```text
┌───────────────────────────────┐
│ Original + Modified Repository│
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│     Repository Processing     │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Change Detection        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│    AST Dependency Analysis    │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│  Dependency Graph Construction│
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│     BFS Impact Propagation    │
└───────────────┬───────────────┘
                ↓
       ┌────────┴────────┐
       ↓                 ↓
┌──────────────┐  ┌──────────────┐
│   Feature    │  │   Impact     │
│  Extraction  │  │  Information │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                ↓
┌───────────────────────────────┐
│       ML Risk Prediction      │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Explainability         │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│ Context-Aware Recommendations │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Interactive Results      │
└───────────────────────────────┘
```

---

# 🖥️ Application Modules

<table>
<tr>
<th>Module</th>
<th>Purpose</th>
</tr>

<tr>
<td>📊 Dashboard</td>
<td>Main entry point for repository analysis and project overview.</td>
</tr>

<tr>
<td>🔍 Change Analysis</td>
<td>Displays added, deleted, modified and unchanged files with file-level differences.</td>
</tr>

<tr>
<td>🕸️ Impact Graph</td>
<td>Visualizes modified files and their direct and indirect dependencies.</td>
</tr>

<tr>
<td>📁 Project Explorer</td>
<td>Repository-level file browsing and source-code inspection.</td>
</tr>

<tr>
<td>🎯 Recommendations</td>
<td>Provides developer-oriented guidance describing what to review and why.</td>
</tr>

<tr>
<td>🤖 Risk Prediction</td>
<td>Displays predicted risk, influential features and model information.</td>
</tr>

<tr>
<td>⚙️ Settings</td>
<td>Provides application-level configuration.</td>
</tr>

</table>

---

# 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| 🎨 Frontend | React, Vite, JavaScript, CSS |
| 🖱️ Visualization | `@xyflow/react` |
| ⚙️ Backend | Node.js, Express.js, REST API |
| 🐍 ML | Python, Flask, Scikit-learn |
| 🧠 Model | HistGradientBoostingClassifier |
| 🔬 Analysis | AST-based dependency analysis |
| 🕸️ Graph | Dependency Graph + BFS |
| 📦 Repository | ZIP extraction + repository comparison |

---

# 🔌 Backend API

### Primary Analysis Endpoint

```http
POST /api/analyze
```

The endpoint accepts:

```text
multipart/form-data
```

containing:

```text
Original Repository
Modified Repository
```

and returns the analysis result consumed by the frontend.

### ML Service

```http
POST http://127.0.0.1:8001/predict
```

The Node.js backend communicates with the Python ML service to obtain
risk predictions.

---

# 📂 Project Structure

```text
Impact Analyzer/
│
├── frontend/
│   ├── Dashboard/
│   ├── Change Analysis/
│   ├── Impact Graph/
│   ├── Project Explorer/
│   ├── Recommendations/
│   ├── Risk Prediction/
│   └── Settings/
│
├── backend/
│   ├── Repository Processing/
│   ├── Change Detection/
│   ├── Dependency Analysis/
│   ├── Impact Analysis/
│   └── API Layer/
│
└── backend/ml/
    ├── Feature Extraction/
    ├── Model Prediction/
    └── Explainability/
```

---

# 🚀 Running the Project

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
npm install
node server.js
```

## ML Service

```bash
cd backend/ml
python predict_api.py
```

> Use the ports defined by the current project configuration.

---

# 🧪 Testing & Verification

The completed implementation was verified through backend and
end-to-end testing.

### Backend Testing

<div align="center">

### ✅ 14 / 14 Tests Passed

```text
Tests Passed   : 14
Tests Failed   : 0
Status         : PASS
```

</div>

### E2E Verification

The verification covered:

- ✅ Repository upload
- ✅ Change detection
- ✅ Dependency analysis
- ✅ BFS impact propagation
- ✅ ML prediction
- ✅ Risk aggregation
- ✅ Change Analysis accordions
- ✅ Impact Graph
- ✅ Project Explorer
- ✅ Recommendations
- ✅ Risk Prediction
- ✅ Navigation
- ✅ Data consistency
- ✅ Responsiveness
- ✅ Keyboard accessibility
- ✅ API integration
- ✅ Console/error behavior

---

# 📑 Progressive Disclosure

The **Change Analysis** interface uses a two-level accordion structure:

```text
Category Accordion
       │
       └── Modified Files
                │
                └── File Accordion
                        │
                        └── Diff Content
```

Accordion interactions do not mutate the underlying analysis data or trigger
unnecessary API requests.

---

# ⭐ Key Contributions

Impact Analyzer integrates:

```text
Repository Change Detection
            +
AST Dependency Analysis
            +
Dependency Graph Construction
            +
BFS Impact Propagation
            +
JIT Machine Learning
            +
Feature Explainability
            +
Context-Aware Recommendations
            +
Interactive Visualization
```

### Main Contribution

The primary contribution is the integration of **deterministic dependency
evidence** and **probabilistic risk evidence** into a single
software-maintenance workflow.

The project does not claim to introduce a new AST, BFS, or JIT algorithm
individually.

---

# ⚠️ Limitations

<details>
<summary><b>Click to expand limitations</b></summary>

<br>

### 1. Dependency Coverage

Dependency analysis is focused on supported JavaScript/TypeScript
source relationships.

### 2. Historical Data

ML performance depends on the quality and representativeness of historical
software-change data.

### 3. Statistical Significance

The evaluated JavaScript-specific feature extension was not statistically
significant in the reported Wilcoxon comparison.

### 4. Risk Interpretation

Risk prediction is decision support and does not guarantee that a defect
will occur.

### 5. Impact Interpretation

Dependency impact indicates potential influence rather than guaranteed
downstream failure.

</details>

---

# 📈 Current Project Status

| Area | Status |
|---|---|
| Frontend | ✅ Completed |
| Backend | ✅ Completed |
| Change Detection | ✅ Completed |
| Dependency Analysis | ✅ Completed |
| BFS Impact Analysis | ✅ Completed |
| ML Risk Prediction | ✅ Completed |
| Explainability | ✅ Completed |
| Recommendations | ✅ Completed |
| UI/UX Refinement | ✅ Completed |
| Backend Testing | ✅ 14/14 Passed |
| E2E Verification | ✅ Completed |

---

# 🏆 Conclusion

**Impact Analyzer** provides a unified approach for understanding the
potential impact and risk of software changes.

By combining:

> Repository Comparison + Dependency Analysis + BFS Impact Propagation +
> Machine Learning + Explainability + Recommendations

the system provides developers with broader **change intelligence** than a
conventional file-diff workflow.

The core implementation and verification are complete. The project is
currently being prepared for final documentation, IEEE paper preparation,
presentation, and demonstration.

---

# 🔑 Keywords

```text
Software Maintenance
Change Impact Analysis
JavaScript
TypeScript
Dependency Analysis
Abstract Syntax Tree
Breadth-First Search
Just-In-Time Defect Prediction
Machine Learning
Risk Prediction
Explainable AI
Software Change Analysis
```

---

<div align="center">

## 🚀 Impact Analyzer

<b>From "What Changed?" to "What Could Be Affected?"</b>

<br>

⭐ If you find this project useful, consider giving it a star.

</div>
