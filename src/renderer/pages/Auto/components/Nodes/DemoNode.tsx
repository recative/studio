import React from 'react';

import { NodeEditSettingsIconFilled } from 'components/Icons/NodeEditSettingsIconFilled';

import { BaseNode } from './components/BaseNode';

export interface IDemoNode<T = unknown> {
  data: T;
  isConnectable: boolean;
}

export const DemoNode: React.FC<IDemoNode<unknown>> = React.memo(
  ({ isConnectable }) => {
    return (
      <BaseNode
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
