import { atom } from 'jotai';

import type { IWorkspaceConfiguration } from '@recative/definitions';

interface IUser {
  token: string;
  host: string;
  label: string;
}

export const WORKSPACE_CONFIGURATION = atom<IWorkspaceConfiguration | null>(
  null
);

export const DATABASE_LOCKED = atom(true);

export const USER = atom<IUser | null>(null);
