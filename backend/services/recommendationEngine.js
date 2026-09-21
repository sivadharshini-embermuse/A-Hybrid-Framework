const path = require("path");

const {
  detectChangeContext,
  analyseFileContext,
  findCssConsumers,
  findJsSymbolConsumers,
} = require("./codeContextAnalysis");

// =====================================================
// NORMALIZE
// =====================================================



function normalize(file) {
  return String(file)
    .replace(/\\/g, "/");
}


function buildReverseDependencyMap(
  dependencyMap
) {
  const reverseMap = {};

  Object.entries(
    dependencyMap || {}
  ).forEach(
    ([file, dependencies]) => {
      const source =
        normalize(file);

      if (!Array.isArray(dependencies)) {
        return;
      }

      dependencies.forEach(
        (dependency) => {
          const dependencyFile =
            normalize(dependency);

          if (!reverseMap[dependencyFile]) {
            reverseMap[dependencyFile] =
              [];
          }

          if (
            !reverseMap[
              dependencyFile
            ].includes(source)
          ) {
            reverseMap[
              dependencyFile
            ].push(source);
          }
        }
      );
    }
  );

  return reverseMap;
}

// =====================================================
// FIND IMPACTED FILES
// =====================================================

function findImpact(
  file,
  reverseMap
) {
  const result = {
    direct: [],
    indirect: [],
  };

  const visited = new Set([
    file,
  ]);

  const queue = [
    {
      file,
      level: 0,
    },
  ];

  while (queue.length > 0) {
    const current =
      queue.shift();

    const affected =
      reverseMap[
        current.file
      ] || [];

    affected.forEach(
      (affectedFile) => {
        if (
          visited.has(
            affectedFile
          )
        ) {
          return;
        }

        visited.add(
          affectedFile
        );

        if (
          current.level === 0
        ) {
          result.direct.push(
            affectedFile
          );
        } else {
          result.indirect.push(
            affectedFile
          );
        }

        queue.push({
          file: affectedFile,
          level:
            current.level + 1,
        });
      }
    );
  }

  return result;
}

// =====================================================
// PRIORITY
// =====================================================

function calculateSeverity({
  directCount,
  indirectCount,
  categories,
  file,
}) {
  let score = 0;

  score +=
    directCount * 3;

  score +=
    indirectCount * 1;

  if (
    categories.includes(
      "business-logic"
    )
  ) {
    score += 3;
  }

  if (
    categories.includes("api")
  ) {
    score += 3;
  }

  if (
    categories.includes(
      "routing"
    )
  ) {
    score += 3;
  }

  if (
    categories.includes(
      "state-management"
    )
  ) {
    score += 2;
  }

  if (
    categories.includes("ui")
  ) {
    score += 1;
  }

  if (
    /\.(config|env)/i.test(file)
  ) {
    score += 3;
  }

  if (score >= 7) {
    return "HIGH";
  }

  if (score >= 3) {
    return "MEDIUM";
  }

  return "LOW";
}

// =====================================================
// CONTEXT DESCRIPTION
// =====================================================

function buildContextDescription(
  file,
  context,
  impact,
  cssConsumers = {},
) {
  const parts = [];
  if (
    path.extname(file) === ".css"
    ) {
    const actualConsumers = [
        ...new Set(
        Object.values(cssConsumers || {})
            .flat()
        ),
    ];

    let message =
        `Styles were modified in ${file}.`;

    if (
        context.cssSelectors?.length > 0
    ) {
        message +=
        ` Changed selectors: ${context.cssSelectors
            .slice(0, 5)
            .join(", ")}.`;
    }

    if (
        actualConsumers.length > 0
    ) {
        message +=
        ` These styles are used by ${actualConsumers
            .slice(0, 5)
            .join(", ")}.`;
    }

    return message;
    }


  if (
    context.functions.length > 0
  ) {
    parts.push(
      `The change affects ${context.functions
        .slice(0, 3)
        .join(", ")}.`
    );
  }

  if (
    context.categories.includes(
      "business-logic"
    )
  ) {
    parts.push(
      "The changed code appears to contain calculation or business logic."
    );
  }

  if (
    context.categories.includes(
      "state-management"
    )
  ) {
    parts.push(
      "The change affects React state management."
    );
  }

  if (
    context.categories.includes(
      "api"
    )
  ) {
    parts.push(
      "The change affects API request logic."
    );
  }

  if (
    context.categories.includes(
      "routing"
    )
  ) {
    parts.push(
      "The change affects application routing."
    );
  }

  if (
    context.categories.includes(
      "ui"
    )
  ) {
    parts.push(
      "The change affects UI rendering or interaction."
    );
  }

  if (
    impact.direct.length > 0
  ) {
    parts.push(
      `It directly affects ${impact.direct
        .slice(0, 4)
        .join(", ")}.`
    );
  }

  if (
    impact.indirect.length > 0
  ) {
    parts.push(
      `The change can also propagate to ${impact.indirect
        .slice(0, 4)
        .join(", ")}.`
    );
  }

  return parts.join(" ");
}

