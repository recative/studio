import * as React from 'react';

import { atom, useAtom } from 'jotai';
import type { WritableAtom } from 'jotai';
import { useToggleAtom } from './useToggleAtom';

export const useInternalModalManager = <FilledState, EmptyState>(
  openStateAtom: WritableAtom<boolean, React.SetStateAction<boolean>>,
  dataStateAtom: WritableAtom<
    FilledState | EmptyState,
    React.SetStateAction<FilledState | EmptyState>
  >,
  emptyData: EmptyState
) => {
  const [isOpen, open, close] = useToggleAtom(openStateAtom);

  const [data, setData] = useAtom(dataStateAtom);

  const openWithData = React.useCallback(
    (x: FilledState) => {
      setData(x);
      open();
    },
    [open, setData]
  );

  const closeWithData = React.useCallback(() => {
    setData(emptyData);
    close();
  }, [close, setData, emptyData]);

  return [isOpen, data, openWithData, closeWithData] as const;
};

export const ModalManager = <FilledData, EmptyData>(emptyData: EmptyData) => {
  const openAtom = atom(false);
  const dataAtom = atom<FilledData | EmptyData>(emptyData);

  const useModalManager = () =>
    useInternalModalManager<FilledData, EmptyData>(
      openAtom,
      dataAtom,
      emptyData
    );
  return useModalManager;
};
