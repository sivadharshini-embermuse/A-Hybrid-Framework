const fs = require("fs");
const path = require("path");
const { diffLines } = require("diff");

function getFiles(directory, base = directory) {
  let files = [];

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(getFiles(fullPath, base));
    } else {
      files.push(path.relative(base, fullPath));
    }
  }

  return files;
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

// Removes the common single root folder from a ZIP
function normalizeProjectRoot(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  if (entries.length === 1 && entries[0].isDirectory()) {
    return path.join(directory, entries[0].name);
  }

  return directory;
}

function compareProjects(originalDir, modifiedDir) {
  // Normalize ZIP root folders
  originalDir = normalizeProjectRoot(originalDir);
  modifiedDir = normalizeProjectRoot(modifiedDir);

  const originalFiles = getFiles(originalDir);
  const modifiedFiles = getFiles(modifiedDir);

  const allFiles = new Set([
    ...originalFiles,
    ...modifiedFiles,
  ]);

  const added = [];
  const deleted = [];
  const modified = [];
  const unchanged = [];

  for (const file of allFiles) {
    const originalFile = path.join(
      originalDir,
      file
    );

    const modifiedFile = path.join(
      modifiedDir,
      file
    );

    const originalExists =
      fs.existsSync(originalFile);

    const modifiedExists =
      fs.existsSync(modifiedFile);

    // Added
    if (!originalExists && modifiedExists) {
      added.push(file);
      continue;
    }

    // Deleted
    if (originalExists && !modifiedExists) {
      deleted.push(file);
      continue;
    }

    const originalContent =
      readFile(originalFile);

    const modifiedContent =
      readFile(modifiedFile);

    // Unchanged
    if (originalContent === modifiedContent) {
      unchanged.push(file);
      continue;
    }

    // Modified
    const changes = diffLines(
      originalContent,
      modifiedContent
    );

    modified.push({
      file,
      changes,
    });
  }

  return {
    summary: {
      totalFiles: allFiles.size,
      added: added.length,
      deleted: deleted.length,
      modified: modified.length,
      unchanged: unchanged.length,
    },

    added,
    deleted,
    modified,
    unchanged,
  };
}

module.exports = {
  compareProjects,
};