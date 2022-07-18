import * as React from 'react';

import { Block } from 'baseui/block';

interface IActionBarProps {
  children: React.ReactNode;
}

export const ActionBar: React.FC<IActionBarProps> = ({ children }) => {
  return (
    <Block
      overrides={{
        Block: {
          style: ({ $theme }) => ({
            left: '0',
            bottom: '0',
            width: '100vw',
            minHeight: '20px',
            maxHeight: '200px',
            backgroundColor: $theme.colors.primaryB,
            position: 'fixed',
            display: 'flex',
            justifyContent: 'flex-end',
          }),
        },
      }}
    >
      {children}
    </Block>
  );
};
