import * as React from 'react';

import { useAtom } from 'jotai';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Input } from 'baseui/input';
import type { InputProps } from 'baseui/input';

import { LANGUAGES, CURRENT_LANGUAGE_ATOM } from './constants/languages';
import type { Language } from './constants/languages';

export interface II18InputProps {
  disabled?: boolean;
  value?: Record<Language, string>;
  onChange: (value: Record<Language, string>) => void;
}

export const getDisplayValue = (x: Record<string, string> | string) => {
  if (typeof x === 'string') return x;
  for (let i = 0; i < LANGUAGES.length; i += 1) {
    const language = LANGUAGES[i];
    if (x && language in x) return x[language];
  }
  return '';
};

export const I18Input: React.FC<
  II18InputProps & Omit<InputProps, 'value' | 'onChange'>
> = ({ value, onChange, disabled, ...props }) => {
  const [currentLanguage] = useAtom(CURRENT_LANGUAGE_ATOM);

  const handleChangeCallbacks = React.useMemo(
    () =>
      LANGUAGES.map((language) => {
        return (
          event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
          if (!value) return;

          onChange({
            ...value,
            [language]: event.currentTarget.value,
          });
        };
      }),
    [onChange, value]
  );

  return (
    <RecativeBlock>
      {LANGUAGES.map((language, index) => (
        <RecativeBlock
          key={language}
          display={currentLanguage !== language ? 'none' : 'block'}
        >
          <Input
            disabled={disabled}
            value={value?.[language] || ''}
            onChange={handleChangeCallbacks[index]}
            {...props}
          />
        </RecativeBlock>
      ))}
    </RecativeBlock>
  );
};
