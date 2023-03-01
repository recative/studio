import * as React from 'react';

import { useStyletron } from 'baseui';

import { StatefulContainerProps, StatefulMenu } from 'baseui/menu';

import type { Node } from 'reactflow';

import {
  ContextMenu,
  useContextMenu,
} from 'components/ContextMenu/ContextMenu';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { CopyIconOutline } from 'components/Icons/CopyIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import {
  NODE_CONTEXT_MENU_ID,
  NODE_EVENT_TARGET,
  SELECTED_NODE_ATOM,
} from './Nodes/components/BaseNode';

const menuItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const useNodeContextMenu = (nodes: Node[]) => {
  const [css] = useStyletron();

  const formattedNodes = React.useMemo(
    () => Object.fromEntries(nodes.map((x) => [x.id, x])),
    [nodes]
  );

  const [triggers, hideContextMenu, selectedValue] = useContextMenu<
    string,
    { id: string } | null
  >(NODE_CONTEXT_MENU_ID, formattedNodes, SELECTED_NODE_ATOM);

  const handleItemClick = React.useCallback<
    StatefulContainerProps['onItemSelect']
  >(
    (event) => {
      hideContextMenu();
      NODE_EVENT_TARGET.dispatchEvent(
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
      {
        label: (
          <RecativeBlock
            id="clone"
            className={css(menuItemStyles)}
            fontWeight={500}
          >
            <CopyIconOutline width={18} /> <span>Clone</span>
          </RecativeBlock>
        ),
      },
      {
        label: (
          <RecativeBlock
            id="edit"
            className={css(menuItemStyles)}
            fontWeight={500}
          >
            <EditIconOutline width={18} /> <span>Edit</span>
          </RecativeBlock>
        ),
      },
    ];
  }, [css]);

  return { triggers, contextMenuItem, handleItemClick };
};

interface INodeContextMenu {
  nodes: Node[];
}

export const NodeContextMenu: React.FC<INodeContextMenu> = React.memo(
  ({ nodes }) => {
    const { contextMenuItem, handleItemClick } = useNodeContextMenu(nodes);

    return (
      <ContextMenu id={NODE_CONTEXT_MENU_ID}>
        <StatefulMenu items={contextMenuItem} onItemSelect={handleItemClick} />
      </ContextMenu>
    );
  }
);
