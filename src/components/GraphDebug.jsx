import { useRef } from "react";
import PathfindingState from "../models/PathfindingState";

/**
 * Prints a rough representation of the graph in the PathfindingState
 */
function GraphDebug() {
  const canvasRef = useRef();
  const state = new PathfindingState();

  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1000;
  const EDGE_WIDTH = 0.1;
  const NODE_RADIUS = 0.65;

  setTimeout(() => {
    drawGraph();
  }, 3500);

  function drawGraph() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boundingBox = getBoundingBox(state.graph.nodes);

    const lonMultiplier = CANVAS_WIDTH / (boundingBox.maxLon - boundingBox.minLon);
    const latMultiplier = CANVAS_HEIGHT / (boundingBox.maxLat - boundingBox.minLat);

    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = EDGE_WIDTH;
    for (const node of state.graph.nodes) {
      for (const edge of node.edges) {
        const otherNode = edge.getOtherNode(node);
        const x1 = (node.longitude - boundingBox.minLon) * lonMultiplier;
        const y1 = CANVAS_HEIGHT - (node.latitude - boundingBox.minLat) * latMultiplier;
        const x2 = (otherNode.longitude - boundingBox.minLon) * lonMultiplier;
        const y2 = CANVAS_HEIGHT - (otherNode.latitude - boundingBox.minLat) * latMultiplier;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "#fff";
    for (const node of state.graph.nodes) {
      const x = (node.longitude - boundingBox.minLon) * lonMultiplier;
      const y = CANVAS_HEIGHT - (node.latitude - boundingBox.minLat) * latMultiplier;
      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.closePath();
    }
  }

  function getBoundingBox(nodes) {
    const boundingBox = {
      minLat: Number.MAX_VALUE,
      maxLat: -Number.MAX_VALUE,
      minLon: Number.MAX_VALUE,
      maxLon: -Number.MAX_VALUE,
    };

    for (const node of nodes) {
      if (node.latitude < boundingBox.minLat) boundingBox.minLat = node.latitude;
      if (node.latitude > boundingBox.maxLat) boundingBox.maxLat = node.latitude;
      if (node.longitude < boundingBox.minLon) boundingBox.minLon = node.longitude;
      if (node.longitude > boundingBox.maxLon) boundingBox.maxLon = node.longitude;
    }

    return boundingBox;
  }

  return (
    <>
      <canvas width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={canvasRef} className="graph-debug"></canvas>
    </>
  );
}

export default GraphDebug;
