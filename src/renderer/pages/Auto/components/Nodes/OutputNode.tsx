import React from 'react';

import { NodeOutputIconFilled } from 'components/Icons/NodeOutputIconFilled';
import type { INodeProps } from 'pages/Auto/types/Node';

import { BaseNode } from './components/BaseNode';

export const OutputNode: React.FC<INodeProps> = React.memo(
  ({ id, isConnectable }) => {
    return (
      <BaseNode
        id={id}
        Icon={NodeOutputIconFilled}
        colorId={3}
        title="Output"
        isConnectable={isConnectable}
        inputs={[
          {
            id: 'in1',
            type: 'target',
            label: 'Handle1',
          },
        ]}
        outputs={[]}
      />
    );
  }
);
