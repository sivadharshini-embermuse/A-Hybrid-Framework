const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { compareProjects } = require("../services/changeDetection");
const { analyseDependencies } = require("../services/dependencyAnalysis");
const { analyseImpact } = require("../services/impactAnalysis");
const { extractProjectFeatures } = require("../services/featureExtractor");
const { detectChangeContext } = require("../services/codeContextAnalysis");

test("Integration Test - Full Analysis Flow", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "impact-integ-"));
  const origDir = path.join(tmpDir, "original");
  const modDir = path.join(tmpDir, "modified");

  fs.mkdirSync(origDir);
  fs.mkdirSync(modDir);

  // Original files
  fs.writeFileSync(path.join(origDir, "UserService.js"), "export function getUser() { return 'user'; }");
  fs.writeFileSync(path.join(origDir, "Dashboard.js"), "import { getUser } from './UserService.js';\nfunction render() { getUser(); }");
  fs.writeFileSync(path.join(origDir, "App.js"), "import './Dashboard.js';\nfunction App() {}");

  // Modified files (Change UserService)
  fs.writeFileSync(path.join(modDir, "UserService.js"), "export function getUser() { return 'modified user'; }");
  fs.writeFileSync(path.join(modDir, "Dashboard.js"), "import { getUser } from './UserService.js';\nfunction render() { getUser(); }");
  fs.writeFileSync(path.join(modDir, "App.js"), "import './Dashboard.js';\nfunction App() {}");

  // 1. Change Detection
  const compareResult = compareProjects(origDir, modDir);
  assert.strictEqual(compareResult.modified.length, 1);
  assert.strictEqual(compareResult.modified[0].file, "UserService.js");

  // 2. Dependency Analysis (on modified dir)
  const depMap = analyseDependencies(modDir);
  assert.ok(depMap["Dashboard.js"].includes("UserService.js"));
  assert.ok(depMap["App.js"].includes("Dashboard.js"));

  // 3. Impact Analysis
  const modifiedFileNames = compareResult.modified.map(m => m.file);
  const impactMap = analyseImpact(modifiedFileNames, depMap);
  assert.ok(impactMap["UserService.js"].includes("Dashboard.js"));
  assert.ok(impactMap["UserService.js"].includes("App.js"));

  // 4. Context Analysis & Feature Extraction
  const contextMap = {};
  for (const m of compareResult.modified) {
    contextMap[m.file] = detectChangeContext(m.changes);
  }
  
  const extracted = compareResult.modified.map((item) => {
    return require("../services/featureExtractor").extractFeatures({
      file: item.file,
      changes: item.changes,
      directImpact: impactMap[item.file] || [],
      indirectImpact: [],
      context: contextMap[item.file]
    });
  });

  assert.strictEqual(extracted.length, 1);
  assert.strictEqual(extracted[0].file, "UserService.js");
  assert.strictEqual(extracted[0].totalDependencies, 2); // Dashboard and App
});
