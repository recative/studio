import * as React from 'react';
import { atom, useAtom } from 'jotai';

import { server } from 'utils/rpc';
import { useEvent } from './useEvent';

const LOGIN_CREDENTIAL_ATOM = atom<
  Awaited<ReturnType<typeof server.getLastLoginCredential>> | undefined
>(undefined);

export const useLoginCredential = () => {
  const [loginCredential, setLoginCredential] = useAtom(LOGIN_CREDENTIAL_ATOM);

  const getLoginCredential = useEvent(async () => {
    setLoginCredential(await server.getLastLoginCredential());
  });

  React.useEffect(() => {
    void getLoginCredential();
  }, [getLoginCredential]);

  return [loginCredential, getLoginCredential] as const;
};
