import * as React from 'react';

import { useAtom } from 'jotai';

import { HeadingXXLarge } from 'baseui/typography';
import { Block } from 'baseui/block';
import { Input } from 'baseui/input';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { toaster, ToasterContainer } from 'baseui/toast';

import { server } from 'utils/rpc';

import {
  ACT_SERVER_BASE,
  USER_INFO_MODAL_OPEN,
  USER_LOGIN_MODAL_OPEN,
} from 'stores/ProjectDetail';

interface IUser {
  token: string;
  id: number;
  name: string;
  label: string;
}

export const Login: React.FC = () => {
  const [, setUser] = React.useState<IUser | null>(null);
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');

  const [actServer, setActServer] = useAtom(ACT_SERVER_BASE);

  const [isLoginModalOpen, setIsLoginModalOpen] = useAtom(
    USER_LOGIN_MODAL_OPEN
  );
  const [, setIsUserInfoOpen] = useAtom(USER_INFO_MODAL_OPEN);

  const loginButtonClick = React.useCallback(() => {
    (async () => {
      const { code, ...thisUser } = await server.userLogin(
        email,
        password,
        actServer
      );

      if (thisUser && 'id' in thisUser) {
        setUser(thisUser);
        setIsLoginModalOpen(false);
        setIsUserInfoOpen(true);
      } else {
        toaster.info(`Failed to login: ${code || 'Unknown Error'}`, {
          overrides: { InnerContainer: { style: { width: '100%' } } },
        });
      }
    })();
  }, [email, password, actServer, setIsLoginModalOpen, setIsUserInfoOpen]);

  return (
    <Block
      width="100vw"
      height="calc(100vh - 30px)"
      display={isLoginModalOpen ? 'flex' : 'none'}
      justifyContent="center"
      alignItems="center"
      position="fixed"
      bottom="0"
      backgroundColor="#FFFFFF"
    >
      <ToasterContainer autoHideDuration={3000} />
      <Block
        width="50%"
        overrides={{
          Block: {
            style: {
              padding: '32px 48px 48px 48px',
              border: '2px solid #DDD',
            },
          },
        }}
      >
        <Block>
          <HeadingXXLarge>Login</HeadingXXLarge>
          <FormControl label="Act Server">
            <Input
              value={actServer}
              onChange={(e) => {
                setActServer(e.currentTarget.value);
              }}
            />
          </FormControl>
          <FormControl label="Email Address">
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.currentTarget.value);
              }}
            />
          </FormControl>
          <FormControl label="Password">
            <Input
              value={password}
              type="password"
              clearOnEscape
              onChange={(e) => {
                setPassword(e.currentTarget.value);
              }}
            />
          </FormControl>
        </Block>
        <Block display="flex" justifyContent="end" marginTop="48px">
          <Button onClick={loginButtonClick}>Login</Button>
        </Block>
      </Block>
    </Block>
  );
};
