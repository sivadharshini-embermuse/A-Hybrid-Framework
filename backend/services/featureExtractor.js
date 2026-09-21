const path = require("path");

function extractFeatures({
  file,
  changes = [],
  directImpact = [],
  indirectImpact = [],
  context = {},
}) {
  function getChangeLineCount(change) {
  if (Number.isInteger(change.count)) {
    return change.count;
  }

  if (typeof change.value === "string") {
    return change.value.split("\n").length -
      (change.value.endsWith("\n") ? 1 : 0);
  }

  return 0;
}

const addedLines = changes
  .filter((change) => change.added)
  .reduce(
    (total, change) =>
      total + getChangeLineCount(change),
    0
  );

const removedLines = changes
  .filter((change) => change.removed)
  .reduce(
    (total, change) =>
      total + getChangeLineCount(change),
    0
  );

  const changedLines =
    addedLines + removedLines;

  const changedFunctions =
    Array.isArray(context.functions)
      ? context.functions.length
      : 0;

  const changedVariables =
    Array.isArray(context.variables)
      ? context.variables.length
      : 0;

  const categories =
    Array.isArray(context.categories)
      ? context.categories
      : [];

  const businessLogic =
    categories.includes("business-logic")
      ? 1
      : 0;

  const stateChange =
    categories.includes("state-management")
      ? 1
      : 0;

  const uiChange =
    categories.includes("ui")
      ? 1
      : 0;

  const apiChange =
    categories.includes("api")
      ? 1
      : 0;

  const routingChange =
    categories.includes("routing")
      ? 1
      : 0;

  const stylingChange =
    categories.includes("styling")
      ? 1
      : 0;

  const eventHandlingChange =
    categories.includes("event-handling")
      ? 1
      : 0;

  const extension =
    path.extname(file).toLowerCase();

  const isJavaScript =
    [".js", ".jsx", ".ts", ".tsx"].includes(
      extension
    )
      ? 1
      : 0;

  const isCSS =
    extension === ".css"
      ? 1
      : 0;

  return {
    file,

    changedLines,
    addedLines,
    removedLines,

    changedFunctions,
    changedVariables,

    directDependencies:
      directImpact.length,

    indirectDependencies:
      indirectImpact.length,

    totalDependencies:
      directImpact.length +
      indirectImpact.length,

    businessLogic,
    stateChange,
    uiChange,
    apiChange,
    routingChange,
    stylingChange,
    eventHandlingChange,

    isJavaScript,
    isCSS,
  };
}

function extractProjectFeatures({
  modifiedFiles = [],
  contextMap = {},
  impactMap = {},
}) {
  return modifiedFiles.map((item) => {
    const file = item.file;

    const context =
      contextMap[file] || {};

    const impact =
      impactMap[file] || {
        direct: [],
        indirect: [],
      };

    return extractFeatures({
      file,
      changes: item.changes || [],
      directImpact:
        impact.direct || [],
      indirectImpact:
        impact.indirect || [],
      context,
    });
  });
}

module.exports = {
  extractFeatures,
  extractProjectFeatures,
};