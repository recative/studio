import React from 'react';

import { NodeOutputIconFilled } from 'components/Icons/NodeOutputIconFilled';

import { BaseNode } from './components/BaseNode';

export interface IDemoNode<T = unknown> {
  data: T;
  isConnectable: boolean;
}

export const OutputNode: React.FC<IDemoNode<unknown>> = React.memo(
  ({ isConnectable }) => {
    return (
      <BaseNode
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
