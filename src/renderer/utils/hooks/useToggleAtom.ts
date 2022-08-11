import * as React from 'react';
import { useAtom } from 'jotai';

import type { WritableAtom } from 'jotai';

export const useToggleAtom = (
  atom: WritableAtom<boolean, React.SetStateAction<boolean>>
) => {
  const [value, setValue] = useAtom(atom);

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
