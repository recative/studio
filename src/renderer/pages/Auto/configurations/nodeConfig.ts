import React from 'react';

import { DemoNode } from '../components/Nodes/DemoNode';
import { InputNode } from '../components/Nodes/InputNode';
import { OutputNode } from '../components/Nodes/OutputNode';
import { SwitchNode } from '../components/Nodes/SwitchNode';
import { SwitchEditor } from '../components/Editor/SwitchEditor';

import type { INodeProps } from '../types/Node';
import type { IEditorProps } from '../types/Editor';

export interface INodeConfig {
  colorId: number;
  Node: React.FC<INodeProps>;
  Editor: React.FC<IEditorProps> | null;
}

export const NODE_CONFIGURATIONS: Record<string, INodeConfig> = {
  demo: {
    colorId: 1,
    Node: DemoNode,
    Editor: null,
  },
  i: {
    colorId: 2,
    Node: InputNode,
    Editor: null,
  },
  o: {
    colorId: 3,
    Node: OutputNode,
    Editor: null,
  },
  switch: {
    colorId: 4,
    Node: SwitchNode,
    Editor: SwitchEditor,
  },
};
