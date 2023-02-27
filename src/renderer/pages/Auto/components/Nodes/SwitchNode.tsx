import React from 'react';

import { NodeSwitchIconFilled } from 'components/Icons/NodeSwitchIconFilled';

import { BaseNode } from './components/BaseNode';

export interface ISwitchNode<T = unknown> {
  data: T;
  id: string;
  isConnectable: boolean;
}

export const SwitchNode: React.FC<ISwitchNode<unknown>> = React.memo(
  ({ id, isConnectable }) => {
    return (
      <BaseNode
        id={id}
        Icon={NodeSwitchIconFilled}
        colorId={4}
        title="Switch"
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
