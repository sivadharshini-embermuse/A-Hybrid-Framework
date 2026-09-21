const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { compareProjects } = require("../services/changeDetection");

test("Change Detection", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "impact-test-cd-"));
  const origDir = path.join(tmpDir, "original");
  const modDir = path.join(tmpDir, "modified");

  fs.mkdirSync(origDir);
  fs.mkdirSync(modDir);

  await t.test("Case A: Added content", () => {
    fs.writeFileSync(path.join(origDir, "added.js"), "line1\n");
    fs.writeFileSync(path.join(modDir, "added.js"), "line1\nline2\n");
    
    const result = compareProjects(origDir, modDir);
    const fileChange = result.modified.find(m => m.file === "added.js");
    assert.ok(fileChange, "File should be modified");
    
    const addedDiff = fileChange.changes.find(c => c.added);
    assert.ok(addedDiff, "Should detect added lines");
    assert.strictEqual(addedDiff.value, "line2\n");
  });

  await t.test("Case B: Removed content", () => {
    fs.writeFileSync(path.join(origDir, "removed.js"), "line1\nline2\n");
    fs.writeFileSync(path.join(modDir, "removed.js"), "line1\n");
    
    const result = compareProjects(origDir, modDir);
    const fileChange = result.modified.find(m => m.file === "removed.js");
    assert.ok(fileChange, "File should be modified");
    
    const removedDiff = fileChange.changes.find(c => c.removed);
    assert.ok(removedDiff, "Should detect removed lines");
    assert.strictEqual(removedDiff.value, "line2\n");
  });

  await t.test("Case C: Unchanged file", () => {
    fs.writeFileSync(path.join(origDir, "unchanged.js"), "line1\n");
    fs.writeFileSync(path.join(modDir, "unchanged.js"), "line1\n");
    
    const result = compareProjects(origDir, modDir);
    assert.ok(result.unchanged.includes("unchanged.js"), "File should be marked as unchanged");
    assert.strictEqual(result.modified.find(m => m.file === "unchanged.js"), undefined);
  });

  await t.test("Edge Case: Empty project", () => {
    const emptyOrig = path.join(tmpDir, "emptyOrig");
    const emptyMod = path.join(tmpDir, "emptyMod");
    fs.mkdirSync(emptyOrig);
    fs.mkdirSync(emptyMod);
    
    const result = compareProjects(emptyOrig, emptyMod);
    assert.strictEqual(result.summary.totalFiles, 0);
  });
  
  await t.test("Edge Case: Changed file that does not exist in original (Added file)", () => {
    fs.writeFileSync(path.join(modDir, "newfile.js"), "new");
    const result = compareProjects(origDir, modDir);
    assert.ok(result.added.includes("newfile.js"));
  });
});
