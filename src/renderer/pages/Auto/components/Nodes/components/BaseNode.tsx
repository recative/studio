import React from 'react';

import { atom } from 'jotai';
import { nanoid } from 'nanoid';

import { useStyletron } from 'baseui';

import { Card } from 'baseui/card';
import { Position } from 'reactflow';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { useContextMenu } from 'components/ContextMenu/ContextMenu';

import { floatDownAnimationStyle } from 'styles/animation';

import { useEvent } from 'utils/hooks/useEvent';

import { NodeHeader } from './NodeHeader';
import { CustomHandler, ICustomHandlerProps } from './CustomHandler';

export interface IBaseNodeProps {
  id: string;
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

export const NODE_EVENT_TARGET = new EventTarget();
export const NODE_CONTEXT_MENU_ID = nanoid();
export const SELECTED_NODE_ATOM = atom<{ id: string } | null>(null);

const EMPTY_CONFIG: Omit<ICustomHandlerProps, 'position'>[] = [];

export const BaseNode = React.memo((props: IBaseNodeProps) => {
  const {
    id,
    colorId,
    title,
    titleOnly,
    Icon,
    isConnectable,
    inputs = EMPTY_CONFIG,
    outputs = EMPTY_CONFIG,
  } = props;

  const [css] = useStyletron();

  const formattedNodes = React.useMemo(() => ({ [id]: props }), [id, props]);

  const [triggers] = useContextMenu(
    NODE_CONTEXT_MENU_ID,
    formattedNodes,
    SELECTED_NODE_ATOM
  );

  const handleContextMenu = useEvent(
    (event: React.MouseEvent<any, MouseEvent>) => {
      triggers[id]?.(event);
    }
  );

  return (
    <RecativeBlock
      marginTop="4px"
      marginLeft="4px"
      marginBottom="4px"
      marginRight="4px"
      onContextMenu={titleOnly ? undefined : handleContextMenu}
    >
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
    </RecativeBlock>
  );
});
