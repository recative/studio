import * as React from 'react';

import { useAtom } from 'jotai';

import { IconTabs } from 'components/Tabs/IconTabs';
import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { NodeInputFilled } from 'components/Icons/NodeInputFilled';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { NodeOutputIconFilled } from 'components/Icons/NodeOutputIconFilled';
import { NodeSwitchIconFilled } from 'components/Icons/NodeSwitchIconFilled';
import { NodeCategoryDebugIconOutline } from 'components/Icons/NodeCategoryDebugIconOutline';
import { NodeCategoryRoutineIconOutline } from 'components/Icons/NodeCategoryRoutineIconOutline';
import {
  IconSidePanel,
  IconSidePanelPosition,
} from 'components/Tabs/IconSidePanel';

import { useEvent } from 'utils/hooks/useEvent';

import { BaseNode } from './Nodes/components/BaseNode';
import { editingSidebarAtom } from './Sidebar/store/EditingSidebarStore';

import { NODE_CONFIGURATIONS } from '../configurations/nodeConfig';

interface ISidebarItem {
  id: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  colorId: number;
}

export const SideBarItem: React.FC<ISidebarItem> = React.memo(
  ({ id, Icon, title, colorId }) => {
    const onDragStart = useEvent((event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData('application/reactflow', id);
      event.dataTransfer.effectAllowed = 'move';
    });

    return (
      <div className="dndnode" onDragStart={onDragStart} draggable>
        <BaseNode
          id={id}
          Icon={Icon}
          title={title}
          colorId={colorId}
          titleOnly
          isConnectable={false}
        />
      </div>
    );
  }
);

const FlowSegment = () => {
  return (
    <RecativeBlock marginLeft="-12px" marginRight="-12px" marginTop="-8px">
      <SideBarItem id="i" Icon={NodeInputFilled} title="Input" colorId={2} />
      <SideBarItem
        id="o"
        Icon={NodeOutputIconFilled}
        title="Output"
        colorId={3}
      />
      <SideBarItem
        id="switch"
        Icon={NodeSwitchIconFilled}
        title="Switch"
        colorId={4}
      />
    </RecativeBlock>
  );
};

const DevelopmentSegment = () => {
  return (
    <RecativeBlock marginLeft="-12px" marginRight="-12px" marginTop="-8px">
      <SideBarItem id="demo" Icon={NodeInputFilled} title="Demo" colorId={1} />
    </RecativeBlock>
  );
};

const ICON_TABS_CONFIG = [
  {
    id: 'flow',
    title: 'Flow',
    Icon: NodeCategoryRoutineIconOutline,
    Content: FlowSegment,
  },
  {
    id: 'development',
    title: 'Development',
    Icon: NodeCategoryDebugIconOutline,
    Content: DevelopmentSegment,
  },
];

const ToolboxSection = React.memo(() => (
  <IconTabs config={ICON_TABS_CONFIG} initialActiveKey="flow" />
));

const DemoSection = React.memo(() => {
  const [sidebarConfig] = useAtom(editingSidebarAtom);

  if (sidebarConfig === null) {
    return (
      <EmptySpace
        title="Nothing to be configured"
        content="The selected node do not have any configurations to be edited"
      />
    );
  }

  if (sidebarConfig === undefined) {
    return (
      <EmptySpace
        title="No node selected"
        content="Please select a node to continue editing the node"
      />
    );
  }

  const nodeConfig = NODE_CONFIGURATIONS[sidebarConfig.type];

  if (!nodeConfig) {
    return (
      <EmptySpace
        title="Invalid node"
        content="The node type selected is not available in the configuration"
      />
    );
  }

  if (!nodeConfig.Editor) {
    return (
      <EmptySpace
        title="Not editable"
        content="The selected node is not editable"
      />
    );
  }

  return (
    <nodeConfig.Editor
      data={sidebarConfig.data}
      onChange={sidebarConfig.onDataUpdate}
    />
  );
});

const SIDE_PANEL_CONFIG = [
  {
    id: 'flow',
    title: 'Flow',
    Icon: NodeCategoryRoutineIconOutline,
    Content: ToolboxSection,
  },
  {
    id: 'edit',
    title: 'Edit',
    Icon: EditIconOutline,
    Content: DemoSection,
  },
];

export const Sidebar = React.memo(() => {
  return (
    <RecativeBlock
      width="320px"
      paddingLeft="8px"
      paddingTop="4px"
      overflow="auto"
    >
      <IconSidePanel
        config={SIDE_PANEL_CONFIG}
        position={IconSidePanelPosition.Right}
      />
    </RecativeBlock>
  );
});
