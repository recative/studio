import * as React from 'react';

import Avatar from 'boring-avatars';

import { useStyletron } from 'baseui';

import { Button, KIND, SIZE } from 'baseui/button';
import { DisplayXSmall, LabelSmall } from 'baseui/typography';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useLoginCredential } from 'utils/hooks/loginCredential';

export interface IExistedCredentialProps {}

export const ExistedCredential = () => {
  const [, theme] = useStyletron();
  const [lastCredential, getLoginCredential] = useLoginCredential();

  const logoutButtonClick = useEvent(async () => {
    await server.userLogout();
    getLoginCredential();
  });

  return (
    <RecativeBlock minWidth="50%">
      <RecativeBlock display="flex">
        <RecativeBlock marginRight="12px">
          <Avatar
            size="48px"
            variant="beam"
            name={lastCredential?.sessionId || 'Untitled'}
          />
        </RecativeBlock>
        <RecativeBlock paddingTop="4px">
          <DisplayXSmall>
            <RecativeBlock fontSize="0.5em" lineHeight="1em">
              {lastCredential?.sessionId || 'NoName'}
            </RecativeBlock>
          </DisplayXSmall>
          <LabelSmall marginTop="4px" color={theme.colors.mono700}>
            <RecativeBlock fontSize="0.8em">
              {lastCredential?.label || '[empty]'}
            </RecativeBlock>
          </LabelSmall>

          <RecativeBlock padding="12px 0">
            <LabelSmall>
              <b>Server:</b> {lastCredential?.host || '[empty]'}
            </LabelSmall>
            <LabelSmall marginTop="8px">
              <b>Expires at:</b> {lastCredential?.expiresAt || 'Forever'}
            </LabelSmall>
          </RecativeBlock>
        </RecativeBlock>
        <RecativeBlock marginLeft="auto">
          <Button
            kind={KIND.secondary}
            size={SIZE.compact}
            onClick={logoutButtonClick}
          >
            Logout
          </Button>
        </RecativeBlock>
      </RecativeBlock>
    </RecativeBlock>
  );
};
