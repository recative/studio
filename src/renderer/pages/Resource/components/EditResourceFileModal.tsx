import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

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
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import type { ModalOverrides } from 'baseui/modal';
import type { IResourceFile } from '@recative/definitions';

import { ModalManager } from 'utils/hooks/useModalManager';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { server } from 'utils/rpc';

import { ResourceEditor } from '../ResourceEditor';
import { useEditableResourceDefinition } from '../hooks/useEditableResourceDefinition';
import type { IResourceEditorRef } from '../ResourceEditor';

import {
  titleOverrides,
  useLabelUpdateCallback,
} from './EditResourceGroupModal';

export interface IMergeModalProps {
  onRefreshResourceListRequest: () => void;
}

const modalBodyStyles: StyleObject = {
  maxHeight: 'calc(100% - 212px)',
  boxSizing: 'border-box',
  overflow: 'clip',
  flexGrow: 1,
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
      display: 'flex',
      flexDirection: 'column',
    },
  },
};

interface Dirtable {
  dirty?: boolean;
}

export const useEditResourceFileModal = ModalManager<string, null>(null);

const useFileModalSubmitCallback = (
  editorRef: React.RefObject<IResourceEditorRef>,
  fileLabel: string,
  onRefreshResourceListRequest: IMergeModalProps['onRefreshResourceListRequest']
) => {
  return React.useCallback(async () => {
    const file = editorRef.current?.value;

    if (!file) return;
    if (file.type === 'group') {
      throw new TypeError(`Resource is not a file, unable to edit it`);
    }

    const nextFile: IResourceFile & Dirtable = { ...file };
    nextFile.label = fileLabel;
    delete nextFile.dirty;

    await server.updateOrInsertResources([nextFile]);

    onRefreshResourceListRequest();
  }, [editorRef, fileLabel, onRefreshResourceListRequest]);
};

const InternalEditResourceFileModal: React.FC<IMergeModalProps> = ({
  onRefreshResourceListRequest,
}) => {
  const editorRef = React.useRef<IResourceEditorRef>(null);
  const [css] = useStyletron();

  const [isOpen, fileId, , onClose] = useEditResourceFileModal();
  const { files } = useEditableResourceDefinition(isOpen, fileId);

  const file = files[0];

  const databaseLocked = useDatabaseLocked();
  const [resourceLabel, handleResourceLabelUpdate] =
    useLabelUpdateCallback(file);
  const handleFileModalSubmit = useFileModalSubmitCallback(
    editorRef,
    resourceLabel,
    onRefreshResourceListRequest
  );

  const handleSubmitClick = useEvent(async () => {
    await handleFileModalSubmit();
    onClose();
  });

  React.useEffect(() => {
    if (isOpen && !editorRef.current?.value) {
      editorRef.current?.setValue(file);
    }

    if (!isOpen) {
      editorRef.current?.setValue(null);
    }
  }, [file, isOpen]);

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
        <RecativeBlock className={css(mainContentStyles)}>
          <ResourceEditor ref={editorRef} />
        </RecativeBlock>
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
