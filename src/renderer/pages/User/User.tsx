import * as React from 'react';
import { useStyletron } from 'baseui';
import type { StyleObject } from 'styletron-react';

import Avatar from 'boring-avatars';

import { Button, SIZE as BUTTON_SIZE } from 'baseui/button';
import { DisplayXSmall, LabelMedium, LabelSmall } from 'baseui/typography';
import type { ButtonOverrides } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useLoginCredential } from 'utils/hooks/loginCredential';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { useNavigate } from 'react-router';

const LOGOUT_BUTTON_OVERRIDES: ButtonOverrides = {
  Root: {
    style: ({ $theme }) => {
      return {
        width: '100%',
        backgroundColor: $theme.colors.contentNegative,
      };
    },
  },
};

const BODY_STYLE: StyleObject = {
  border: '2px solid #DDD',
};

const AVATAR_CONTAINER: StyleObject = {
  lineHeight: '0',
};

const InternalUser: React.FC = () => {
  const [css, theme] = useStyletron();
  const navigate = useNavigate();
  const [lastCredential] = useLoginCredential();

  const logoutButtonClick = useEvent(async () => {
    await server.userLogout();
    navigate('/login');
  });

  return (
    <PivotLayout>
      <ContentContainer width={600}>
        <RecativeBlock marginTop="48px">
          <RecativeBlock minWidth="50%" className={css(BODY_STYLE)}>
            <RecativeBlock
              paddingTop="80px"
              paddingBottom="80px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <RecativeBlock display="flex" alignItems="center">
                <RecativeBlock
                  className={css(AVATAR_CONTAINER)}
                  marginRight="24px"
                >
                  <Avatar
                    size="76px"
                    variant="beam"
                    name={lastCredential?.sessionId || 'Untitled'}
                  />
                </RecativeBlock>
                <RecativeBlock>
                  <DisplayXSmall>
                    {lastCredential?.sessionId || 'NoName'}
                  </DisplayXSmall>
                  <LabelMedium marginTop="8px" color={theme.colors.mono700}>
                    {lastCredential?.label || '[empty]'}
                  </LabelMedium>
                </RecativeBlock>
              </RecativeBlock>
            </RecativeBlock>
            <RecativeBlock
              paddingTop="24px"
              paddingBottom="24px"
              backgroundColor={theme.colors.mono300}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <RecativeBlock>
                <RecativeBlock padding="12px 0">
                  <LabelSmall>
                    <b>Server:</b> {lastCredential?.host || '[empty]'}
                  </LabelSmall>
                  <LabelSmall marginTop="8px">
                    <b>Expires at:</b> {lastCredential?.expiresAt || 'Forever'}
                  </LabelSmall>
                </RecativeBlock>

                <RecativeBlock marginTop="14px" paddingBottom="12px">
                  <Button
                    size={BUTTON_SIZE.compact}
                    overrides={LOGOUT_BUTTON_OVERRIDES}
                    onClick={logoutButtonClick}
                  >
                    Logout
                  </Button>
                </RecativeBlock>
              </RecativeBlock>
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
    </PivotLayout>
  );
};

export const User = React.memo(InternalUser);
