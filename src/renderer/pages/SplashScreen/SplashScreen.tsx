import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'baseui';

import {
  LabelXSmall,
  LabelMedium,
  DisplayMedium,
  ParagraphXSmall,
} from 'baseui/typography';

import type { StyleObject } from 'styletron-standard';

import { StarTrail } from 'components/StarTrail/StarTrail';
import { RecativeLogo } from 'components/RecativeLogo/RecativeLogo';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useInterval } from 'react-use';
import { blinkAnimationStyle } from 'styles/animation';

const footerStyles: StyleObject = {
  paddingBottom: '12px',
  fontSize: '0.7em',
  opacity: '0.4',
};

const progressStyles: StyleObject = {
  paddingLeft: '4px',
  opacity: '0.5',
};

export const SplashScreen: React.FC = () => {
  const [css] = useStyletron();

  const [progress, progressActions] = useAsync(() => server.getProgress());

  const dragAreaStyles = React.useMemo(
    () => ({ '-webkit-app-region': 'drag' }),
    []
  );

  useInterval(progressActions.execute, 500);

  return (
    <RecativeBlock
      id="drag"
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      userSelect="none"
      style={dragAreaStyles as any}
    >
      <style>{`
        #titleBar { display: none };
      `}</style>
      <RecativeBlock
        width="500px"
        height="340px"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        position="relative"
      >
        <RecativeBlock
          top={0}
          left={0}
          width="100%"
          height="100%"
          position="absolute"
          pointerEvents="none"
          overflow="hidden"
        >
          <RecativeBlock transform="translate(-50%, -50%)">
            <RecativeBlock transform="translate(64px, 72px)">
              <StarTrail />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
        <RecativeBlock
          paddingLeft="64px"
          paddingTop="64px"
          position="relative"
          zIndex={1}
        >
          <LabelMedium>Recative</LabelMedium>
          <DisplayMedium>Studio</DisplayMedium>
          <LabelXSmall
            className={css(progressStyles)}
            marginTop="12px"
            display="flex"
          >
            {progress.result ?? 'Loading'}
            <RecativeBlock
              className={css(blinkAnimationStyle)}
              animationDelay="100ms"
            >
              .
            </RecativeBlock>
            <RecativeBlock
              className={css(blinkAnimationStyle)}
              animationDelay="200ms"
            >
              .
            </RecativeBlock>
            <RecativeBlock
              className={css(blinkAnimationStyle)}
              animationDelay="300ms"
            >
              .
            </RecativeBlock>
          </LabelXSmall>
        </RecativeBlock>
        <RecativeBlock paddingLeft="64px" position="relative" zIndex={1}>
          <RecativeBlock marginBottom="-12px">
            <RecativeLogo height="1.4em" />
          </RecativeBlock>
          <ParagraphXSmall className={css(footerStyles)}>
            © 2023 Reactive System and its affiliates. All rights reserved.
          </ParagraphXSmall>
        </RecativeBlock>
      </RecativeBlock>
    </RecativeBlock>
  );
};
