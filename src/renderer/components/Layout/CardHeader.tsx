import * as React from 'react';

import { Block } from 'baseui/block';

import { BackIconButton } from 'components/Button/BackIconButton';

interface ICardHeaderProps {
  children?: React.ReactNode;
}

export const CardHeader: React.FC<ICardHeaderProps> = ({ children }) => {
  return (
    <Block
      marginBottom="-12px"
      display="flex"
      flexDirection="row"
      alignItems="center"
    >
      <Block marginLeft="-16px" marginRight="8px">
        <BackIconButton />
      </Block>
      <Block>{children}</Block>
    </Block>
  );
};
