import * as React from 'react';

import { useNavigate } from 'react-router-dom';

import { KIND as BUTTON_KIND } from 'baseui/button';

import { BackIconOutline } from 'components/Icons/BackIconOutline';

import { IconButton } from './IconButton';

export const BackIconButton: React.VFC = () => {
  const navigate = useNavigate();

  const goBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <IconButton onClick={goBack} kind={BUTTON_KIND.tertiary}>
      <BackIconOutline width={20} />
    </IconButton>
  );
};
