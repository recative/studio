import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';

import type { StyleObject } from 'styletron-react';
import { useStyletron } from 'styletron-react';

import { Block } from 'baseui/block';
import {
  DisplayMedium,
  ParagraphMedium,
  ParagraphSmall,
  ParagraphXSmall,
} from 'baseui/typography';

import { Pivot } from './Pivot';
import type { ColorDefinition } from './Pivot';

const mainContainerStyles: StyleObject = {
  width: '100vw',
  height: 'calc(100vh - 30px)',
  maxHeight: 'calc(100vh - 30px)',
  overflowX: 'hidden',
  display: 'grid',
  gridTemplateRows: 'min-content auto min-content',
};

const errorBoundaryStyles: StyleObject = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const qrCodeStyle: StyleObject = {
  borderWidth: '1px',
  borderColor: 'black',
  borderStyle: 'solid',
};

const pivotContainerStyles: StyleObject = {};

const contentContainerStyles: StyleObject = {
  height: '-webkit-fill-available',
  maxHeight: '100%',
  overflowY: 'auto',
};

const footerStyles: StyleObject = {
  display: 'flex',
  justifyContent: 'flex-end',
};

interface IPivotLayoutProps {
  footer?: React.ReactNode;
  additionalTabs?: React.ReactNode;
  tabColors?: ColorDefinition[];
  children?: React.ReactNode;
}

const QrCode: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 200" {...props}>
    <path shapeRendering="optimizeSpeed" fill="#fff" d="M0 0h200v200H0z" />
    <path
      shapeRendering="optimizeSpeed"
      d="M13 13h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm30 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zM13 19h6v6h-6zm36 0h6v6h-6zm18 0h6v6h-6zm36 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm36 0h6v6h-6zM13 25h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zM13 31h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zM13 37h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zM13 43h6v6h-6zm36 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm36 0h6v6h-6zM13 49h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zM61 55h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zM13 61h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zM13 67h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zM19 73h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm30 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zM19 79h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm30 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zM25 85h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zM19 91h6v6h-6zm6 0h6v6h-6zm30 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm30 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zM13 97h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm24 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm-168 6h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm-162 6h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm-156 6h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm30 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm-168 6h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm-162 6h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm-162 6h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm-96 6h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm30 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm-168 6h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm-168 6h6v6h-6zm36 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm-150 6h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm-144 6h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm-168 6h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm30 0h6v6h-6zm24 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm-168 6h6v6h-6zm36 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm18 0h6v6h-6zm-162 6h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm6 0h6v6h-6zm12 0h6v6h-6zm6 0h6v6h-6zm18 0h6v6h-6zm6 0h6v6h-6z"
    />
  </svg>
);

const FallbackComponent: React.FC<FallbackProps> = ({ error }) => {
  const [css] = useStyletron();

  return (
    <Block className={css(errorBoundaryStyles)}>
      <Block maxWidth="520px">
        <DisplayMedium>(´ﾟдﾟ`)</DisplayMedium>
        <ParagraphMedium>
          The software ran into a problem and needs to restart. You can submit a
          bug report on GitHub so we could fix it.
        </ParagraphMedium>
        <Block marginTop="32px" display="flex">
          <Block marginTop="20px" marginRight="20px">
            <QrCode className={css(qrCodeStyle)} width={80} />
          </Block>
          <Block>
            <ParagraphSmall>
              For more information about this issue and possible fixes, visit
              https://github.com/recative
            </ParagraphSmall>
            <ParagraphXSmall>
              If you call a support person, give them this info:
              <br />
              Error code: {(error?.name || '').toUpperCase()}
            </ParagraphXSmall>
          </Block>
        </Block>
      </Block>
    </Block>
  );
};

export class TestError extends Error {
  name = 'TestError';
}

export const testError = new TestError();

export const PivotLayout: React.FC<IPivotLayoutProps> = ({
  children,
  footer,
  additionalTabs,
  tabColors,
}) => {
  const [css] = useStyletron();

  return (
    <Block className={css(mainContainerStyles)}>
      <Block className={css(pivotContainerStyles)}>
        <Pivot additionalTabs={additionalTabs} tabColors={tabColors} />
      </Block>
      <Block className={css(contentContainerStyles)}>
        <ErrorBoundary FallbackComponent={FallbackComponent}>
          {children}
        </ErrorBoundary>
      </Block>
      {footer && <Block className={css(footerStyles)}>{footer}</Block>}
    </Block>
  );
};
