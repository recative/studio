import * as React from 'react';

import { Portal } from '@reach/portal';
import { atom, useAtom } from 'jotai';

import ClickAwayListener from 'react-click-away-listener';

export const CURRENT_MODAL_ATOM = atom<string | null>(null);
export const CURRENT_MODAL_X = atom(0);
export const CURRENT_MODAL_Y = atom(0);

export interface IContextMenuProps {
  id: string;
  onClickAway?: () => void;
  children: React.ReactNode;
}

export const useContextMenu = <Key extends string, Val>(
  id: string,
  items: Record<Key, Val>
) => {
  const [, setCurrentModal] = useAtom(CURRENT_MODAL_ATOM);
  const [, setX] = useAtom(CURRENT_MODAL_X);
  const [, setY] = useAtom(CURRENT_MODAL_Y);
  const [selectedValue, setSelectedValue] = React.useState<Val | null>(null);

  const contextMenuTriggers = React.useMemo(() => {
    const triggers = {} as Record<
      Key,
      <T extends HTMLElement>(event: React.MouseEvent<T>) => void
    >;

    const itemKeys = Object.keys(items) as Key[];

    itemKeys.forEach((itemKey) => {
      triggers[itemKey] = (event) => {
        event.preventDefault();
        setX(event.clientX);
        setY(event.clientY);
        setCurrentModal(id);
        setSelectedValue(items[itemKey]);
      };
    });

    return triggers;
  }, [items, setX, setY, setCurrentModal, id]);

  const handleCloseContextMenu = React.useCallback(() => {
    setX(0);
    setY(0);
    setCurrentModal(null);
  }, [setCurrentModal, setX, setY]);

  return [contextMenuTriggers, handleCloseContextMenu, selectedValue] as const;
};

export const ContextMenu: React.FC<IContextMenuProps> = ({
  id,
  onClickAway,
  children,
}) => {
  const [currentModal, setCurrentModal] = useAtom(CURRENT_MODAL_ATOM);
  const [X] = useAtom(CURRENT_MODAL_X);
  const [Y] = useAtom(CURRENT_MODAL_Y);

  const handleClickAway = React.useCallback(() => {
    onClickAway?.();
    setCurrentModal(null);
  }, [onClickAway, setCurrentModal]);

  const modalStyles = React.useMemo(
    () => ({
      top: `${Y}px`,
      left: `${X}px`,
      // Oh... Fuck...
      position: 'fixed' as unknown as undefined,
    }),
    [X, Y]
  );

  if (currentModal !== id) return null;

  return (
    <Portal>
      <div id={id} style={modalStyles}>
        <ClickAwayListener onClickAway={handleClickAway}>
          <div>{children}</div>
        </ClickAwayListener>
      </div>
    </Portal>
  );
};
