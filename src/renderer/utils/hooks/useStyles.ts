import React from 'react';
import type { DependencyList } from 'react';
import { useStyletron } from 'baseui';

import type { Theme } from 'baseui';
import type { StyleObject } from 'styletron-react';

export const useStyles = (
  styleCallback: (theme: Theme) => StyleObject,
  dependency: DependencyList
) => {
  const [css, theme] = useStyletron();

  return React.useMemo(
    () => css(styleCallback(theme)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [css, theme, dependency]
  );
};
