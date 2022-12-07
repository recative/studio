import * as React from 'react';

import { useAtom } from 'jotai';

import { Input } from 'baseui/input';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { HeadingXXLarge } from 'baseui/typography';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

import { USER_INFO_MODAL_OPEN } from 'stores/ProjectDetail';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { useEvent } from 'utils/hooks/useEvent';

interface IUser {
  token: string;
  id: number;
  name: string;
  label: string;
}

const DEFAULT_FORM_DATA = {
  actServer: '',
  token: '',
};

export const Login: React.FC = () => {
  const [, setUser] = React.useState<IUser | null>(null);

  const [, setIsUserInfoOpen] = useAtom(USER_INFO_MODAL_OPEN);

  const [actServerValue, valueChangeCallbacks] =
    useFormChangeCallbacks(DEFAULT_FORM_DATA);

  const handleActServerChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.actServer
  );

  const handleTokenChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.token
  );

  const loginButtonClick = useEvent(async () => {
    const { code, ...thisUser } = await server.userLogin(
      actServerValue.token,
      actServerValue.actServer
    );

    if (thisUser && 'id' in thisUser) {
      setUser(thisUser);
      setIsUserInfoOpen(true);
    } else {
      toaster.info(`Failed to login: ${code || 'Unknown Error'}`, {
        overrides: { InnerContainer: { style: { width: '100%' } } },
      });
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
