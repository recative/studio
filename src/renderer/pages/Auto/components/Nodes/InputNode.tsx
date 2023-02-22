import React from 'react';

import { NodeInputFilled } from 'components/Icons/NodeInputFilled';

import { BaseNode } from './components/BaseNode';

export interface IDemoNode<T = unknown> {
  data: T;
  isConnectable: boolean;
}

export const InputNode: React.FC<IDemoNode<unknown>> = React.memo(
  ({ isConnectable }) => {
    return (
      <BaseNode
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
