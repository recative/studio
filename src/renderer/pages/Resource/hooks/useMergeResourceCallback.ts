import * as React from 'react';

import type {
  IGroupTypeResourceTag,
  IResourceItem,
} from '@recative/definitions';

import { ModalManager } from 'utils/hooks/useModalManager';
import { server } from 'utils/rpc';

import { atom, useAtom } from 'jotai';
import { getGroupType } from '../utils/getGroupType';
import { getSelectedId } from '../utils/getSelectedId';
import { useErrorMergeModal } from '../components/ErrorMergeModal';

export const useGroupTypeSelectionModal = ModalManager<
  IGroupTypeResourceTag[],
  null
>(null);

const itemsInGroupAtom = atom<string[]>([]);

export const useMergeResourcesCallback = () => {
  const [, , openErrorMergeModal, closeErrorMergeModal] = useErrorMergeModal();
  const [, , openGroupTypeModal, closeGroupTypeModal] =
    useGroupTypeSelectionModal();

  const [itemsInGroup, setItemsInGroup] = useAtom(itemsInGroupAtom);

  const promptGroupType = React.useCallback(
    async (itemIds = getSelectedId(), promptIfFailed = true) => {
      const { flatten } = await server.listFlattenResource(itemIds);

      const groupTypeParsingResult = getGroupType(flatten);

      if (groupTypeParsingResult.error) {
        setItemsInGroup([]);
        if (promptIfFailed) {
          closeGroupTypeModal();
          void openErrorMergeModal(groupTypeParsingResult.error);
        }
      } else {
        setItemsInGroup(itemIds);
        void openGroupTypeModal(
          groupTypeParsingResult.types as IGroupTypeResourceTag[]
        );
        closeErrorMergeModal();
      }
    },
    [
      closeErrorMergeModal,
      closeGroupTypeModal,
      openErrorMergeModal,
      openGroupTypeModal,
      setItemsInGroup,
    ]
  );

  const handleFileUploadFinished = React.useCallback(
    (files: IResourceItem[]) => {
      if (files.length < 2) return;

      if (files.every((x) => x.type === 'group' || x.resourceGroupId)) return;

      void promptGroupType(
        files.map((x) => x.id),
        false
      );
    },
    [promptGroupType]
  );

  const groupFiles = async (x: IGroupTypeResourceTag) => {
    if (x) {
      void server.mergeResources(itemsInGroup, x);
      closeGroupTypeModal();
    }
  };

  return {
    handleFileUploadFinished,
    promptGroupType,
    groupFiles,
  };
};
