import * as React from 'react';

import { StatefulTooltip, PLACEMENT } from 'baseui/tooltip';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import type { ButtonProps, ButtonOverrides } from 'baseui/button';

const smallIconButtonContainerOverride: ButtonOverrides = {
  BaseButton: {
    style: {
      paddingTop: '12px',
      paddingRight: '12px',
      paddingLeft: '12px',
      paddingBottom: '12px',
    },
  },
};

export interface ISmallIconButtonProps extends ButtonProps {
  title: string;
  children: React.ReactNode;
}

export const SmallIconButton: React.FC<ISmallIconButtonProps> = ({
  title,
  ...props
}) => {
  return (
    <StatefulTooltip
      content={title}
      placement={PLACEMENT.bottomRight}
      returnFocus
    >
      <Button
        overrides={smallIconButtonContainerOverride}
        kind={BUTTON_KIND.tertiary}
        {...props}
      />
    </StatefulTooltip>
  );
};
