import * as React from 'react';

import { useStyletron } from 'baseui';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { FormControl } from 'baseui/form-control';
import type { FormControlProps } from 'baseui/form-control';

import { LANGUAGES } from './constants/languages';

export interface I18FormControlProps extends Omit<FormControlProps, 'label'> {
  finished: boolean;
  label?: React.ReactNode;
}

export const isFinished = (x?: Record<string, string>) => {
  if (!x) return false;

  return (
    LANGUAGES.map((language) => x[language]).filter((item) => item?.length)
      .length >= LANGUAGES.length
  );
};

export const I18FormControl: React.FC<I18FormControlProps> = ({
  finished,
  label,
  children,
  ...props
}) => {
  const [css, theme] = useStyletron();

  const i18nIconStyle = css({
    padding: '3px',
    color: finished ? theme.colors.positive : theme.colors.negative,
    fontSize: '12px',
    fontWeight: 'bold',
    lineHeight: '1em',
    borderColor: finished ? theme.colors.positive : theme.colors.negative,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    userSelect: 'none',
  });

  return (
    <FormControl
      label={
        <RecativeBlock
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <RecativeBlock>{label}</RecativeBlock>
          <RecativeBlock className={i18nIconStyle}>I18N</RecativeBlock>
        </RecativeBlock>
      }
      {...props}
    >
      {children}
    </FormControl>
  );
};
