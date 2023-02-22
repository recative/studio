import * as React from 'react';

import { useStyletron } from 'baseui';

import { ParagraphXSmall } from 'baseui/typography';
import { Position, Handle, HandleProps } from 'reactflow';

import { COLOR_SCHEME } from 'components/Pattern/Pattern';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { useToggle } from 'utils/hooks/useToggle';

export interface IDemoNode<T = unknown> {
  data: T;
  isConnectable: boolean;
}

export interface ICustomHandlerProps {
  id: string;
  label: string;
  colorId?: number;
  position: Position;
  type: HandleProps['type'];
  onConnect?: HandleProps['onConnect'];
  isConnectable?: boolean;
}

const LABEL_EFFECT = {
  lineHeight: '1em',
  fontSize: '10px',
  fontWeight: 500,
  paddingTop: '6px',
};

export const CustomHandler: React.FC<ICustomHandlerProps> = React.memo(
  ({ position, id, label, type, colorId, onConnect, isConnectable }) => {
    const [css, theme] = useStyletron();
    const [isHovered, enter, leave] = useToggle(false);

    const handlerBaseStyles = React.useMemo(
      () =>
        ({
          width: '6px',
          height: '6px',
          backgroundColor: COLOR_SCHEME[colorId ?? -1]
            ? `#${
                COLOR_SCHEME[colorId ?? -1][position === Position.Left ? 2 : 3]
              }`
            : theme.colors.accent,
          border: 0,
          transition: `transform 300ms`,
          transform: isHovered ? `scale(2)` : `scale(1)`,
        } as const),
      [colorId, isHovered, position, theme.colors.accent]
    );

    return (
      <RecativeBlock
        display="flex"
        alignItems="center"
        position="relative"
        flexDirection={position === Position.Right ? 'row-reverse' : 'row'}
        left={position === Position.Left ? '0px' : 'initial'}
        right={position === Position.Right ? '0px' : 'initial'}
        marginRight={position === Position.Left ? '44px' : 'initial'}
        marginLeft={position === Position.Right ? '44px' : 'initial'}
        onMouseEnter={enter}
        onMouseLeave={leave}
      >
        <Handle
          id={id}
          type={type}
          position={position}
          style={handlerBaseStyles}
          onConnect={onConnect}
          isConnectable={isConnectable}
        />
        <RecativeBlock
          marginLeft={position === Position.Left ? '10px' : 'initial'}
          marginRight={position === Position.Right ? '10px' : 'initial'}
        >
          <ParagraphXSmall
            className={css(LABEL_EFFECT)}
            marginTop="0"
            marginBottom="0"
          >
            {label}
          </ParagraphXSmall>
        </RecativeBlock>
      </RecativeBlock>
    );
  }
);
