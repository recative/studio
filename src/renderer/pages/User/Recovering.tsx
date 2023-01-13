import * as React from 'react';

import { useStyletron } from 'baseui';

import { Spinner } from 'baseui/spinner';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { RecoveringBackup } from 'components/Illustrations/RecoveringBackup';
import { LabelLarge } from 'baseui/typography';
import { SuccessIconFilled } from 'components/Icons/SuccessIconFilled';
import { useAsync } from '@react-hookz/web';
import { server } from 'utils/rpc';
import { useInterval } from 'react-use';
import { RecoveringBackupFailed } from 'components/Illustrations/RecoveringBackupFailed';
import { FailIconFilled } from 'components/Icons/FailIconFilled';

const contentContainerStyles = {
  height: '-webkit-fill-available !important',
};

const InternalRecovering: React.FC = () => {
  const [css] = useStyletron();

  const [recoverStatus, recoverStatusActions] = useAsync(() => {
    return server.getRecoverBackupStatus();
  });

  useInterval(recoverStatusActions.execute, 500);

  return (
    <PivotLayout disabled={recoverStatus.status === 'loading'}>
      <ContentContainer className={css(contentContainerStyles)} width={600}>
        <RecativeBlock
          height="-webkit-fill-available"
          marginTop="48px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <RecativeBlock position="relative">
            {recoverStatus.result?.status === 'failed' ? (
              <RecoveringBackupFailed width={400} />
            ) : (
              <RecoveringBackup width={400} />
            )}
            {recoverStatus.result?.status === 'working' && (
              <RecativeBlock position="absolute" top="92px" left="138px">
                <Spinner $color="#ac6f77" />
              </RecativeBlock>
            )}
            {recoverStatus.result?.status === 'success' && (
              <RecativeBlock position="absolute" top="78px" left="126px">
                <SuccessIconFilled width="64px" />
              </RecativeBlock>
            )}
            {recoverStatus.result?.status === 'failed' && (
              <RecativeBlock position="absolute" top="78px" left="126px">
                <FailIconFilled width="64px" />
              </RecativeBlock>
            )}
          </RecativeBlock>
          <RecativeBlock marginTop="32px">
            <LabelLarge>
              <b>{recoverStatus.result?.message}</b>
            </LabelLarge>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
    </PivotLayout>
  );
};

export const Recovering = React.memo(InternalRecovering);
