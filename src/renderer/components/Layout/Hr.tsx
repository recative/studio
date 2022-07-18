import { styled } from 'baseui';

export const Hr = styled('hr', ({ $theme }) => ({
  marginTop: '12px',
  marginBottom: '12px',
  borderTopColor: $theme.colors.borderTransparent,
  borderTopWidth: '2px',
  borderBottomColor: 'transparent',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
}));
