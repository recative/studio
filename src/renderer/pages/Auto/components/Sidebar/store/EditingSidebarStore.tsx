import { atom } from 'jotai';

export interface IEditingSidebarStore {
  type: string;
  data: unknown;
  onDataUpdate: (data: unknown) => void;
}

export const editingSidebarAtom = atom<IEditingSidebarStore | undefined | null>(
  undefined
);
