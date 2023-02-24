import * as React from 'react';

import { useStyletron } from 'baseui';

import { StatefulContainerProps, StatefulMenu } from 'baseui/menu';

import type { Node } from 'reactflow';

import {
  ContextMenu,
  useContextMenu,
} from 'components/ContextMenu/ContextMenu';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import { CONTEXT_MENU_ID } from './Nodes/components/BaseNode';

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
  const [triggers, hideContextMenu, selectedValue] = useContextMenu(
    CONTEXT_MENU_ID,
    formattedNodes
  );

  const handleItemClick = React.useCallback<
    StatefulContainerProps['onItemSelect']
  >(
    (event) => {
      hideContextMenu();
      switch (event.item.label.props.id) {
        case 'delete':
          console.log('delete');
          break;
        case 'replace':
          console.log('replace');
          break;
        default:
      }
    },
    [hideContextMenu]
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
            <TrashIconOutline width={18} /> <span>Replace</span>
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
      <ContextMenu id={CONTEXT_MENU_ID}>
        <StatefulMenu items={contextMenuItem} onItemSelect={handleItemClick} />
      </ContextMenu>
    );
  }
);
