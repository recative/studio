import React from 'react';

import { NodeEditSettingsIconFilled } from 'components/Icons/NodeEditSettingsIconFilled';
import type { INodeProps } from 'pages/Auto/types/Node';

import { BaseNode } from './components/BaseNode';

export const DemoNode: React.FC<INodeProps> = React.memo(
  ({ id, isConnectable }) => {
    return (
      <BaseNode
        id={id}
        Icon={NodeEditSettingsIconFilled}
        colorId={1}
        title="Demo"
        isConnectable={isConnectable}
        inputs={[
          {
            id: 'in1',
            type: 'target',
            label: 'Handle1',
          },
        ]}
        outputs={[
          {
            type: 'source',
            label: 'HandleA',
            id: 'c',
          },
          {
            type: 'source',
            label: 'HandleB',
            id: 'b',
          },
        ]}
      />
    );
  }
);
