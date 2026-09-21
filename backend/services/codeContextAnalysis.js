const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

function extractSymbols(content) {
  const symbols = new Set();

  // function declarations
  const functionRegex =
    /(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g;

  let match;

  while (
    (match = functionRegex.exec(content)) !== null
  ) {
    const name = match[1] || match[2];

    if (name) {
      symbols.add(name);
    }
  }

  // React components
  const componentRegex =
    /(?:function|const)\s+([A-Z][A-Za-z0-9_$]*)/g;

  while (
    (match = componentRegex.exec(content)) !== null
  ) {
    symbols.add(match[1]);
  }

  // exported functions
  const exportRegex =
    /export\s+(?:default\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;

  while (
    (match = exportRegex.exec(content)) !== null
  ) {
    symbols.add(match[1]);
  }

  return Array.from(symbols);
}

function extractCssContext(content) {
  const selectors = [];
  const properties = [];

  const selectorRegex =
    /([^{}]+)\s*\{/g;

  let match;

  while ((match = selectorRegex.exec(content)) !== null) {
    const selector = match[1].trim();

    if (
      selector &&
      !selector.startsWith("@")
    ) {
      selectors.push(selector);
    }
  }

  const propertyRegex =
    /([a-z-]+)\s*:/gi;

  while ((match = propertyRegex.exec(content)) !== null) {
    properties.push(match[1]);
  }

  return {
    selectors: [...new Set(selectors)],
    properties: [...new Set(properties)],
  };
}

function detectChangedFunctions(modifiedCode, changes = []) {
  if (!modifiedCode) {
    return [];
  }

  let ast;

  try {
    ast = parser.parse(modifiedCode, {
      sourceType: "unambiguous",
      plugins: [
        "jsx",
        "typescript",
      ],
    });
  } catch (error) {
    return [];
  }

  const changedLines = [];

  let currentLine = 1;

  for (const change of changes) {
    const value = String(change.value || "");
    const lineCount = value.split("\n").length - 1;

    if (change.added) {
      for (
        let line = currentLine;
        line < currentLine + lineCount;
        line++
      ) {
        changedLines.push(line);
      }
    }

    if (!change.removed) {
      currentLine += lineCount;
    }
  }

  const functions = [];

  function visit(node, parentFunction = null) {
    if (!node || typeof node !== "object") {
      return;
    }

    let currentFunction = parentFunction;

    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      if (node.id?.name) {
        currentFunction = {
          name: node.id.name,
          start: node.loc?.start.line,
          end: node.loc?.end.line,
        };
      }
    }

    if (
      currentFunction &&
      currentFunction.start &&
      currentFunction.end
    ) {
      const overlaps = changedLines.some(
        (line) =>
          line >= currentFunction.start &&
          line <= currentFunction.end
      );

      if (
        overlaps &&
        !functions.includes(currentFunction.name)
      ) {
        functions.push(currentFunction.name);
      }
    }

    for (const key of Object.keys(node)) {
      if (
        key === "loc" ||
        key === "start" ||
        key === "end"
      ) {
        continue;
      }

      const value = node[key];

      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === "string") {
            visit(child, currentFunction);
          }
        }
      } else if (
        value &&
        typeof value.type === "string"
      ) {
        visit(value, currentFunction);
      }
    }
  }

  visit(ast);

  return functions;
}

