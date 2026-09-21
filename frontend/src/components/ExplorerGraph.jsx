import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";

import "@xyflow/react/dist/style.css";

const ROOT_WIDTH = 320;
const ROOT_HEIGHT = 80;
const FOLDER_WIDTH = 200;
const FOLDER_HEIGHT = 65;
const FILE_WIDTH = 180;
const FILE_HEIGHT = 60;

function ExplorerGraph({
  allFiles = [],
  result = {},
  dependencyMap = {},
  filter = "all",
  searchQuery = "",
  onNodeClick
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // 1. Determine which files to show based on filter
    let visibleFiles = allFiles;
    
    if (filter === "changed") {
      const changed = new Set([
        ...(result.added || []),
        ...(result.deleted || []),
        ...(result.modified || []).map(m => m.file)
      ]);
      visibleFiles = allFiles.filter(f => changed.has(f));
    } else if (filter === "dependencies") {
      const withDeps = new Set();
      Object.entries(dependencyMap).forEach(([source, deps]) => {
        if (Array.isArray(deps) && deps.length > 0) {
          withDeps.add(String(source).replace(/\\/g, "/"));
          deps.forEach(d => withDeps.add(String(d).replace(/\\/g, "/")));
        }
      });
      visibleFiles = allFiles.filter(f => withDeps.has(f));
    }

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // LR = left to right
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 220 });

    const newNodes = [];
    const newEdges = [];

    const structureNodes = new Set();
    const structuralEdgesSet = new Set();
    
    const normalize = (f) => String(f).replace(/\\/g, "/");

    // =======================================================
    // 1. ADD PROJECT ROOT
    // =======================================================
    const rootId = "root";
    structureNodes.add(rootId);
    newNodes.push({
      id: rootId,
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%" }}>
            <span style={{ fontSize: "16px" }}>📦</span>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>Project Root</span>
          </div>
        ),
        isStructure: true
      },
      style: {
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        background: "#f8fafc",
        border: `2px solid #94a3b8`,
        borderRadius: "8px",
        padding: "10px",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }
    });
    dagreGraph.setNode(rootId, { width: ROOT_WIDTH, height: ROOT_HEIGHT });

    // =======================================================
    // 2. ADD FOLDERS & FILES
    // =======================================================
    visibleFiles.forEach((file) => {
      const parts = normalize(file).split('/');
      let currentPath = rootId;

      // Add folder nodes
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        const nextPath = currentPath === rootId ? folderName : `${currentPath}/${folderName}`;
        
        if (!structureNodes.has(nextPath)) {
          structureNodes.add(nextPath);
          
          const isHighlighted = searchQuery && nextPath.toLowerCase().includes(searchQuery.toLowerCase());
          const isFaded = searchQuery && !isHighlighted;
          
          newNodes.push({
            id: nextPath,
            position: { x: 0, y: 0 },
            data: {
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", overflow: "hidden" }}>
                  <span style={{ fontSize: "16px" }}>📁</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={folderName}>
                    {folderName}
                  </span>
                </div>
              ),
              isStructure: true
            },
            style: {
              width: FOLDER_WIDTH,
              height: FOLDER_HEIGHT,
              background: "#ffffff",
              border: isHighlighted ? `2px solid #3b82f6` : `2px solid #cbd5e1`,
              borderRadius: "8px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              opacity: isFaded ? 0.4 : 1,
              boxShadow: isHighlighted ? "0 0 0 4px rgba(59, 130, 246, 0.3)" : "0 2px 4px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease-in-out"
            }
          });
          dagreGraph.setNode(nextPath, { width: FOLDER_WIDTH, height: FOLDER_HEIGHT });
        }

        const edgeId = `${currentPath}->${nextPath}`;
        if (!structuralEdgesSet.has(edgeId)) {
          structuralEdgesSet.add(edgeId);
          newEdges.push({
            id: edgeId,
            source: currentPath,
            target: nextPath,
            type: "step",
            style: { stroke: "#cbd5e1", strokeWidth: 2 }
          });
          dagreGraph.setEdge(currentPath, nextPath);
        }
        
        currentPath = nextPath;
      }

      // Add the file node itself
      const isModified = (result.modified || []).some(m => m.file === file);
      const isAdded = (result.added || []).includes(file);
      const isDeleted = (result.deleted || []).includes(file);
      
      let bg = "#f8fafc";
      let border = "#e2e8f0";
      let text = "#334155";
      let icon = "📄";
      
      if (isModified) { bg = "#fee2e2"; border = "#ef4444"; text = "#991b1b"; icon = "🔴"; }
      else if (isAdded) { bg = "#dcfce7"; border = "#22c55e"; text = "#166534"; icon = "🟢"; }
      else if (isDeleted) { bg = "#f1f5f9"; border = "#64748b"; text = "#475569"; icon = "⚫"; }
      
      const isHighlighted = searchQuery && file.toLowerCase().includes(searchQuery.toLowerCase());
      const isFaded = searchQuery && !isHighlighted;
      
      newNodes.push({
        id: file,
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", overflow: "hidden" }}>
              <span style={{ fontSize: "14px" }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={parts[parts.length - 1]}>
                {parts[parts.length - 1]}
              </span>
            </div>
          ),
          file: file
        },
        style: {
          width: FILE_WIDTH,
          height: FILE_HEIGHT,
          background: bg,
          border: isHighlighted ? `2px solid #3b82f6` : `2px solid ${border}`,
          borderRadius: "8px",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          opacity: isFaded ? 0.3 : 1,
          boxShadow: isHighlighted ? "0 0 0 4px rgba(59, 130, 246, 0.3)" : "0 2px 4px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease-in-out"
        }
      });
      dagreGraph.setNode(file, { width: FILE_WIDTH, height: FILE_HEIGHT });

      // Edge from parent folder to file
      const fileEdgeId = `${currentPath}->${file}`;
      if (!structuralEdgesSet.has(fileEdgeId)) {
        structuralEdgesSet.add(fileEdgeId);
        newEdges.push({
          id: fileEdgeId,
          source: currentPath,
          target: file,
          type: "step",
          style: { stroke: "#cbd5e1", strokeWidth: 2 }
        });
        dagreGraph.setEdge(currentPath, file);
      }
    });

    // =======================================================
    // 3. ADD DEPENDENCY EDGES
    // =======================================================
    Object.entries(dependencyMap).forEach(([source, deps]) => {
      const normSource = normalize(source);
      if (!visibleFiles.includes(normSource)) return;
      
      if (Array.isArray(deps)) {
        deps.forEach((target) => {
          const normTarget = normalize(target);
          if (!visibleFiles.includes(normTarget)) return;
          
          newEdges.push({
            id: `dep-${normSource}-${normTarget}`,
            source: normSource,
            target: normTarget,
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: "#3b82f6"
            },
            style: {
              stroke: "#3b82f6",
              strokeWidth: 2,
              opacity: 0.6
            }
          });
          
          // DO NOT add dependency edges to dagre layout computation!
          // We only want structural edges to determine layout, otherwise 
          // dependency edges create cycles and mess up the tree layout.
        });
      }
    });

    // Run dagre layout
    dagre.layout(dagreGraph);

    // Update node positions
    const layoutedNodes = newNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const height = node.style?.height || 50;
      node.position = {
        x: nodeWithPosition.x - (node.style.width / 2),
        y: nodeWithPosition.y - (height / 2),
      };
      return node;
    });

    setNodes(layoutedNodes);
    setEdges(newEdges);
    
  }, [allFiles, result, dependencyMap, filter, searchQuery, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(e, node) => {
        // Only trigger click events for actual files, ignore folders/root
        if (onNodeClick && !node.data.isStructure) {
          onNodeClick(node.data.file);
        }
      }}
      fitView
      fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
    >
      <Background gap={20} size={1} />
      <Controls />
      <MiniMap nodeStrokeWidth={3} />
    </ReactFlow>
  );
}

export default ExplorerGraph;
