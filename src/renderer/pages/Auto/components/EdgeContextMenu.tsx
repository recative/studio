import * as React from 'react';

import { useStyletron } from 'baseui';

import { StatefulContainerProps, StatefulMenu } from 'baseui/menu';

import type { Edge } from 'reactflow';

import {
  ContextMenu,
  useContextMenu,
} from 'components/ContextMenu/ContextMenu';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import {
  EDGE_EVENT_TARGET,
  SELECTED_EDGE_ATOM,
  EDGE_CONTEXT_MENU_ID,
} from './Edge';

const menuItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const useEdgeContextMenu = (nodes: Edge[]) => {
  const [css] = useStyletron();

  const formattedNodes = React.useMemo(
    () => Object.fromEntries(nodes.map((x) => [x.id, x])),
    [nodes]
  );

  const [triggers, hideContextMenu, selectedValue] = useContextMenu<
    string,
    { id: string } | null
  >(EDGE_CONTEXT_MENU_ID, formattedNodes, SELECTED_EDGE_ATOM);

  const handleItemClick = React.useCallback<
    StatefulContainerProps['onItemSelect']
  >(
    (event) => {
      hideContextMenu();
      EDGE_EVENT_TARGET.dispatchEvent(
        new CustomEvent(event.item.label.props.id, {
          detail: { id: selectedValue?.id },
        })
      );
    },
    [hideContextMenu, selectedValue]
  );

  const contextMenuItem = React.useMemo(() => {
    return [
      {
        label: (
          <RecativeBlock
            id="delete"
            className={css(menuItemStyles)}
            fontWeight={500}
          >
            <TrashIconOutline width={18} /> <span>Delete</span>
          </RecativeBlock>
        ),
      },
    ];
  }, [css]);

  return { triggers, contextMenuItem, handleItemClick };
};

interface IEdgeContextMenu {
  edges: Edge[];
}

export const EdgeContextMenu: React.FC<IEdgeContextMenu> = React.memo(
  ({ edges: nodes }) => {
    const { contextMenuItem, handleItemClick } = useEdgeContextMenu(nodes);

    return (
      <ContextMenu id={EDGE_CONTEXT_MENU_ID}>
        <StatefulMenu items={contextMenuItem} onItemSelect={handleItemClick} />
      </ContextMenu>
    );
  }
);
