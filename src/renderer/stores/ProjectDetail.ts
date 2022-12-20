import { atom } from 'jotai';

import type { IWorkspaceConfiguration } from '@recative/definitions';

export const WORKSPACE_CONFIGURATION = atom<IWorkspaceConfiguration | null>(
  null
);

export const DATABASE_LOCKED = atom(true);
