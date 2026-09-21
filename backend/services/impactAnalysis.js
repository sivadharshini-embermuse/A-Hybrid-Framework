function normalizePath(filePath) {
  return filePath
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "");
}

function analyseImpact(modifiedFiles, dependencyMap) {
  const reverseDependencyMap = {};

  // Build reverse dependency map
  //
  // If:
  // App.jsx -> Calculator.jsx
  //
  // Then:
  // Calculator.jsx -> App.jsx

  for (const [file, dependencies] of Object.entries(
    dependencyMap
  )) {
    const normalizedFile = normalizePath(file);

    if (!reverseDependencyMap[normalizedFile]) {
      reverseDependencyMap[normalizedFile] = [];
    }

    for (const dependency of dependencies) {
      const normalizedDependency =
        normalizePath(dependency);

      if (
        !reverseDependencyMap[normalizedDependency]
      ) {
        reverseDependencyMap[normalizedDependency] = [];
      }

      if (
        !reverseDependencyMap[
          normalizedDependency
        ].includes(normalizedFile)
      ) {
        reverseDependencyMap[
          normalizedDependency
        ].push(normalizedFile);
      }
    }
  }

  const impactMap = {};

  for (const modifiedFile of modifiedFiles) {
    const normalizedModifiedFile =
      normalizePath(modifiedFile);

    const affectedFiles = [];
    const visited = new Set();

    const queue = [normalizedModifiedFile];

    while (queue.length > 0) {
      const currentFile = queue.shift();

      if (visited.has(currentFile)) {
        continue;
      }

      visited.add(currentFile);

      const dependents =
        reverseDependencyMap[currentFile] || [];

      for (const dependent of dependents) {
        if (
          !affectedFiles.includes(dependent)
        ) {
          affectedFiles.push(dependent);
        }

        queue.push(dependent);
      }
    }

    impactMap[normalizedModifiedFile] =
      affectedFiles;
  }

  return impactMap;
}

module.exports = {
  analyseImpact,
};