import * as React from 'react';

import { useAtom } from 'jotai';

import { Button, SIZE as BUTTON_SIZE } from 'baseui/button';
import { ButtonGroup, MODE } from 'baseui/button-group';

import { LanguageEnOutline } from 'components/Icons/LanguageEnOutline';
import { LanguageZhHansOutline } from 'components/Icons/LanguageZhHansOutline';
import { LanguageZhHantOutline } from 'components/Icons/LanguageZhHantOutline';

import { LANGUAGES, CURRENT_LANGUAGE_ATOM } from './constants/languages';

export const I18Selector: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useAtom(CURRENT_LANGUAGE_ATOM);

  return (
    <ButtonGroup
      mode={MODE.radio}
      size={BUTTON_SIZE.mini}
      selected={LANGUAGES.findIndex((x) => x === currentLanguage) || 0}
      onClick={(_event, index) => {
        setCurrentLanguage(LANGUAGES[index]);
      }}
    >
      <Button>
        <LanguageEnOutline width={12} />
      </Button>
      <Button>
        <LanguageZhHansOutline width={12} />
      </Button>
      <Button>
        <LanguageZhHantOutline width={12} />
      </Button>
    </ButtonGroup>
  );
};
