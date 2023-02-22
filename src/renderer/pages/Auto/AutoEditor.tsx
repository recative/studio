import * as React from 'react';

import ReactFlow, {
  addEdge,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
  MiniMap,
} from 'reactflow';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';

import { Sidebar } from './components/Sidebar';
import { DemoNode } from './components/Nodes/DemoNode';
import { InputNode } from './components/Nodes/InputNode';
import { OutputNode } from './components/Nodes/OutputNode';

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
    setEdges((eds) => addEdge(params, eds))
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
      data: { label: `${type} node` },
    };

    setNodes((nds) => nds.concat(newNode));
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
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
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
    </PivotLayout>
  );
});
