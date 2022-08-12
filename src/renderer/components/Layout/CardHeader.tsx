import * as React from 'react';

import { RecativeBlock } from 'components/Block/Block';

import { BackIconButton } from 'components/Button/BackIconButton';

interface ICardHeaderProps {
  children?: React.ReactNode;
}

export const CardHeader: React.FC<ICardHeaderProps> = ({ children }) => {
  return (
    <RecativeBlock
      marginBottom="-12px"
      display="flex"
      flexDirection="row"
      alignItems="center"
    >
      <RecativeBlock marginLeft="-16px" marginRight="8px">
        <BackIconButton />
      </RecativeBlock>
      <RecativeBlock>{children}</RecativeBlock>
    </RecativeBlock>
  );
};
