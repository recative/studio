import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type { IWorkspaceConfiguration } from '@recative/definitions';

interface IUser {
  token: string;
  id: number;
  name: string;
  label: string;
}

export const WORKSPACE_CONFIGURATION = atom<IWorkspaceConfiguration | null>(
  null
);

export const DATABASE_LOCKED = atom(true);

export const ACT_SERVER_BASE = atomWithStorage<string>(
  'ACT_SERVER_BASE',
  'http://localhost:3000'
);

export const USER = atom<IUser | null>(null);

export const USER_LOGIN_MODAL_OPEN = atom(false);

export const USER_INFO_MODAL_OPEN = atom(false);
