const test = require("node:test");
const assert = require("node:assert");
const { diffLines } = require("diff");

const {
  detectChangeContext,
} = require("../services/codeContextAnalysis");

test("Detects a function whose body was changed", () => {
  const originalCode = `
function calculateTotal(price, tax) {
  return price + tax;
}
`;

  const modifiedCode = `
function calculateTotal(price, tax) {
  return price * tax;
}
`;

  // Use the exact same diff mechanism
  // used by the real application.
  const changes = diffLines(
    originalCode,
    modifiedCode
  );

  console.log("Diff:", changes);

  const context = detectChangeContext(
    changes,
    originalCode,
    modifiedCode
  );

  console.log("Detected context:", context);

  assert.ok(
    context.functions.includes(
      "calculateTotal"
    ),
    "Expected calculateTotal to be detected as changed"
  );
});