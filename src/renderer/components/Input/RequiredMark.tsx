import * as React from 'react';
import { styled } from 'baseui';

const Sup = styled('sup', {
  color: 'red',
  marginLeft: '2px',
});

export const RequiredMark: React.FC = () => {
  return <Sup>*</Sup>;
};
