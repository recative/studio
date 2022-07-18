import * as React from 'react';
import { merge } from 'lodash';

import { Button } from 'baseui/button';
import type { ButtonProps } from 'baseui/button';

import { IconButtonOverrides } from 'styles/Button';

export const IconButton: React.VFC<ButtonProps> = ({
  overrides,
  children,
  ...props
}) => {
  const finalOverrides = React.useMemo(
    () => merge({}, IconButtonOverrides, overrides),
    [overrides]
  );
  return (
    <Button overrides={finalOverrides} {...props}>
      {children}
    </Button>
  );
};
