import './wydr';

import React from 'react';

import { Client as Styletron } from 'styletron-engine-monolithic';
import { BaseProvider, createTheme } from 'baseui';
import { Provider as StyletronProvider } from 'styletron-react';

import type { StandardEngine } from 'styletron-react';

import { HashRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

import { App } from './renderer/App';

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);

type FixedStyletronProviderType = React.Provider<StandardEngine> & {
  children: React.ReactNode;
};

const FixedStyletronProvider = StyletronProvider as FixedStyletronProviderType;

const engine = new Styletron();

const CustomizedTheme = createTheme(
  {
    primaryFontFamily: 'Raleway, Noto Color Emoji',
  },
  {
    borders: {
      useRoundedCorners: false,
      radius100: '0px',
      radius200: '0px',
      radius300: '0px',
      radius400: '0px',
      radius500: '0px',
      buttonBorderRadius: '0px',
      buttonBorderRadiusMini: '0px',
      checkboxBorderRadius: '0px',
      surfaceBorderRadius: '0px',
      inputBorderRadius: '0px',
      inputBorderRadiusMini: '0px',
      popoverBorderRadius: '0px',
      tagBorderRadius: '0px',
    },
    typography: {
      DisplayLarge: {
        fontFamily: 'Raleway',
      },
      DisplayMedium: {
        fontFamily: 'Raleway',
      },
      DisplaySmall: {
        fontFamily: 'Raleway',
      },
      DisplayXSmall: {
        fontFamily: 'Raleway',
      },
      MonoParagraphXSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoParagraphSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoParagraphMedium: {
        fontFamily: 'Red Hat Mono',
      },
      MonoParagraphLarge: {
        fontFamily: 'Red Hat Mono',
      },
      MonoLabelXSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoLabelSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoLabelMedium: {
        fontFamily: 'Red Hat Mono',
      },
      MonoLabelLarge: {
        fontFamily: 'Red Hat Mono',
      },
      MonoHeadingXSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoHeadingSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoHeadingMedium: {
        fontFamily: 'Red Hat Mono',
      },
      MonoHeadingLarge: {
        fontFamily: 'Red Hat Mono',
      },
      MonoHeadingXLarge: {
        fontFamily: 'Red Hat Mono',
      },
      MonoHeadingXXLarge: {
        fontFamily: 'Red Hat Mono',
      },
      MonoDisplayXSmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoDisplaySmall: {
        fontFamily: 'Red Hat Mono',
      },
      MonoDisplayMedium: {
        fontFamily: 'Red Hat Mono',
      },
      MonoDisplayLarge: {
        fontFamily: 'Red Hat Mono',
      },
    },
  }
);

root.render(
  <FixedStyletronProvider value={engine}>
    <BaseProvider theme={CustomizedTheme}>
      <HashRouter>
        <App />
      </HashRouter>
    </BaseProvider>
  </FixedStyletronProvider>
);
