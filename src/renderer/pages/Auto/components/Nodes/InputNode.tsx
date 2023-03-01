import React from 'react';

import { NodeInputFilled } from 'components/Icons/NodeInputFilled';
import type { INodeProps } from 'pages/Auto/types/Node';

import { BaseNode } from './components/BaseNode';

export const InputNode: React.FC<INodeProps> = React.memo(
  ({ id, isConnectable }) => {
    return (
      <BaseNode
        id={id}
        Icon={NodeInputFilled}
        colorId={2}
        title="Input"
        isConnectable={isConnectable}
        inputs={[]}
        outputs={[
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
