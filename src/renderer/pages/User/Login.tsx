import * as React from 'react';

import { Input } from 'baseui/input';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { HeadingXXLarge } from 'baseui/typography';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ContentContainer } from 'components/Layout/ContentContainer';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useLoginCredential } from 'utils/hooks/loginCredential';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';

const DEFAULT_FORM_DATA = {
  actServer: '',
  token: '',
};

const InternalLogin: React.FC = () => {
  const [lastCredential, fetchLoginCredential] = useLoginCredential();

  const [actServerValue, valueChangeCallbacks] =
    useFormChangeCallbacks(DEFAULT_FORM_DATA);

  React.useEffect(() => {
    if (lastCredential) {
      valueChangeCallbacks.actServer(lastCredential.host);
      valueChangeCallbacks.token(lastCredential.token);
    }
  }, [lastCredential, valueChangeCallbacks]);

  const handleActServerChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.actServer
  );

  const handleTokenChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.token
  );

  const loginButtonClick = useEvent(async () => {
    try {
      await server.userLogin(actServerValue.token, actServerValue.actServer);

      await fetchLoginCredential();
    } catch (error) {
      toaster.negative(
        `Failed to login: ${
          error instanceof Error ? error.message : 'Unknown Error'
        }`,
        {
          overrides: { InnerContainer: { style: { width: '100%' } } },
        }
      );
    }
  });

  return (
    <PivotLayout>
      <ContentContainer width={600}>
        <ToasterContainer
          autoHideDuration={3000}
          placement={PLACEMENT.bottomRight}
        />
        <RecativeBlock marginTop="40px">
          <RecativeBlock>
            <HeadingXXLarge>Login</HeadingXXLarge>
            <FormControl
              label="Act Server"
              caption="An authentication server instance deployed by your team, or a public server."
            >
              <Input
                value={actServerValue.actServer}
                onChange={handleActServerChange}
              />
            </FormControl>
            <FormControl
              label="Token"
              caption="A Token provided by the manager of your team, which should have content deployment permissions."
            >
              <Input
                type="password"
                value={actServerValue.token}
                onChange={handleTokenChange}
              />
            </FormControl>
          </RecativeBlock>
          <RecativeBlock display="flex" justifyContent="end" marginTop="48px">
            <Button onClick={loginButtonClick}>Login</Button>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
    </PivotLayout>
  );
};

export const Login = React.memo(InternalLogin);
