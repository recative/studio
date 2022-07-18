import type { InputOverrides } from 'baseui/input';
import type { ButtonOverrides } from 'baseui/button';
import type { SelectOverrides } from 'baseui/select';

export const EmptyInputOverrides = (
  width = 100,
  mono = false
): InputOverrides => ({
  Input: {
    style: ({ $theme, $disabled }) => ({
      backgroundColor: $disabled ? 'transparent' : $theme.colors.primaryB,
      color: $theme.colors.primaryA,
      cursor: $disabled ? 'default' : 'initial',
      fontFamily: mono
        ? $theme.typography.MonoDisplayMedium.fontFamily
        : $theme.typography.LabelMedium.fontFamily,
    }),
  },
  InputContainer: {
    style: { backgroundColor: 'none' },
  },
  Root: {
    style: {
      width: `${width}px`,
      borderTopColor: 'transparent',
      borderLeftColor: 'transparent',
      borderBottomColor: 'transparent',
      borderRightColor: 'transparent',
      backgroundColor: 'transparent',
    },
  },
});

export const EmptySelectOverrides = (width = 100): SelectOverrides => ({
  Root: {
    style: { width: `${width}px` },
  },
  IconsContainer: {
    // style: { display: 'none' },
  },
  ControlContainer: {
    style: ({ $theme }) => ({
      backgroundColor: $theme.colors.primaryB,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: 'transparent',
    }),
  },
});

export const EmptyButtonOverrides = (width = 100): ButtonOverrides => ({
  BaseButton: {
    style: ({ $theme }) => ({
      width: `${width}px`,
      backgroundColor: $theme.colors.primaryB,
      paddingTop: '6px',
      paddingBottom: '6px',
      paddingLeft: '14px',
      paddingRight: '14px',
      textAlign: 'left',
      justifyContent: 'flex-start',
      ':hover': { background: $theme.colors.primaryB },
    }),
  },
});
