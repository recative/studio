import * as React from 'react';

import { ToasterContainer, PLACEMENT } from 'baseui/toast';

import { StatIconOutline } from 'components/Icons/StatIconOutline';
import { ScriptletIconOutline } from 'components/Icons/ScriptletIconOutline';
import { ResourceFilesIconOutline } from 'components/Icons/ResourceFilesIconOutline';

import { IconSidePanel, ITabConfig } from 'components/Tabs/IconSidePanel';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ResourceTree } from './ResourceTree';
import { ScriptletTree } from './ScriptletTree';
import { AnalysisTree } from './AnalysisTree';

export interface ISidePanelProps {
  onRefreshResourceListRequest: () => void;
}

export const InternalSidePanel: React.FC<ISidePanelProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [selected, setSelected] = React.useState<number>(0);

  const tabsConfig = React.useMemo<ITabConfig[]>(
    () => [
      {
        id: 'resourceFile',
        title: 'Resource Files',
        Icon: ResourceFilesIconOutline,
        Content: ResourceTree,
      },
      {
        id: 'scriptlet',
        title: 'Scriptlets',
        Icon: ScriptletIconOutline,
        content: (
          <ScriptletTree
            onRefreshResourceListRequest={onRefreshResourceListRequest}
          />
        ),
      },
      {
        id: 'statistics',
        title: 'Statistics',
        Icon: StatIconOutline,
        Content: AnalysisTree,
      },
    ],
    [onRefreshResourceListRequest]
  );

  return (
    <>
      <ToasterContainer
        autoHideDuration={3000}
        placement={PLACEMENT.bottomRight}
      />
      <RecativeBlock width="300px">
        <IconSidePanel config={tabsConfig} />
      </RecativeBlock>
    </>
  );
};

export const SidePanel = React.memo(InternalSidePanel);
