const test = require("node:test");
const assert = require("node:assert");
const { analyseImpact } = require("../services/impactAnalysis");

test("Impact Analysis", async (t) => {
  const dependencyMap = {
    "App.js": ["Dashboard.jsx"],
    "Dashboard.jsx": ["UserService.js"],
    "UserService.js": []
  };

  await t.test("Case A: A changed file with no dependents", () => {
    const modifiedFiles = ["App.js"];
    const result = analyseImpact(modifiedFiles, dependencyMap);
    
    assert.ok(result["App.js"]);
    assert.strictEqual(result["App.js"].length, 0);
  });

  await t.test("Case B: A changed file with known dependents", () => {
    const modifiedFiles = ["UserService.js"];
    const result = analyseImpact(modifiedFiles, dependencyMap);
    
    assert.ok(result["UserService.js"]);
    // Since App.js depends on Dashboard, and Dashboard depends on UserService,
    // if UserService changes, Dashboard and App are affected.
    assert.ok(result["UserService.js"].includes("Dashboard.jsx"));
    assert.ok(result["UserService.js"].includes("App.js"));
    assert.strictEqual(result["UserService.js"].length, 2);
  });
});
