import * as React from 'react';

import { Input } from 'baseui/input';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { HeadingXXLarge } from 'baseui/typography';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { useEvent } from 'utils/hooks/useEvent';
import { useAsync } from '@react-hookz/web';

interface IUser {
  token: string;
  label: string;
  host: string;
}

const DEFAULT_FORM_DATA = {
  actServer: '',
  token: '',
};

export const Login: React.FC = () => {
  const [, setUser] = React.useState<IUser | null>(null);

  const [lastCredential, lastCredentialActions] = useAsync(
    server.getLastLoginCredential
  );

  const [actServerValue, valueChangeCallbacks] =
    useFormChangeCallbacks(DEFAULT_FORM_DATA);

  React.useEffect(() => {
    lastCredentialActions.execute();
  }, [lastCredentialActions]);

  React.useEffect(() => {
    if (lastCredential.result) {
      valueChangeCallbacks.actServer(lastCredential.result.host);
      valueChangeCallbacks.token(lastCredential.result.token);
    }
  }, [lastCredential.result, valueChangeCallbacks]);

  const handleActServerChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.actServer
  );

  const handleTokenChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.token
  );

  const loginButtonClick = useEvent(async () => {
    try {
      const user = await server.userLogin(
        actServerValue.token,
        actServerValue.actServer
      );

      setUser({
        token: user.token,
        host: user.host,
        label: user.comment,
      });
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
