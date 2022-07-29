import * as React from 'react';

import type { IGroupTypeResourceTag } from '@recative/definitions';
import { server } from 'utils/rpc';

import { getGroupType } from '../utils/getGroupType';
import { getSelectedId } from '../utils/getSelectedId';

export const useMergeResourcesCallback = () => {
  const [openPromptGroupTypeModal, setOpenGroupTypeModal] =
    React.useState(false);
  const [parsingGroupTypeFailed, setParsingGroupTypeFailed] =
    React.useState(false);
  const [candidateGroupTypes, setCandidateGroupTypes] = React.useState<
    IGroupTypeResourceTag[]
  >([]);
  const [parsingGroupTypeError, setParsingGroupTypeError] = React.useState('');
  const [itemsInGroup, setItemsInGroup] = React.useState<string[]>([]);

  const promptGroupType = React.useCallback(
    async (itemIds = getSelectedId(), promptIfFailed = true) => {
      const { flatten } = await server.listFlattenResource(itemIds);

      const groupTypeParsingResult = getGroupType(flatten);

      if (groupTypeParsingResult.error) {
        setParsingGroupTypeFailed(true);
        setItemsInGroup([]);
        if (promptIfFailed) {
          setOpenGroupTypeModal(true);
          setParsingGroupTypeError(groupTypeParsingResult.error);
        }
      } else {
        setItemsInGroup(itemIds);
        setParsingGroupTypeFailed(false);
        setOpenGroupTypeModal(true);
        setParsingGroupTypeError('');
        setCandidateGroupTypes(
          groupTypeParsingResult.types as IGroupTypeResourceTag[]
        );
      }
    },
    []
  );

  const groupFiles = async (x: IGroupTypeResourceTag) => {
    if (x) {
      server.mergeResources(itemsInGroup, x);
      setOpenGroupTypeModal(false);
    }
  };

  const closePromptGroupTypeModal = React.useCallback(() => {
    setOpenGroupTypeModal(false);
    setCandidateGroupTypes([]);
    setParsingGroupTypeError('');
    setParsingGroupTypeFailed(false);
  }, []);

  return {
    openPromptGroupTypeModal,
    closePromptGroupTypeModal,
    parsingGroupTypeError,
    parsingGroupTypeFailed,
    candidateGroupTypes,
    promptGroupType,
    groupFiles,
  };
};
