import * as React from 'react';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { Block } from 'baseui/block';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import type { ModalOverrides } from 'baseui/modal';
import type {
  IEditableResourceFile,
  IResourceFile,
} from '@recative/definitions';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { ResourceEditor } from '../ResourceEditor';
import type { IResourceEditorRef } from '../ResourceEditor';
import {
  titleOverrides,
  useLabelUpdateCallback,
} from './EditResourceGroupModal';

export interface IMergeModalProps {
  isOpen: boolean;
  file: IEditableResourceFile | null;
  onClose: () => void;
  onSubmit: (files: IResourceFile, fileLabel: string) => void;
}

const modalBodyStyles: StyleObject = {
  maxHeight: 'calc(100% - 212px)',
  boxSizing: 'border-box',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'stretch',
};

const mainContentStyles: StyleObject = {
  flexGrow: 1,
  marginLeft: '12px',
  overflowY: 'scroll',
};

const modalOverrides: ModalOverrides = {
  Dialog: {
    style: {
      width: '60vw',
      height: '80vh',
    },
  },
};

interface Dirtable {
  dirty?: boolean;
}

const useFileModalSubmitCallback = (
  editorRef: React.RefObject<IResourceEditorRef>,
  fileLabel: string,
  onSubmit: IMergeModalProps['onSubmit']
) => {
  return React.useCallback(() => {
    const file = editorRef.current?.value;

    if (!file) return;

    const nextFile: IResourceFile & Dirtable = { ...file };
    delete nextFile.dirty;

    onSubmit(nextFile, fileLabel);
  }, [editorRef, fileLabel, onSubmit]);
};

const InternalEditResourceFileModal: React.FC<IMergeModalProps> = ({
  file,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const editorRef = React.useRef<IResourceEditorRef>(null);
  const [css] = useStyletron();

  const databaseLocked = useDatabaseLocked();
  const [resourceLabel, handleResourceLabelUpdate] =
    useLabelUpdateCallback(file);
  const handleFileModalSubmit = useFileModalSubmitCallback(
    editorRef,
    resourceLabel,
    onSubmit
  );

  const handleSubmitClick = React.useCallback(() => {
    handleFileModalSubmit();
    onClose();
  }, [handleFileModalSubmit, onClose]);

  const handleEditorInitialized = React.useCallback(() => {
    editorRef.current?.setValue(file);
  }, [file]);

  return (
    <Modal
      animate
      autoFocus
      isOpen={isOpen}
      closeable={false}
      onClose={onClose}
      role={ROLE.dialog}
      size={SIZE.default}
      overrides={modalOverrides}
    >
      <ModalHeader>
        <Input
          disabled={databaseLocked}
          size={INPUT_SIZE.large}
          overrides={titleOverrides}
          value={resourceLabel}
          onChange={handleResourceLabelUpdate}
        />
      </ModalHeader>
      <ModalBody className={css(modalBodyStyles)}>
        <Block className={css(mainContentStyles)}>
          <ResourceEditor
            ref={editorRef}
            onInitialized={handleEditorInitialized}
          />
        </Block>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton disabled={databaseLocked} onClick={handleSubmitClick}>
          Confirm
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export const EditResourceFileModal = React.memo(InternalEditResourceFileModal);
