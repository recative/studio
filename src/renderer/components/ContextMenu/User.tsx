import * as React from 'react';
import { useAtom } from 'jotai';
import { useStyletron } from 'baseui';

import { SingleNeutralCircleOutline } from 'components/Icons/SingleNeutralCircleOutline';
import Avatar from 'boring-avatars';

import {
  USER_INFO_MODAL_OPEN,
  USER_LOGIN_MODAL_OPEN,
  USER,
} from 'stores/ProjectDetail';

import { server } from 'utils/rpc';

const UserBaseStyle = {
  display: 'flex',
  WebkitAppRegion: 'no-drag',
  height: '32px',
  paddingLeft: '16px',
  paddingRight: '16px',
  cursor: 'default',
  fontSize: '12px',
  alignItems: 'center',
  border: 'none',
  outline: 'none',
  backgroundColor: '#ffffff',
  ':hover': {
    transition: 'background-color 0.1s',
    backgroundColor: '#e5e5e5',
  },
  ':active': {
    backgroundColor: '#cccccc',
  },
};

const AvatarStyle = {
  height: '16px',
  marginRight: '8px',
};

export const User: React.VFC = () => {
  const [user, setUser] = useAtom(USER);
  const [css] = useStyletron();

  const [isLoginModalOpen, setIsLoginModalOpen] = useAtom(
    USER_LOGIN_MODAL_OPEN
  );
  const [isUserInfoOpen, setIsUserInfoOpen] = useAtom(USER_INFO_MODAL_OPEN);

  React.useEffect(() => {
    server
      .getUserData()
      .then((userData) => {
        if (userData) {
          setUser(userData);
        }

        return null;
      })
      .catch((error) => {
        console.error(error);
      });
  }, [setUser, isLoginModalOpen]);

  const buttonClick = React.useCallback(() => {
    if (!isLoginModalOpen && !isUserInfoOpen) {
      if (!user) {
        setIsLoginModalOpen(true);
      } else {
        setIsUserInfoOpen(true);
      }
    } else {
      setIsLoginModalOpen(false);
      setIsUserInfoOpen(false);
    }
  }, [
    isLoginModalOpen,
    isUserInfoOpen,
    setIsLoginModalOpen,
    setIsUserInfoOpen,
    user,
  ]);

  return (
    <button type="button" className={css(UserBaseStyle)} onClick={buttonClick}>
      {!user ? (
        <>
          <SingleNeutralCircleOutline
            className={css({
              ...AvatarStyle,
            })}
            width={18}
            onClick={buttonClick}
          />
          Login
        </>
      ) : (
        <>
          <span className={css(AvatarStyle)}>
            <Avatar size={18} name={user.label || 'Untitled'} />
          </span>
          {user.name || 'noname'}
        </>
      )}
    </button>
  );
};
