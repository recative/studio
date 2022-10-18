import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { KIND as BUTTON_KIND } from 'baseui/button';
import { ListItem, ListItemLabel } from 'baseui/list';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalButton,
  ROLE,
  SIZE,
} from 'baseui/modal';

import { FileInput } from 'components/Input/FileInput';

import { server } from 'utils/rpc';

import { IResourceFile } from '@recative/definitions';
import { ModalManager } from 'utils/hooks/useModalManager';

export const useFixResourceModal = ModalManager<unknown, null>(null);

const useBrokenFileList = (isOpen: boolean) => {
  const [brokenFileList, brokenFileListAction] = useAsync(
    server.listBrokenResource,
    []
  );

  React.useEffect(() => {
    if (isOpen) {
      brokenFileListAction.execute();
    } else {
      brokenFileListAction.reset();
    }
  }, [isOpen, brokenFileListAction]);

  const handleFix = React.useCallback(
    async (filePath: string, resourceFile: IResourceFile) => {
      await server.replaceResourceFile(filePath, resourceFile);
      await brokenFileListAction.execute();
    },
    [brokenFileListAction]
  );

  return { brokenFileList: brokenFileList.result, handleFix };
};

export const FixResourceLinkModal: React.FC = () => {
  const [isOpen, , , onClose] = useFixResourceModal();
  const { brokenFileList, handleFix } = useBrokenFileList(isOpen);

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Fix Resource Link</ModalHeader>
      <ModalBody>
        {brokenFileList?.map((brokenFile) => (
          <ListItem
            key={brokenFile.id}
            endEnhancer={() => (
              <FileInput
                hideIcon
                hideInput
                kind={BUTTON_KIND.tertiary}
                onChange={(x) => {
                  if (brokenFile.type === 'group') return;
                  handleFix(x[0], brokenFile);
                }}
              >
                Fix
              </FileInput>
            )}
          >
            <ListItemLabel description={brokenFile.id}>
              {brokenFile.label}
            </ListItemLabel>
          </ListItem>
        ))}
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Close
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
