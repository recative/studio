import * as React from 'react';

import { ButtonGroup, MODE } from 'baseui/button-group';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { ToasterContainer, PLACEMENT } from 'baseui/toast';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { StatIconOutline } from 'components/Icons/StatIconOutline';
import { ScriptletIconOutline } from 'components/Icons/ScriptletIconOutline';
import { ResourceFilesIconOutline } from 'components/Icons/ResourceFilesIconOutline';

import { ResourceTree } from './ResourceTree';
import { ScriptletTree } from './ScriptletTree';

const ICON_SIZE = 20;

export interface ISidePanelProps {
  onRefreshResourceListRequest: () => void;
}

export const InternalSidePanel: React.FC<ISidePanelProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [selected, setSelected] = React.useState<number>(0);

  return (
    <RecativeBlock display="flex" position="relative">
      <ToasterContainer
        autoHideDuration={3000}
        placement={PLACEMENT.bottomRight}
      />
      <RecativeBlock position="fixed">
        <ButtonGroup
          mode={MODE.radio}
          kind={BUTTON_KIND.tertiary}
          selected={selected}
          overrides={{
            Root: { style: { flexDirection: 'column', width: 'fit-content' } },
          }}
          onClick={(_event, index) => {
            setSelected(index);
          }}
        >
          <Button>
            <ResourceFilesIconOutline
              width={ICON_SIZE}
              aria-label="Resource Files"
            />
          </Button>
          <Button>
            <ScriptletIconOutline width={ICON_SIZE} aria-label="Scriptlets" />
          </Button>
          <Button>
            <StatIconOutline width={ICON_SIZE} aria-label="Statistics" />
          </Button>
        </ButtonGroup>
      </RecativeBlock>
      <RecativeBlock width="240px" marginLeft="52px">
        {selected === 0 && <ResourceTree />}
        {selected === 1 && (
          <ScriptletTree
            onRefreshResourceListRequest={onRefreshResourceListRequest}
          />
        )}
      </RecativeBlock>
    </RecativeBlock>
  );
};

export const SidePanel = React.memo(InternalSidePanel);
