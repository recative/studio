import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

import { atom, useAtom } from 'jotai';
import type { WritableAtom } from 'jotai';
import { OpenPromise } from '@recative/open-promise';
import { useToggleAtom } from './useToggleAtom';

export const useInternalModalManager = <FilledState, EmptyState>(
  openStateAtom: WritableAtom<boolean, React.SetStateAction<boolean>>,
  dataStateAtom: WritableAtom<
    FilledState | EmptyState,
    React.SetStateAction<FilledState | EmptyState>
  >,
  promiseRef: { current: OpenPromise<FilledState | EmptyState> | null },
  emptyData: EmptyState
) => {
  const [isOpen, open, close] = useToggleAtom(openStateAtom);

  const [data, setData] = useAtom(dataStateAtom);

  const openWithData = useEvent((x: FilledState) => {
    promiseRef.current?.resolve(emptyData);
    const nextPromise = new OpenPromise<FilledState | EmptyState>();
    promiseRef.current = nextPromise;
    setData(x);
    open();

    return nextPromise;
  });

  const closeWithData = useEvent(() => {
    promiseRef.current?.resolve(data);
    setData(emptyData);
    close();
    promiseRef.current = null;
  });

  return [isOpen, data, openWithData, closeWithData] as const;
};

export const ModalManager = <FilledData, EmptyData>(emptyData: EmptyData) => {
  const openAtom = atom(false);
  const dataAtom = atom<FilledData | EmptyData>(emptyData);
  const promiseRef: { current: OpenPromise<FilledData | EmptyData> | null } = {
    current: null,
  };

  const useModalManager = () =>
    useInternalModalManager<FilledData, EmptyData>(
      openAtom,
      dataAtom,
      promiseRef,
      emptyData
    );

  return useModalManager;
};
