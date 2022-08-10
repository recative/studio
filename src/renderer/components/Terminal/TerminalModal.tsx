import * as React from 'react';
import { styled } from 'baseui';
import type { StyleObject } from 'styletron-react';

import { useStyletron } from 'styletron-react';
import { useInterval } from 'react-use';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Block } from 'baseui/block';
import type { ModalOverrides } from 'baseui/modal';

import { WaitIconOutline } from 'components/Icons/WaitIconOutline';
import { FinishIconOutline } from 'components/Icons/FinishIconOutline';
import { LoadingIconOutline } from 'components/Icons/LoadingIconOutline';
import { WarningIconOutline } from 'components/Icons/WarningIconOutline';

import {
  ITerminal,
  TerminalStepStatus,
  TerminalMessageLevel,
} from '@recative/definitions';

import { server } from 'utils/rpc';

interface ITerminalModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

const MESSAGE_STYLES: Record<TerminalMessageLevel, StyleObject> = {
  [TerminalMessageLevel.Warning]: {
    color: '#FFAB00',
  },
  [TerminalMessageLevel.Error]: {
    color: '#EF5350',
  },
  [TerminalMessageLevel.Info]: {
    color: 'white',
  },
};

const MODAL_BODY_STYLES: StyleObject = {
  height: 'calc(100% - 120px)',
};

const STYLE_TEXT_STYLES: StyleObject = {
  fontSize: '13px',
  fontWeight: 500,
};

const MODAL_OVERRIDES: ModalOverrides = {
  Dialog: {
    style: {
      width: '80vw',
      height: '80vh',
    },
  },
};

const useTerminalData = (id: string, open: boolean) => {
  const [data, setData] = React.useState<ITerminal | null>(null);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);
  const [closeable, setCloseable] = React.useState<boolean>(false);

  const updateData = React.useCallback(() => {
    server
      .getTerminalSession(id)
      .then(setData)
      .catch((error: unknown) => {
        if (error instanceof Error) {
          setErrorCode(error.name.toUpperCase());
        } else {
          setErrorCode('UNKNOWN_ERROR');
        }
      });
  }, [id]);

  React.useEffect(() => {
    updateData();
  }, [id, updateData]);

  React.useEffect(() => {
    if (data) {
      const values = Object.values(data.steps);
      const finishedCount = values.filter((x) => {
        return (
          x === TerminalStepStatus.Failed || x === TerminalStepStatus.Success
        );
      }).length;

      setCloseable(finishedCount === values.length);
    }
  }, [data]);

  useInterval(
    () => {
      if (open) {
        updateData();
      }
    },
    open ? 1000 : null
  );

  const handleReset = React.useCallback(() => {
    setErrorCode(null);
    setData(null);
    setCloseable(false);
  }, []);

  return {
    data,
    closeable,
    errorCode,
    handleReset,
  };
};

const SpinContainer = styled('div', {
  lineHeight: '0',
  animationDuration: '4s',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  animationName: {
    from: {
      transform: 'rotate(0)',
    },
    to: {
      transform: 'rotate(360deg)',
    },
  } as unknown as string,
});

const TaskList = styled('ul', {
  paddingLeft: 0,
  listStyle: 'none',
});

const IconContainer = styled('div', {
  lineHeight: 0,
  marginRight: '6px',
});

const Terminal = styled('div', {
  top: '8px',
  width: '-webkit-fill-available',
  height: '-webkit-fill-available',
  padding: '24px',
  background: 'black',
  color: 'white',
  fontFamily: 'Red Hat Mono, Noto Color Emoji',
  fontSize: '0.9em',
  fontWeight: 500,
  position: 'relative',
  overflowY: 'scroll',
  overflowWrap: 'break-word',
  wordBreak: 'break-all',
});

const StepStatus = (status: TerminalStepStatus, size = 14) => {
  if (status === TerminalStepStatus.Working) {
    return (
      <SpinContainer>
        <LoadingIconOutline width={size} />
      </SpinContainer>
    );
  }

  if (status === TerminalStepStatus.Idle) {
    return <WaitIconOutline width={size} />;
  }

  if (status === TerminalStepStatus.Success) {
    return <FinishIconOutline width={size} />;
  }

  if (status === TerminalStepStatus.Failed) {
    return <WarningIconOutline width={size} />;
  }

  return null;
};
const InternalTerminalModal: React.VFC<ITerminalModalProps> = ({
  id,
  isOpen,
  onClose,
}) => {
  const [css] = useStyletron();
  const [scrolled, setScrolled] = React.useState(false);
  const itemListRef = React.useRef<HTMLDivElement | null>(null);
  const { data, closeable, errorCode, handleReset } = useTerminalData(
    id,
    isOpen
  );

  const handleClose = React.useCallback(() => {
    handleReset();
    onClose();
    server.destroyTerminalSession(id);
  }, [handleReset, id, onClose]);

  React.useEffect(() => {
    const scrolledToBottom =
      itemListRef.current &&
      itemListRef.current.scrollTop >=
        itemListRef.current.scrollHeight - itemListRef.current.clientHeight;

    if (itemListRef.current && (!scrolled || scrolledToBottom)) {
      itemListRef.current.scrollTo({
        top: itemListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [data, scrolled]);

  const onTerminalScrolled = React.useCallback(() => {
    setScrolled(true);
  }, []);

  if (!data) {
    return null;
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
      overrides={MODAL_OVERRIDES}
    >
      <ModalBody className={css(MODAL_BODY_STYLES)}>
        <Block display="flex" width="100%" height="-webkit-fill-available">
          {!data && <>Loading...</>}
          {errorCode && <>{errorCode}</>}
          {!errorCode && data && (
            <>
              <Block width="25%" minWidth="204px">
                <TaskList>
                  {Object.entries(data.steps).map(([key, value]) => (
                    <li key={key}>
                      <Block
                        display="flex"
                        alignItems="center"
                        marginBottom="10px"
                      >
                        <IconContainer>{StepStatus(value)}</IconContainer>
                        <Block className={css(STYLE_TEXT_STYLES)}>{key}</Block>
                      </Block>
                    </li>
                  ))}
                </TaskList>
              </Block>
              <Block width="100%">
                <Terminal ref={itemListRef} onScroll={onTerminalScrolled}>
                  {data.messages.map((x, i) => (
                    <Block
                      // eslint-disable-next-line react/no-array-index-key
                      key={i.toString()}
                      className={css(MESSAGE_STYLES[x.level])}
                    >
                      {Array.isArray(x.message) ? (
                        <details>
                          <summary>{x.message[0]}</summary>
                          {x.message[1]}
                        </details>
                      ) : (
                        x.message
                      )}
                    </Block>
                  ))}
                </Terminal>
              </Block>
            </>
          )}
        </Block>
      </ModalBody>
      <ModalFooter>
        <ModalButton
          disabled={!closeable}
          kind={BUTTON_KIND.secondary}
          onClick={handleClose}
        >
          Done
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export const TerminalModal = React.memo(InternalTerminalModal);
