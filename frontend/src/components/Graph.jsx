import { useMemo } from "react";
import dagre from "@dagrejs/dagre";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 82;

const X_GAP = 100;
const Y_GAP = 140;

function Graph({
  dependencyMap = {},
  impactMap = {},
  modifiedFiles = [],
}) {
  const { nodes, edges } = useMemo(() => {
    const normalize = (file) =>
      String(file).replace(/\\/g, "/");

    // =====================================================
    // NORMALIZE MODIFIED FILES
    // =====================================================

    const modifiedSet = new Set(
      modifiedFiles.map(normalize)
    );

    // =====================================================
    // BUILD REVERSE DEPENDENCY MAP
    //
    // dependencyMap:
    //
    // App.jsx -> [utils.js]
    //
    // becomes:
    //
    // utils.js -> [App.jsx]
    // =====================================================

    const reverseMap = {};

    Object.entries(dependencyMap).forEach(
      ([file, dependencies]) => {
        const source = normalize(file);

        if (!Array.isArray(dependencies)) {
          return;
        }

        dependencies.forEach((dependency) => {
          const dependencyFile =
            normalize(dependency);

          if (!reverseMap[dependencyFile]) {
            reverseMap[dependencyFile] = [];
          }

          if (
            !reverseMap[dependencyFile].includes(
              source
            )
          ) {
            reverseMap[dependencyFile].push(
              source
            );
          }
        });
      }
    );

    // =====================================================
    // CALCULATE IMPACT LEVELS
    //
    // 0 = Modified
    // 1 = Direct Impact
    // 2+ = Indirect Impact
    // =====================================================

    const impactLevel = {};

    modifiedSet.forEach((modifiedFile) => {
      impactLevel[modifiedFile] = 0;

      const queue = [
        {
          file: modifiedFile,
          level: 0,
        },
      ];

      const visited = new Set([
        modifiedFile,
      ]);

      while (queue.length > 0) {
        const current = queue.shift();

        const affectedFiles =
          reverseMap[current.file] || [];

        affectedFiles.forEach((affectedFile) => {
          if (visited.has(affectedFile)) {
            return;
          }

          visited.add(affectedFile);

          const nextLevel =
            current.level + 1;

          if (
            impactLevel[affectedFile] ===
              undefined ||
            nextLevel <
              impactLevel[affectedFile]
          ) {
            impactLevel[affectedFile] =
              nextLevel;
          }

          queue.push({
            file: affectedFile,
            level: nextLevel,
          });
        });
      }
    });

    // =====================================================
    // ALL PROJECT FILES
    // =====================================================

    const allFiles = new Set();

    Object.entries(dependencyMap).forEach(
      ([file, dependencies]) => {
        allFiles.add(normalize(file));

        if (Array.isArray(dependencies)) {
          dependencies.forEach((dependency) => {
            allFiles.add(
              normalize(dependency)
            );
          });
        }
      }
    );

    Object.entries(impactMap).forEach(
      ([file, affectedFiles]) => {
        allFiles.add(normalize(file));

        if (Array.isArray(affectedFiles)) {
          affectedFiles.forEach(
            (affectedFile) => {
              allFiles.add(
                normalize(affectedFile)
              );
            }
          );
        }
      }
    );

    modifiedSet.forEach((file) => {
      allFiles.add(file);
    });

    // =====================================================
    // STATUS
    // =====================================================

    const getStatus = (file) => {
      if (modifiedSet.has(file)) {
        return "modified";
      }

      if (impactLevel[file] === 1) {
        return "direct";
      }

      if (
        impactLevel[file] !== undefined &&
        impactLevel[file] >= 2
      ) {
        return "indirect";
      }

      return "safe";
    };

    // =====================================================
    // COLORS
    // =====================================================

    const statusStyles = {
      modified: {
        title: "MODIFIED",
        icon: "🔴",
        background: "#fee2e2",
        border: "#ef4444",
        text: "#991b1b",
      },

      direct: {
        title: "DIRECT IMPACT",
        icon: "🟠",
        background: "#fff7ed",
        border: "#f97316",
        text: "#9a3412",
      },

      indirect: {
        title: "INDIRECT IMPACT",
        icon: "🟡",
        background: "#fefce8",
        border: "#eab308",
        text: "#854d0e",
      },

      safe: {
        title: "SAFE / UNAFFECTED",
        icon: "🟢",
        background: "#f0fdf4",
        border: "#22c55e",
        text: "#166534",
      },
    };

    // =====================================================
    // IMPACT LEVEL GROUPING
    // =====================================================

    const levels = {};

    Object.entries(impactLevel).forEach(
      ([file, level]) => {
        if (!levels[level]) {
          levels[level] = [];
        }

        levels[level].push(file);
      }
    );

    Object.keys(levels).forEach((level) => {
      levels[level].sort();
    });

    // =====================================================
    // EDGES
    // =====================================================

    const edges = [];
    const seenEdges = new Set();

    Object.entries(reverseMap).forEach(
      ([source, affectedFiles]) => {
        if (impactLevel[source] === undefined) return;
        affectedFiles.forEach((target) => {
          if (impactLevel[target] === undefined) return;
          if (source === target) return; // No self-loops

          const edgeId = `${source}->${target}`;
          if (seenEdges.has(edgeId)) return;
          seenEdges.add(edgeId);

          const sourceLevel = impactLevel[source];

          edges.push({
            id: `affects-${source}-${target}`,
            source: `impact-${source}`,
            target: `impact-${target}`,
            type: "bezier",
            zIndex: -1,
            label: "affects",
            labelStyle: { fontSize: 11, fontWeight: 700, fill: "#374151" },
            labelBgStyle: { fill: "#ffffff", fillOpacity: 1 },
            labelBgPadding: [7, 4],
            labelBgBorderRadius: 5,
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
            style: {
              stroke: sourceLevel === 0 ? "#ef4444" : sourceLevel === 1 ? "#f97316" : "#eab308",
              strokeWidth: 2,
            },
          });
        });
      }
    );

    // =====================================================
    // NODES & DAGRE LAYOUT
    // =====================================================

    const nodes = [];
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "TB", nodesep: X_GAP, ranksep: Y_GAP });

    const impactLevels = Object.keys(levels).map(Number).sort((a, b) => a - b);

    impactLevels.forEach((level) => {
      const files = levels[level];
      files.forEach((file) => {
        const status = getStatus(file);
        const style = statusStyles[status];

        const node = {
          id: `impact-${file}`,
          sourcePosition: "bottom",
          targetPosition: "top",
          position: { x: 0, y: 0 },
          data: {
            label: (
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: "11px", fontWeight: "800", color: style.text, marginBottom: "7px" }}>
                  {style.icon} {style.title}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827", lineHeight: "1.4", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  {file}
                </div>
              </div>
            ),
          },
          style: {
            width: NODE_WIDTH,
            minHeight: NODE_HEIGHT,
            padding: "12px 15px",
            background: style.background,
            border: `2px solid ${style.border}`,
            borderRadius: "12px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        };

        nodes.push(node);
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    let maxImpactY = 0;

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      };
      if (node.position.y > maxImpactY) {
        maxImpactY = node.position.y;
      }
    });

    // =====================================================
    // SAFE FILES
    // =====================================================

    const safeFiles = Array.from(allFiles).filter((file) => getStatus(file) === "safe").sort();
    
    // Offset safe nodes below the impact graph
    const safeStartY = maxImpactY > 0 ? maxImpactY + NODE_HEIGHT + Y_GAP + 80 : 70;
    const safeColumns = 4;
    const totalSafeWidth = safeColumns * NODE_WIDTH + (safeColumns - 1) * X_GAP;
    const safeStartX = Math.max(100, (1400 - totalSafeWidth) / 2);

    safeFiles.forEach((file, index) => {
      const column = index % safeColumns;
      const row = Math.floor(index / safeColumns);

      nodes.push({
        id: `safe-${file}`,
        position: {
          x: safeStartX + column * (NODE_WIDTH + X_GAP),
          y: safeStartY + row * 110,
        },
        data: {
          label: (
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: "#166534", marginBottom: "6px" }}>
                🟢 SAFE / UNAFFECTED
              </div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#111827", wordBreak: "break-word" }}>
                {file}
              </div>
            </div>
          ),
        },
        style: {
          width: NODE_WIDTH,
          minHeight: 70,
          padding: "10px 14px",
          background: "#f0fdf4",
          border: "2px solid #22c55e",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      });
    });

    return {
      nodes,
      edges,
    };
  }, [
    dependencyMap,
    impactMap,
    modifiedFiles,
  ]);

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (nodes.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          background: "#ffffff",
          borderRadius: "12px",
        }}
      >
        <h3>
          Project Change Impact
        </h3>

        <p>
          No project relationships
          found.
        </p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {/* =================================================
          TOP DESCRIPTION
          ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",

          padding: "16px 20px",

          marginBottom: "15px",

          background: "#ffffff",

          border:
            "1px solid #e5e7eb",

          borderRadius: "12px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
            }}
          >
            🔍 Project Change Impact
          </h3>

          <p
            style={{
              margin:
                "5px 0 0 0",

              fontSize: "12px",

              color: "#64748b",
            }}
          >
            Modified → Direct Impact
            → Indirect Impact
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            fontSize: "12px",
          }}
        >
          <span>
            🔴 Modified
          </span>

          <span>
            🟠 Direct
          </span>

          <span>
            🟡 Indirect
          </span>

          <span>
            🟢 Safe
          </span>
        </div>
      </div>

      {/* =================================================
          FLOWCHART
          ================================================= */}

      <div
        style={{
          width: "100%",

          height: "800px",

          background:
            "#f8fafc",

          border:
            "1px solid #e2e8f0",

          borderRadius: "12px",

          overflow: "hidden",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}

          fitView

          fitViewOptions={{
            padding: 0.12,
            includeHiddenNodes: false,
          }}

          minZoom={0.25}
          maxZoom={1.5}

          nodesDraggable={true}

          nodesConnectable={false}

          elementsSelectable={true}

          zoomOnScroll={true}

          panOnDrag={true}
        >
          <Background
            gap={20}
            size={1}
          />

          <Controls />

          <MiniMap
            nodeStrokeWidth={3}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default Graph;