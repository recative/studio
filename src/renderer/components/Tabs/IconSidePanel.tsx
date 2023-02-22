import * as React from 'react';

import { useStyletron } from 'baseui';

import { ButtonGroup, MODE } from 'baseui/button-group';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';
import {
  floatLeftAnimationStyle,
  floatRightAnimationStyle,
} from 'styles/animation';

const ICON_SIZE = 20;

const BUTTON_GROUP_OVERRIDES = {
  Root: {
    style: { flexDirection: 'column', width: 'fit-content', position: 'fixed' },
  },
};

export enum IconSidePanelPosition {
  Left = 'left',
  Right = 'right',
}

export interface ITabConfig {
  id: string;
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  Content?: React.FC;
  content?: React.ReactNode;
}

interface IconSidePanelProps {
  initialActiveKey?: number;
  position?: IconSidePanelPosition;
  config: ITabConfig[];
}

export const IconSidePanel: React.FC<IconSidePanelProps> = React.memo(
  ({ initialActiveKey = 0, position = IconSidePanelPosition.Left, config }) => {
    const [css] = useStyletron();
    const [selected, setSelected] = React.useState<number>(initialActiveKey);

    const handleButtonGroupClick = useEvent(
      (_: React.SyntheticEvent<HTMLButtonElement>, index: number) => {
        setSelected(index);
      }
    );

    const SelectedContent = config[selected].Content;

    return (
      <RecativeBlock
        display="flex"
        position="relative"
        flexDirection={
          position === IconSidePanelPosition.Left ? 'row' : 'row-reverse'
        }
        overflowX="hidden"
      >
        <RecativeBlock width="52px" position="relative" flexShrink={0}>
          <ButtonGroup
            mode={MODE.radio}
            kind={BUTTON_KIND.tertiary}
            selected={selected}
            overrides={BUTTON_GROUP_OVERRIDES}
            onClick={handleButtonGroupClick}
          >
            {config.map(({ id, title, Icon }) => (
              <Button key={id}>
                <Icon width={ICON_SIZE} aria-label={title} />
              </Button>
            ))}
          </ButtonGroup>
        </RecativeBlock>
        <RecativeBlock flexGrow={1}>
          <RecativeBlock
            key={selected}
            className={css(
              position === IconSidePanelPosition.Left
                ? floatLeftAnimationStyle
                : floatRightAnimationStyle
            )}
          >
            {SelectedContent ? <SelectedContent /> : config[selected].content}
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
    );
  }
);
