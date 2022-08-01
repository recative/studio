import * as React from 'react';

import { StatefulTooltip } from 'baseui/tooltip';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import type { ButtonProps, ButtonOverrides } from 'baseui/button';

const SmallIconButtonContainerOverride: ButtonOverrides = {
  BaseButton: {
    style: {
      paddingTop: '4px',
      paddingRight: '4px',
      paddingLeft: '4px',
      paddingBottom: '4px',
    },
  },
};

export interface ISmallIconButtonProps extends ButtonProps {
  title: string;
}

export const SmallIconButton: React.FC<ISmallIconButtonProps> = ({
  title,
  ...props
}) => {
  return (
    <StatefulTooltip content={title} returnFocus>
      <Button
        overrides={SmallIconButtonContainerOverride}
        kind={BUTTON_KIND.tertiary}
        {...props}
      />
    </StatefulTooltip>
  );
};