// =====================================================
// CONTEXT-AWARE RECOMMENDATION
// =====================================================


function buildRecommendation({
  file,
  context,
  impact,
  cssConsumers = {},
  jsSymbolConsumers = {},
}) {

  const direct =
    impact.direct;

  const indirect =
    impact.indirect;


  // CSS
  if (
    context.categories.includes("ui") &&
    path.extname(file) === ".css"
  ) {
    return `Review the components that use the changed styles in ${file}. Verify the affected layout, spacing, colors and visual behavior.`;
  }


  // CSS STYLING
  if (
    path.extname(file) === ".css" &&
    context.categories.includes("styling")
  ) {

    const actualConsumers = [
      ...new Set(
        Object.values(cssConsumers).flat()
      ),
    ];

    if (actualConsumers.length > 0) {
      return `The changed styles in ${file} are used by ${actualConsumers
        .slice(0, 5)
        .join(", ")}. Review these components for layout, spacing, sizing, colors and visual behavior changes.`;
    }

    return `Styles were modified in ${file}. No direct component usage of the changed selectors was detected. Review the affected UI visually for layout and styling regressions.`;
  }


  // ===================================================
  // 👇 PASTE JS / JSX BLOCK HERE
  // ===================================================

  if (
    path.extname(file) !== ".css" &&
    Object.keys(jsSymbolConsumers).length > 0
  ) {
    const actualConsumers = [
      ...new Set(
        Object.values(jsSymbolConsumers).flat()
      ),
    ];

    if (actualConsumers.length > 0) {
      const changedSymbols =
        Object.keys(jsSymbolConsumers);

      return `The changed code in ${file} affects ${changedSymbols
        .slice(0, 3)
        .join(", ")}. These symbols are used by ${actualConsumers
        .slice(0, 5)
        .join(", ")}. Review how these files consume the changed functionality and verify their resulting behavior.`;
    }
  }


  // ===================================================
  // BUSINESS LOGIC
  // ===================================================

  if (
    context.categories.includes(
      "business-logic"
    )
  ) {

    if (direct.length > 0) {
      return `Review ${direct
        .slice(0, 3)
        .join(", ")} where the changed calculation or business logic is consumed. Verify the resulting values and related application behavior.`;
    }

    return `Review the changed calculation or business logic in ${file} and verify its expected input and output values with relevant test cases.`;
  }


  // ===================================================
  // API
  // ===================================================

  if (
    context.categories.includes("api")
  ) {

    if (direct.length > 0) {
      return `Review ${direct
        .slice(0, 3)
        .join(", ")} for compatibility with the changed API request or response handling. Verify request parameters, response data and error handling.`;
    }

    return `Verify the API request flow in ${file}, including request parameters, response handling and failure cases.`;
  }


  // ===================================================
  // STATE
  // ===================================================

  if (
    context.categories.includes(
      "state-management"
    )
  ) {

    if (direct.length > 0) {
      return `Review ${direct
        .slice(0, 3)
        .join(", ")} for changes in state flow and rendering behavior. Verify that updated state values reach the expected UI components.`;
    }

    return `Review the state lifecycle in ${file} and verify that state updates produce the expected UI behavior.`;
  }


  // ===================================================
  // ROUTING
  // ===================================================

  if (
    context.categories.includes(
      "routing"
    )
  ) {
    return `Review the routes and navigation paths affected by ${file}. Verify that the changed route still resolves correctly and that navigation targets remain valid.`;
  }


  // ===================================================
  // UI
  // ===================================================

  if (
    context.categories.includes("ui")
  ) {

    if (direct.length > 0) {
      return `Review the UI components ${direct
        .slice(0, 3)
        .join(", ")} that consume this changed component or rendering logic. Check interaction and visual behavior.`;
    }

    return `Review the affected UI behavior in ${file}, especially rendering and user interactions related to the changed code.`;
  }


  // ===================================================
  // DEFAULT
  // ===================================================

  if (direct.length > 0) {
    return `Review ${direct
      .slice(0, 3)
      .join(", ")}, because these files directly consume or depend on the changed code in ${file}.`;
  }

  if (indirect.length > 0) {
    return `Review the downstream files ${indirect
      .slice(0, 3)
      .join(", ")} because the change can propagate through the project's dependency chain.`;
  }

  return `No dependent files were detected for ${file}. Focus validation on the changed code itself.`;
}

