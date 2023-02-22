import * as React from 'react';

export const useToggle = (initial: boolean) => {
  const [value, setValue] = React.useState(initial);

  const toggle = React.useCallback(() => {
    setValue((v) => !v);
  }, [setValue]);

  const open = React.useCallback(() => {
    setValue(true);
  }, [setValue]);

  const close = React.useCallback(() => {
    setValue(false);
  }, [setValue]);

  return [value, open, close, toggle] as const;
};