function detectChangeContext(
  changes = [],
  originalCode = "",
  modifiedCode = ""
) {
  const addedLines = [];
  const removedLines = [];

  changes.forEach((change) => {
    const value = String(change.value || "");

    if (change.added) {
      addedLines.push(value);
    }

    if (change.removed) {
      removedLines.push(value);
    }
  });

  const changedText = [
    ...addedLines,
    ...removedLines,
  ].join("\n");

  const context = {
    functions: [],
    imports: [],
    exports: [],
    variables: [],
    jsx: [],
    cssSelectors: [],
    apis: [],
    routes: [],
    categories: [],
  };

  // -----------------------------------------------------
  // AST-based changed function detection
  const changedFunctions =
    detectChangedFunctions(
      modifiedCode,
      changes
    );

  context.functions.push(
    ...changedFunctions
  );


  // -----------------------------------------------------
  // Imports
  // -----------------------------------------------------

  const importRegex =
    /import[\s\S]*?from\s*["']([^"']+)["']/g;

  while (
    (match = importRegex.exec(changedText)) !== null
  ) {
    context.imports.push(match[1]);
  }

  // -----------------------------------------------------
  // Exports
  // -----------------------------------------------------

  const exportRegex =
    /export\s+(?:default\s+)?(?:function|const|let|var|class)?\s*([A-Za-z_$][\w$]*)?/g;

  while (
    (match = exportRegex.exec(changedText)) !== null
  ) {
    if (match[1]) {
      context.exports.push(match[1]);
    }
  }

  // -----------------------------------------------------
  // Variables / state
  // -----------------------------------------------------

  const variableRegex =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;

  while (
    (match = variableRegex.exec(changedText)) !== null
  ) {
    if (
      !context.variables.includes(match[1])
    ) {
      context.variables.push(match[1]);
    }
  }

  // React state
  if (
    /\buseState\s*\(/.test(changedText) ||
    /\bset[A-Z]\w*\s*\(/.test(changedText)
  ) {
    context.categories.push(
      "state-management"
    );
  }

  // -----------------------------------------------------
  // JSX
  // -----------------------------------------------------

  const jsxRegex =
    /<([A-Z][A-Za-z0-9.]*)\b/g;

  while (
    (match = jsxRegex.exec(changedText)) !== null
  ) {
    if (
      !context.jsx.includes(match[1])
    ) {
      context.jsx.push(match[1]);
    }
  }

  // -----------------------------------------------------
  // CSS selectors
  // -----------------------------------------------------

  const cssRegex =
    /([.#][A-Za-z_-][\w-]*)\s*\{/g;

  while (
    (match = cssRegex.exec(changedText)) !== null
  ) {
    context.cssSelectors.push(
      match[1]
    );
  }

  // -----------------------------------------------------
  // API calls
  // -----------------------------------------------------

  if (
    /\bfetch\s*\(/.test(changedText) ||
    /\baxios\./.test(changedText) ||
    /\.get\s*\(/.test(changedText) ||
    /\.post\s*\(/.test(changedText) ||
    /\.put\s*\(/.test(changedText) ||
    /\.delete\s*\(/.test(changedText)
  ) {
    context.categories.push(
      "api"
    );

    context.apis.push(
      "API request logic"
    );
  }

  // -----------------------------------------------------
  // Routes
  // -----------------------------------------------------

  if (
    /react-router|BrowserRouter|Routes|Route|useNavigate|navigate\s*\(/.test(
      changedText
    )
  ) {
    context.categories.push(
      "routing"
    );

    context.routes.push(
      "Routing logic"
    );
  }

  // -----------------------------------------------------
  // Event handling
  // -----------------------------------------------------

  if (
    /onClick|onChange|onSubmit|onBlur|onFocus/.test(
      changedText
    )
  ) {
    context.categories.push(
      "event-handling"
    );
  }

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------

  if (
    /className\s*=|style\s*=|<button|<input|<form|<div/.test(
      changedText
    )
  ) {
    context.categories.push(
      "ui"
    );
  }

  // -----------------------------------------------------
  // Calculation / business logic
  // -----------------------------------------------------

  if (
    /Math\.|reduce\s*\(|filter\s*\(|map\s*\(|calculate|total|price|amount|quantity|sum|average/.test(
      changedText
    )
  ) {
    context.categories.push(
      "business-logic"
    );
  }

  // -----------------------------------------------------
  // Deduplicate
  // -----------------------------------------------------

  context.categories = [
    ...new Set(context.categories),
  ];

  return {
    ...context,
    addedLines,
    removedLines,
  };
}

function analyseFileContext(
  projectDir,
  file
) {
  const fullPath = path.join(
    projectDir,
    file
  );

  try {
    const content =
      fs.readFileSync(
        fullPath,
        "utf8"
      );

    return {
      symbols:
        extractSymbols(content),

      extension:
        path.extname(file),

      contentLength:
        content.length,
    };
  } catch {
    return {
      symbols: [],
      extension:
        path.extname(file),
      contentLength: 0,
    };
  }
}

function findCssConsumers(projectDir, selectors) {
  const consumers = {};

  if (!Array.isArray(selectors) || selectors.length === 0) {
    return consumers;
  }

  const codeExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
  ];

  function getFiles(directory) {
    let files = [];

    const entries = fs.readdirSync(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      // Ignore unnecessary folders
      if (
        entry.isDirectory() &&
        ["node_modules", ".git", "dist", "build"].includes(
          entry.name
        )
      ) {
        continue;
      }

      const fullPath = path.join(
        directory,
        entry.name
      );

      if (entry.isDirectory()) {
        files = files.concat(
          getFiles(fullPath)
        );
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  const files = getFiles(projectDir);

  for (const selector of selectors) {
    consumers[selector] = [];
  }

  for (const fullPath of files) {
    const extension =
      path.extname(fullPath);

    if (!codeExtensions.includes(extension)) {
      continue;
    }

    let content;

    try {
      content = fs.readFileSync(
        fullPath,
        "utf8"
      );
    } catch {
      continue;
    }

    const relativeFile =
      normalizePath(
        path.relative(
          projectDir,
          fullPath
        )
      );

    // Do not count the CSS file itself
    if (extension === ".css") {
      continue;
    }

    selectors.forEach((selector) => {
      const cleanSelector =
        selector.trim();

      if (!cleanSelector) {
        return;
      }

      let className = cleanSelector;

      if (className.startsWith(".")) {
        className =
          className.substring(1);
      }

      // className="button"
      // className='button'
      // className={`button`}
      // className="foo button bar"
      const classRegex =
        new RegExp(
          `(?:className|class)\\s*=\\s*(?:["'\`][^"'\\\`]*\\b${escapeRegex(
            className
          )}\\b[^"'\\\`]*["'\`])`,
          "m"
        );

      // Simple fallback for:
      // className={condition ? "button" : ""}
      const simpleStringRegex =
        new RegExp(
          `["'\`]${escapeRegex(
            className
          )}["'\`]`,
          "m"
        );

      if (
        classRegex.test(content) ||
        simpleStringRegex.test(content)
      ) {
        consumers[selector].push(
          relativeFile
        );
      }
    });
  }

  return consumers;
}

function findJsSymbolConsumers(projectDir, symbols, currentFile) {
  const consumers = {};

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return consumers;
  }

  const codeExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
  ];

  function getFiles(directory) {
    let files = [];

    const entries = fs.readdirSync(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        ["node_modules", ".git", "dist", "build"].includes(
          entry.name
        )
      ) {
        continue;
      }

      const fullPath = path.join(
        directory,
        entry.name
      );

      if (entry.isDirectory()) {
        files = files.concat(getFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  const files = getFiles(projectDir);

  symbols.forEach((symbol) => {
    consumers[symbol] = [];
  });

  for (const fullPath of files) {
    const extension = path.extname(fullPath);

    if (!codeExtensions.includes(extension)) {
      continue;
    }

    const relativeFile = normalizePath(
      path.relative(projectDir, fullPath)
    );

    // Don't report the changed file itself
    const normalizedCurrentFile =
      normalizePath(currentFile)
        .toLowerCase()
        .replace(/^.*?src\//, "src/");

    const normalizedRelativeFile =
      normalizePath(relativeFile)
        .toLowerCase()
        .replace(/^.*?src\//, "src/");

    if (
      normalizedRelativeFile ===
      normalizedCurrentFile
    ) {
      continue;
    }

    let content;

    try {
      content = fs.readFileSync(fullPath, "utf8");
    } catch {
      continue;
    }

    symbols.forEach((symbol) => {
      const symbolRegex = new RegExp(
        `\\b${escapeRegex(symbol)}\\b`,
        "m"
      );

      if (symbolRegex.test(content)) {
        consumers[symbol].push(relativeFile);
      }
    });
  }

  return consumers;
}


function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function normalizePath(file) {
  return file.replace(/\\/g, "/");
}


module.exports = {
  extractSymbols,
  detectChangeContext,
  analyseFileContext,
  findCssConsumers,
  findJsSymbolConsumers,
};