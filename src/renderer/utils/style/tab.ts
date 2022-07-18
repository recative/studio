import type { TabsOverrides, TabOverrides } from 'baseui/tabs-motion';

export const TABS_OVERRIDES: TabsOverrides = {
  TabHighlight: {
    style: ({ $theme }) => ({
      height: '4px',
      marginTop: '-4px',
      background: $theme.colors.primaryA,
    }),
  },
  TabBorder: {
    style: {
      backgroundColor: 'transparent',
    },
  },
};

export const ICON_TAB_OVERRIDES: TabOverrides = {
  Tab: {
    style: {
      paddingTop: '12px',
      paddingRight: '12px',
      paddingBottom: '12px',
      paddingLeft: '12px',
      fontSize: 0,
    },
  },
  ArtworkContainer: {
    style: {
      marginRight: 0,
    },
  },
};

export const PIVOT_TAB_OVERRIDES: TabOverrides = {
  TabPanel: {
    style: {
      paddingTop: '0',
      paddingRight: '0',
      paddingBottom: '0',
      paddingLeft: '0',
    },
  },
};
