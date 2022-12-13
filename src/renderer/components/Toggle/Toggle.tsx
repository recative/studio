import * as React from 'react';

import { Checkbox, STYLE_TYPE } from 'baseui/checkbox';

import type { CheckboxProps, CheckboxOverrides } from 'baseui/checkbox';

export interface IToggleProps extends CheckboxProps {
  overrides?: never;
  checkmarkType?: never;
  children: React.ReactNode;
}

const ToggleOverrides: CheckboxOverrides = {
  Root: {
    style: {
      display: 'flex',
      alignItems: 'center',
    },
  },
  ToggleTrack: {
    style: {
      marginTop: '4px',
      marginLeft: '4px',
      width: '32px',
      height: '18px',
      paddingLeft: '4px',
      borderRadius: 0,
    },
  },
  Toggle: {
    style: ({ $checked }) => ({
      width: '12px',
      height: '12px',
      borderRadius: 0,
      transform: $checked ? 'translateX(17px)' : 'translateX(0)',
    }),
  },
};

export const Toggle: React.FC<IToggleProps> = ({
  overrides,
  checkmarkType,
  ...props
}) => {
  return (
    <Checkbox
      checkmarkType={STYLE_TYPE.toggle}
      overrides={ToggleOverrides}
      {...props}
    />
  );
};
