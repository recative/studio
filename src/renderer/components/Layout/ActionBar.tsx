import * as React from 'react';

import { useStyletron } from 'baseui';

import { RecativeBlock } from 'components/Block/RecativeBlock';

interface IActionBarProps {
  children: React.ReactNode;
}

export const ActionBar: React.FC<IActionBarProps> = ({ children }) => {
  const [, theme] = useStyletron();
  return (
    <RecativeBlock
      left="0"
      bottom="0"
      width="100vw"
      minHeight="20px"
      maxHeight="200px"
      backgroundColor={theme.colors.primaryB}
      position="fixed"
      display="flex"
      justifyContent="flex-end"
    >
      {children}
    </RecativeBlock>
  );
};
