import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import PipelineNode from "./PipelineNode";

const nodeTypes = {
  pipelineNode: PipelineNode,
};

const PipelineCanvas = ({ stages }) => {
  // Convert stages array into React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!stages || stages.length === 0) return { nodes: [], edges: [] };

    const generatedNodes = stages.map((stage, idx) => ({
      id: stage.name,
      type: "pipelineNode",
      position: { x: idx * 280, y: 120 },
      data: {
        name: stage.name,
        status: stage.status,
        duration: stage.duration,
        startedAt: stage.startedAt,
        completedAt: stage.completedAt,
        index: idx,
        totalStages: stages.length,
      },
    }));

    const generatedEdges = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const sourceStage = stages[i];
      const targetStage = stages[i + 1];

      let edgeStyle = { stroke: "#1e293b", strokeWidth: 2 };
      let animated = false;

      if (sourceStage.status === "success") {
        if (targetStage.status === "running") {
          edgeStyle = { stroke: "#a855f7", strokeWidth: 3, filter: "drop-shadow(0px 0px 5px rgba(168, 85, 247, 0.5))" };
          animated = true;
        } else if (targetStage.status === "success") {
          edgeStyle = { stroke: "#10b981", strokeWidth: 3 };
        } else if (targetStage.status === "failed") {
          edgeStyle = { stroke: "#f43f5e", strokeWidth: 3 };
        }
      }

      generatedEdges.push({
        id: `edge-${sourceStage.name}-${targetStage.name}`,
        source: sourceStage.name,
        target: targetStage.name,
        animated,
        style: edgeStyle,
      });
    }

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [stages]);

  return (
    <div className="relative w-full h-[400px] md:h-[450px] rounded-2xl border border-white/5 bg-[#050609] overflow-hidden shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
      >
        <Background color="#333" gap={16} size={1} />
        <Controls showInteractive={false} className="!bg-[#0e1017] !border-white/5 !text-gray-400 fill-gray-400 rounded-lg overflow-hidden [&>button]:!border-white/5" />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.status) {
              case "success": return "#10b981";
              case "failed": return "#f43f5e";
              case "running": return "#a855f7";
              default: return "#1e293b";
            }
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.6)"
          className="!bg-[#0e1017] !border-white/5 rounded-xl overflow-hidden shadow-xl"
        />
      </ReactFlow>
    </div>
  );
};

export default PipelineCanvas;
