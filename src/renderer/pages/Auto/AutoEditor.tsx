import * as React from 'react';

import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import { useAtom } from 'jotai';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';

import { Sidebar } from './components/Sidebar';
import { DemoNode } from './components/Nodes/DemoNode';
import { InputNode } from './components/Nodes/InputNode';
import { SwitchNode } from './components/Nodes/SwitchNode';
import { OutputNode } from './components/Nodes/OutputNode';
import { NodeContextMenu } from './components/NodeContextMenu';
import { EdgeContextMenu } from './components/EdgeContextMenu';
import { NODE_EVENT_TARGET } from './components/Nodes/components/BaseNode';
import { editingSidebarAtom } from './components/Sidebar/store/EditingSidebarStore';
import { Edge, EDGE_EVENT_TARGET } from './components/Edge';

import './styles/ReactFlow.global.css';

const INITIAL_NODES = [
  {
    id: '1',
    type: 'i',
    data: { label: 'input node' },
    position: { x: 250, y: 5 },
  },
];

const NODE_TYPES = {
  demo: DemoNode,
  i: InputNode,
  o: OutputNode,
  switch: SwitchNode,
};

const EDGE_TYPES = {
  custom: Edge,
};

let id = 0;
const getId = () => {
  id += 1;

  return `dndnode_${id}`;
};

export const AutoEditor: React.FC = React.memo(() => {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance<any, any> | null>(null);

  const onConnect = useEvent((params) =>
    setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds))
  );

  const onDragOver = useEvent((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });

  const onDrop = useEvent((event) => {
    event.preventDefault();

    if (!reactFlowWrapper.current) return;
    if (!reactFlowInstance) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

    const type = event.dataTransfer.getData('application/reactflow');

    // check if the dropped element is valid
    if (typeof type === 'undefined' || !type) {
      return;
    }

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode = {
      id: getId(),
      type,
      position,
      data: { label: `${type} node`, detail: null },
    };

    setNodes((nds) => nds.concat(newNode));
  });

  const [, setEditingSidebarAtom] = useAtom(editingSidebarAtom);

  const handleNodeChange = useEvent((detail: unknown, nodeIndex: number) => {
    setNodes((nds) => {
      const node = nds[nodeIndex];
      if (!node.type) return nds;

      if (typeof detail !== 'object') return nds;
      if (detail === null) return nds;

      const nextNodes = [...nds];
      nextNodes[nodeIndex] = {
        ...node,
        data: {
          ...node.data,
          // @ts-ignore
          detail,
        },
      };

      setEditingSidebarAtom((sidebarData) =>
        sidebarData
          ? {
              ...sidebarData,
              data: detail,
            }
          : sidebarData
      );

      return nextNodes;
    });
  });

  const handleEditNode = useEvent((event: CustomEvent) => {
    const nodeId = event.detail.id;
    if (!nodeId) return;
    if (typeof nodeId !== 'string') return;

    const nodeIndex = nodes.findIndex((x) => x.id === nodeId);

    if (nodeIndex < 0) return;

    const nodeData = Reflect.get(nodes[nodeIndex], 'detail');

    setEditingSidebarAtom({
      type: nodes[nodeIndex].type ?? '',
      data: nodeData,
      onDataUpdate: (detail: unknown) => handleNodeChange(detail, nodeIndex),
    });
  }) as EventListener;

  const handleDeleteNode = useEvent((event: CustomEvent) => {
    const nodeId = event.detail.id;
    if (!nodeId) return;
    if (typeof nodeId !== 'string') return;

    setNodes((x) => x.filter((a) => a.id !== nodeId));
    setEdges((x) =>
      x.filter((a) => a.source !== nodeId && a.target !== nodeId)
    );
  }) as EventListener;

  const handleDeleteEdge = useEvent((event: CustomEvent) => {
    const edgeId = event.detail.id;
    if (!edgeId) return;
    if (typeof edgeId !== 'string') return;

    setEdges((x) => x.filter((a) => a.id !== edgeId));
  }) as EventListener;

  React.useEffect(() => {
    NODE_EVENT_TARGET.addEventListener('delete', handleDeleteNode);

    return () =>
      NODE_EVENT_TARGET.removeEventListener('delete', handleDeleteNode);
  });

  React.useEffect(() => {
    NODE_EVENT_TARGET.addEventListener('edit', handleEditNode);

    return () => NODE_EVENT_TARGET.removeEventListener('edit', handleEditNode);
  });

  React.useEffect(() => {
    EDGE_EVENT_TARGET.addEventListener('delete', handleDeleteEdge);

    return () =>
      EDGE_EVENT_TARGET.removeEventListener('delete', handleDeleteEdge);
  });

  return (
    <PivotLayout>
      <RecativeBlock className="dndflow">
        <ReactFlowProvider>
          <RecativeBlock height="calc(100vh - 116px)" display="flex">
            <RecativeBlock
              ref={reactFlowWrapper}
              height="-webkit-fill-available"
              className="reactflow-wrapper"
              flexGrow={1}
            >
              <ReactFlow
                fitView
                connectionRadius={40}
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                onDrop={onDrop}
                onConnect={onConnect}
                onDragOver={onDragOver}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={setReactFlowInstance}
              >
                <Controls />

                <MiniMap zoomable pannable />
              </ReactFlow>
            </RecativeBlock>
            <RecativeBlock flexShrink={1}>
              <Sidebar />
            </RecativeBlock>
          </RecativeBlock>
        </ReactFlowProvider>
      </RecativeBlock>
      <NodeContextMenu nodes={nodes} />
      <EdgeContextMenu edges={edges} />
    </PivotLayout>
  );
});
