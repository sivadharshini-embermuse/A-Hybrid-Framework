const test = require("node:test");
const assert = require("node:assert");
const { extractFeatures } = require("../services/featureExtractor");

test("Feature Extraction", async (t) => {
  await t.test("Extracts features deterministically", () => {
    const input = {
      file: "src/App.jsx",
      changes: [
        { added: true, value: "function newFunc() {}" },
        { removed: true, value: "const old = 1;" }
      ],
      directImpact: ["src/Child.jsx"],
      indirectImpact: ["src/Grandchild.jsx"],
      context: {
        functions: ["newFunc"],
        variables: ["old"],
        categories: ["business-logic", "state-management", "api"]
      }
    };

    const result = extractFeatures(input);

    assert.strictEqual(result.file, "src/App.jsx");
    assert.strictEqual(result.changedLines, 2);
    assert.strictEqual(result.addedLines, 1);
    assert.strictEqual(result.removedLines, 1);
    assert.strictEqual(result.changedFunctions, 1);
    assert.strictEqual(result.changedVariables, 1);
    assert.strictEqual(result.directDependencies, 1);
    assert.strictEqual(result.indirectDependencies, 1);
    assert.strictEqual(result.totalDependencies, 2);
    assert.strictEqual(result.businessLogic, 1);
    assert.strictEqual(result.stateChange, 1);
    assert.strictEqual(result.apiChange, 1);
    assert.strictEqual(result.uiChange, 0); // Not in categories
    assert.strictEqual(result.isJavaScript, 1); // .jsx extension
    assert.strictEqual(result.isCSS, 0);
  });
  
  await t.test("Handles empty inputs gracefully", () => {
    const result = extractFeatures({ file: "test.css" });
    assert.strictEqual(result.changedLines, 0);
    assert.strictEqual(result.isJavaScript, 0);
    assert.strictEqual(result.isCSS, 1);
  });
});
