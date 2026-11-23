'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function GraphView({ graph }: { graph: any }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cy = cytoscape({
      container: ref.current,
      elements: {
        nodes: (graph.nodes ?? []).map((node: any) => ({ data: node })),
        edges: (graph.edges ?? []).map((edge: any) => ({ data: { id: edge.id, source: edge.source, target: edge.target, label: edge.relationType } })),
      },
      layout: { name: 'concentric', fit: true, animate: true },
      style: [
        { selector: 'node', style: { label: 'data(label)', 'background-color': '#059669', color: '#0f172a', 'text-valign': 'bottom', 'text-margin-y': 6, 'font-size': 10 } },
        { selector: 'edge', style: { label: 'data(label)', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#94a3b8', 'line-color': '#94a3b8', 'font-size': 8, 'text-rotation': 'autorotate' } },
      ],
    });
    return () => cy.destroy();
  }, [graph]);

  return <div ref={ref} className="h-[520px] w-full rounded-2xl border border-slate-200 bg-white" />;
}
