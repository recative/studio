import * as React from 'react';

import { useStyletron } from 'baseui';

import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';
import { StatefulTooltip, PLACEMENT } from 'baseui/tooltip';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';

export interface IIdProps {
  id: string;
  shrink?: number;
}

export const Id: React.FC<IIdProps> = ({ id, shrink }) => {
  const [, theme] = useStyletron();

  const handleButtonClick = useEvent(() => {
    return globalThis.navigator.clipboard.writeText(id);
  });

  return (
    <StatefulTooltip
      content={
        <RecativeBlock>
          <RecativeBlock>
            <strong>{id}</strong>
          </RecativeBlock>
          <RecativeBlock marginTop="2px" fontSize="0.85em">
            Click to copy
          </RecativeBlock>
        </RecativeBlock>
      }
      placement={PLACEMENT.bottomRight}
      returnFocus
    >
      <Button
        kind={BUTTON_KIND.tertiary}
        size={BUTTON_SIZE.mini}
        onClick={handleButtonClick}
      >
        <RecativeBlock
          fontFamily={theme.typography.MonoDisplayMedium.fontFamily}
          fontWeight={500}
          opacity={0.25}
        >
          {(shrink ?? 0) > 0 ? id.slice(0, shrink) : id}
        </RecativeBlock>
      </Button>
    </StatefulTooltip>
  );
};
