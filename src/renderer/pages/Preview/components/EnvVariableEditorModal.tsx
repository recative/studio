import * as React from 'react';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

import { KIND as BUTTON_KIND } from 'baseui/button';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalButton,
  ROLE,
  SIZE,
} from 'baseui/modal';
import type { ModalOverrides } from 'baseui/modal';

import { neoTheme } from '../utils/neoTheme';

export interface IEnvVariableEditorModalProps {
  isOpen: boolean;
  onSubmit: (x: string) => void;
  onClose: () => void;
}

const modalOverrides: ModalOverrides = {
  Dialog: {
    style: {
      width: '80vw',
      height: '80vh',
    },
  },
};

const getCachedEnvVariable = () =>
  localStorage.getItem('act-server-env') || '{}';

export const EnvVariableEditorModal: React.VFC<IEnvVariableEditorModalProps> =
  ({ isOpen, onSubmit, onClose }) => {
    const valueRef = React.useRef<string>(getCachedEnvVariable());
    const [valid, setValid] = React.useState(true);
    const handleSubmit = React.useCallback(() => {
      localStorage.setItem('act-server-env', valueRef.current);
      onSubmit(valueRef.current);
    }, [onSubmit]);

    const validateValue = React.useCallback((x: string) => {
      try {
        JSON.parse(x);
        setValid(true);
      } catch (e) {
        setValid(false);
      }
    }, []);

    React.useEffect(() => {
      if (isOpen) {
        valueRef.current = getCachedEnvVariable();
        validateValue(valueRef.current);
      }
    }, [isOpen, validateValue]);

    return (
      <Modal
        onClose={onClose}
        isOpen={isOpen}
        animate
        autoFocus
        closeable={false}
        size={SIZE.default}
        role={ROLE.dialog}
        overrides={modalOverrides}
      >
        <ModalHeader>Edit Environment Variables</ModalHeader>
        <ModalBody>
          <CodeMirror
            height="calc(80vh - 188px)"
            value={getCachedEnvVariable()}
            extensions={[json()]}
            theme={neoTheme}
            onChange={(value) => {
              valueRef.current = value;
              validateValue(value);
            }}
          />
        </ModalBody>
        <ModalFooter>
          <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
            Close
          </ModalButton>
          <ModalButton
            disabled={!valid}
            onClick={handleSubmit}
            kind={BUTTON_KIND.primary}
          >
            Submit
          </ModalButton>
        </ModalFooter>
      </Modal>
    );
  };
