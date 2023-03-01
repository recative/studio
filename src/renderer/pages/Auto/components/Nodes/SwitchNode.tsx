import React from 'react';

import { NodeSwitchIconFilled } from 'components/Icons/NodeSwitchIconFilled';
import type { INodeProps } from 'pages/Auto/types/Node';

import { BaseNode } from './components/BaseNode';
import { ICustomHandlerProps } from './components/CustomHandler';

const INPUT_CONFIG: Omit<ICustomHandlerProps, 'position'>[] = [
  {
    id: 'input',
    type: 'target',
    label: 'Input',
  },
];

export const SwitchNode: React.FC<INodeProps> = React.memo(
  ({ id, isConnectable, data }) => {
    console.log('data: ', data);

    const outputs = React.useMemo<
      Omit<ICustomHandlerProps, 'position'>[]
    >(() => {
      if (typeof data !== 'object') return [];
      if (data === null) return [];

      const detail = Reflect.get(data, 'detail');

      if (!detail) return [];

      if (!Array.isArray(detail)) return [];

      return detail
        .filter((x) => x.id)
        .map((x) => ({
          id: x.id,
          type: 'source',
          label: x.id,
        }));
    }, [data]);

    return (
      <BaseNode
        id={id}
        Icon={NodeSwitchIconFilled}
        colorId={4}
        title="Switch"
        isConnectable={isConnectable}
        inputs={INPUT_CONFIG}
        outputs={outputs}
      />
    );
  }
);
