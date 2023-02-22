import React from 'react';

import { useStyletron } from 'baseui';

import { Card } from 'baseui/card';
import { Position } from 'reactflow';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { floatDownAnimationStyle } from 'styles/animation';

import { NodeHeader } from './NodeHeader';
import { CustomHandler, ICustomHandlerProps } from './CustomHandler';

export interface IBaseNodeProps {
  title: string;
  colorId: number;
  isConnectable?: boolean;
  titleOnly?: boolean;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  inputs?: Omit<ICustomHandlerProps, 'position'>[];
  outputs?: Omit<ICustomHandlerProps, 'position'>[];
}

const CARD_OVERRIDES = {
  Root: {
    style: {
      overflow: 'visible',
    },
  },
};

const EMPTY_CONFIG: Omit<ICustomHandlerProps, 'position'>[] = [];

export const BaseNode = React.memo(
  ({
    colorId,
    title,
    titleOnly,
    Icon,
    isConnectable,
    inputs = EMPTY_CONFIG,
    outputs = EMPTY_CONFIG,
  }: IBaseNodeProps) => {
    const [css] = useStyletron();

    return (
      <Card overrides={CARD_OVERRIDES}>
        <RecativeBlock marginBottom={titleOnly ? '-16px' : '0'}>
          <NodeHeader Icon={Icon} colorId={colorId} title={title} />
        </RecativeBlock>
        {!titleOnly && (
          <RecativeBlock
            className={css(floatDownAnimationStyle)}
            position="relative"
            minHeight="24px"
            minWidth="100%"
            marginLeft="-16px"
            marginRight="-16px"
            marginBottom="-10px"
            paddingTop="4px"
            paddingBottom="4px"
            overflow="visible"
          >
            {inputs.map((x) => (
              <CustomHandler
                key={x.id}
                position={Position.Left}
                {...x}
                colorId={colorId}
                isConnectable={isConnectable ?? x.isConnectable}
              />
            ))}

            {outputs.map((x) => (
              <CustomHandler
                key={x.id}
                position={Position.Right}
                colorId={colorId}
                {...x}
                isConnectable={isConnectable ?? x.isConnectable}
              />
            ))}
          </RecativeBlock>
        )}
      </Card>
    );
  }
);
