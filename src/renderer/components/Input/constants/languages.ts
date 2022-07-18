import { atom } from 'jotai';

export const LANGUAGES = ['en', 'zh-Hans', 'zh-Hant'] as const;

export type Language = typeof LANGUAGES[number];

export const CURRENT_LANGUAGE_ATOM = atom<Language>('en');
