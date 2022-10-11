import * as React from 'react';

import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { ButtonGroup, MODE } from 'baseui/button-group';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ResourceFilesIconOutline } from 'components/Icons/ResourceFilesIconOutline';
import { ScriptletIconOutline } from 'components/Icons/ScriptletIconOutline';
import { StatIconOutline } from 'components/Icons/StatIconOutline';
import { ResourceTree } from './ResourceTree';
import { ScriptletTree } from './ScriptletTree';

const ICON_SIZE = 20;

export const InternalSidePanel = () => {
  const [selected, setSelected] = React.useState<number>(0);

  return (
    <RecativeBlock display="flex" position="relative">
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
        {selected === 1 && <ScriptletTree />}
      </RecativeBlock>
    </RecativeBlock>
  );
};

export const SidePanel = React.memo(InternalSidePanel);
