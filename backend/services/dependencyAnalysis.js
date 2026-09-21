const fs = require("fs");
const path = require("path");

const CODE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
];

function normalizeProjectRoot(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  if (
    entries.length === 1 &&
    entries[0].isDirectory()
  ) {
    return path.join(
      directory,
      entries[0].name
    );
  }

  return directory;
}

function getAllFiles(directory, base = directory) {
  let files = [];

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(
      directory,
      entry.name
    );

    if (entry.isDirectory()) {
      files = files.concat(
        getAllFiles(fullPath, base)
      );
    } else {
      files.push(
        path.relative(base, fullPath)
      );
    }
  }

  return files;
}

function resolveImport(
  projectDir,
  currentFile,
  importPath
) {
  const currentDirectory = path.dirname(
    path.join(projectDir, currentFile)
  );

  const absolutePath = path.resolve(
    currentDirectory,
    importPath
  );

  const possiblePaths = [
    absolutePath,
    `${absolutePath}.js`,
    `${absolutePath}.jsx`,
    `${absolutePath}.ts`,
    `${absolutePath}.tsx`,

    path.join(
      absolutePath,
      "index.js"
    ),

    path.join(
      absolutePath,
      "index.jsx"
    ),

    path.join(
      absolutePath,
      "index.ts"
    ),

    path.join(
      absolutePath,
      "index.tsx"
    ),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return path.relative(
        projectDir,
        filePath
      );
    }
  }

  return null;
}

function extractImports(content) {
  const imports = [];

  const importRegex =
    /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

  const requireRegex =
    /require\s*\(\s*["']([^"']+)["']\s*\)/g;

  let match;

  while (
    (match = importRegex.exec(content)) !== null
  ) {
    imports.push(match[1]);
  }

  while (
    (match = requireRegex.exec(content)) !== null
  ) {
    imports.push(match[1]);
  }

  return imports;
}

function analyseDependencies(projectDir) {
  // Remove ZIP's single outer project folder
  projectDir =
    normalizeProjectRoot(projectDir);

  const files = getAllFiles(projectDir);

  const dependencyMap = {};

  for (const file of files) {
    const extension = path.extname(file);

    if (!CODE_EXTENSIONS.includes(extension)) {
      continue;
    }

    const fullPath = path.join(
      projectDir,
      file
    );

    let content;

    try {
      content = fs.readFileSync(
        fullPath,
        "utf8"
      );
    } catch {
      continue;
    }

    const imports =
      extractImports(content);

    const dependencies = [];

    for (const importPath of imports) {

      // Ignore external packages
      if (!importPath.startsWith(".")) {
        continue;
      }

      const resolvedFile =
        resolveImport(
          projectDir,
          file,
          importPath
        );

      if (
        resolvedFile &&
        !dependencies.includes(
          resolvedFile
        )
      ) {
        dependencies.push(
          resolvedFile
        );
      }
    }

    dependencyMap[file] =
      dependencies;
  }

  return dependencyMap;
}

module.exports = {
  analyseDependencies,
};