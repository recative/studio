import * as React from 'react';

import { atom } from 'jotai';
import { nanoid } from 'nanoid';

import { EdgeProps, getBezierPath } from 'reactflow';

import { useContextMenu } from 'components/ContextMenu/ContextMenu';
import { useEvent } from 'utils/hooks/useEvent';

export const EDGE_EVENT_TARGET = new EventTarget();
export const EDGE_CONTEXT_MENU_ID = nanoid();
export const SELECTED_EDGE_ATOM = atom<{ id: string } | null>(null);

export const Edge: React.FC<EdgeProps<{ text?: string }>> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const formattedNodes = React.useMemo(() => ({ [id]: props }), [id, props]);

  const [triggers] = useContextMenu(
    EDGE_CONTEXT_MENU_ID,
    formattedNodes,
    SELECTED_EDGE_ATOM
  );

  const handleContextMenu = useEvent(
    (event: React.MouseEvent<any, MouseEvent>) => {
      triggers[id]?.(event);
    }
  );

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        onContextMenu={handleContextMenu}
      />
      <text>
        <textPath
          href={`#${id}`}
          style={{ fontSize: 12 }}
          startOffset="50%"
          textAnchor="middle"
        >
          {data?.text}
        </textPath>
      </text>
    </>
  );
};
