import * as React from 'react';

import { NodeInputFilled } from 'components/Icons/NodeInputFilled';

import { useEvent } from 'utils/hooks/useEvent';

import { BaseNode } from './Nodes/components/BaseNode';

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

export const Sidebar = React.memo(() => {
  return (
    <aside>
      <SideBarItem id="i" Icon={NodeInputFilled} title="Input" colorId={2} />
      <SideBarItem id="demo" Icon={NodeInputFilled} title="Demo" colorId={1} />
      <SideBarItem id="o" Icon={NodeInputFilled} title="Output" colorId={3} />
    </aside>
  );
});