// =====================================================
// MAIN ENGINE
// =====================================================


function generateRecommendations({
  result,
  dependencyMap,
  modifiedProjectPath,
}) {
  if (
    !result ||
    !Array.isArray(
      result.modified
    )
  ) {
    return [];
  }

  const reverseMap =
    buildReverseDependencyMap(
      dependencyMap
    );

  const recommendations = [];

  result.modified.forEach(
    (modifiedItem) => {
      const file =
        normalize(
          modifiedItem.file
        );

      // -----------------------------------------------
      // CHANGE CONTEXT
      // -----------------------------------------------

      const context =
        detectChangeContext(
          modifiedItem.changes || []
        );

        if (path.extname(file) === ".css") {
            if (!context.categories.includes("ui")) {
                context.categories.push("ui");
            }

            if (!context.categories.includes("styling")) {
                context.categories.push("styling");
            }
            }

            let cssConsumers = {};

            if (
            path.extname(file) === ".css" &&
            context.cssSelectors?.length > 0
            ) {
            cssConsumers =
                findCssConsumers(
                  modifiedProjectPath,
                  context.cssSelectors
                );
            }

            let jsSymbolConsumers = {};

            if (
              path.extname(file) !== ".css" &&
              context.functions?.length > 0
            ) {
              jsSymbolConsumers =
                findJsSymbolConsumers(
                  modifiedProjectPath,
                  context.functions,
                  file
                );
            }

      // -----------------------------------------------
      // FILE CONTEXT
      // -----------------------------------------------

      const fileContext =
        analyseFileContext(
          modifiedProjectPath,
          file
        );

      // -----------------------------------------------
      // IMPACT
      // -----------------------------------------------

      const impact =
        findImpact(
          file,
          reverseMap
        );

      // -----------------------------------------------
      // SEVERITY
      // -----------------------------------------------

      const severity =
        calculateSeverity({
          directCount:
            impact.direct.length,

          indirectCount:
            impact.indirect.length,

          categories:
            context.categories,

          file,
        });

      // -----------------------------------------------
      // REASON
      // -----------------------------------------------

      const reason =
        buildContextDescription(
          file,
          context,
          impact,
          cssConsumers
        );

      // -----------------------------------------------
      // RECOMMENDATION
      // -----------------------------------------------

      const recommendation =
        buildRecommendation({
          file,
          context,
          impact,
          cssConsumers,
          jsSymbolConsumers,
        });

      recommendations.push({
        file,
        severity,
        
        impactType:
          impact.direct.length > 0
            ? "DIRECT"
            : impact.indirect.length >
              0
            ? "INDIRECT"
            : "ISOLATED",

        changedFunctions:
          context.functions,

        changedImports:
          context.imports,

        changedVariables:
          context.variables,

        categories:
          context.categories,

        cssSelectors:
          context.cssSelectors || [],
          cssConsumers,

        jsSymbolConsumers,

        directImpact:
          impact.direct,

        indirectImpact:
          impact.indirect,

        reason,

        recommendation,

        fileSymbols:
          fileContext.symbols,
      });
    }
  );

  // HIGH first
  const priority = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  recommendations.sort(
    (a, b) =>
      priority[a.severity] -
      priority[b.severity]
  );

  return recommendations;
}

module.exports = {
  generateRecommendations,
};