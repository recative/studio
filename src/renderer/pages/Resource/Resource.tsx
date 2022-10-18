import * as React from 'react';
import cn from 'classnames';
import Selecto from 'react-selecto';
import type { OnSelect, OnScroll } from 'react-selecto';

import { useAtom } from 'jotai';
import { useStyletron } from 'baseui';
import { useDebouncedCallback } from '@react-hookz/web';

import type { StyleObject } from 'styletron-react';

import type { IResourceItem } from '@recative/definitions';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { Resource as ResourceItem } from 'components/ResourceExplorer/Resource';

import { FixIconOutline } from 'components/Icons/FixIconOutline';
import { EraserIconOutline } from 'components/Icons/EraserIconOutline';

import { server } from 'utils/rpc';
import { useKeyPressed } from 'utils/hooks/useKeyPressed';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { Uploader } from './components/Uploader';
import { SidePanel } from './components/SidePanel';
import { SELECTED_TAGS } from './components/ResourceTree';
import { ErrorMergeModal } from './components/ErrorMergeModal';
import { ReplaceFileModal } from './components/ReplaceFileModal';
import { ConfirmSplitModal } from './components/ConfirmSplitModal';
import { ConfirmRemoveModal } from './components/ConfirmRemoveModal';
import { GroupTypeSelectionModal } from './components/GroupTypeSelectionModal';
import { EraseURLModal, useEraseURLModal } from './components/EraseURLModal';
import { BatchEditModal, useBatchEditModal } from './components/BatchEditModal';
import {
  useFixResourceModal,
  FixResourceLinkModal,
} from './components/FixResourceLinkModal';
import {
  EditResourceFileModal,
  useEditResourceFileModal,
} from './components/EditResourceFileModal';
import {
  EditResourceGroupModal,
  useEditResourceGroupModal,
} from './components/EditResourceGroupModal';

import { getSelectedId } from './utils/getSelectedId';
import { useMergeResourcesCallback } from './hooks/useMergeResourceCallback';

import { useAdditionalTabs } from './hooks/useAdditionalTabs';
import { SEARCH_TERM_ATOM } from './components/SearchBar';

const TAB_COLORS = [{ key: 'resource', color: '#01579B' }];

const MAIN_CONTAINER_STYLES: StyleObject = {
  width: '100%',
  height: 'calc(100vh - 164px)',
  overflowX: 'clip',
  overflowY: 'clip',
  display: 'grid',
  gridTemplate: `"tree main" 1fr
                 "upload main" min-content
                 / min-content auto`,
  position: 'relative',
};

const CONTENT_CONTAINER_STYLES: StyleObject = {
  display: 'flex',
  flexWrap: 'wrap',
  maxWidth: '100vw',
  userSelect: 'none',
};

const SCROLL_CONTAINER_STYLES: StyleObject = {
  gridArea: 'main',
  maxHeight: '100%',
  overflowY: 'auto',
};

const TREE_CONTAINER_STYLES: StyleObject = {
  overflowY: 'scroll',
};

const SELECTABLE_TARGETS = ['.explorer-item'];

const useEditModalCallback = (handleOpenBatchEditModal: () => void) => {
  const [, , openEditResourceFileModal] = useEditResourceFileModal();
  const [, , openEditResourceGroupModal] = useEditResourceGroupModal();

  const handleOpenEditModal = React.useCallback(async () => {
    const selectedResourceIds = getSelectedId();

    if (selectedResourceIds.length !== 1) {
      handleOpenBatchEditModal();
      return;
    }

    const selectedResourceId = selectedResourceIds[0];

    if (!selectedResourceId) return;

    const queryResult = await server.getResource(selectedResourceId);

    if (!queryResult) return;

    if (queryResult.type === 'group') {
      openEditResourceGroupModal(selectedResourceId);
    } else if (queryResult.type === 'file') {
      openEditResourceFileModal(selectedResourceId);
    }
  }, [
    handleOpenBatchEditModal,
    openEditResourceFileModal,
    openEditResourceGroupModal,
  ]);

  return {
    handleOpenEditModal,
  };
};

const getIndexMap = () => {
  const allElements = document.querySelectorAll(SELECTABLE_TARGETS[0]);
  const reverseMap = new Map<HTMLDivElement, number>();

  allElements.forEach((element, index) => {
    reverseMap.set(element as HTMLDivElement, index);
  });

  return { allElements, reverseMap };
};

const getMaxIndexElementFromOfResourceItems = (
  indexMap: ReturnType<typeof getIndexMap>,
  ...elements: HTMLDivElement[]
) => {
  const elementIndexes = elements.map((x) => indexMap.reverseMap.get(x) ?? -1);

  const maxIndex = Math.max(...elementIndexes);

  return indexMap.allElements[maxIndex] as HTMLDivElement;
};

const useKeyboardShortcut = () => {
  const controlPressed = useKeyPressed('Control');
  const shiftPressed = useKeyPressed('Shift');

  const lastSelectedRef = React.useRef<HTMLDivElement | null>(null);

  const handleSelectoSelect = React.useCallback(
    (event: OnSelect) => {
      const indexMap = getIndexMap();
      const lastSelected = getMaxIndexElementFromOfResourceItems(
        indexMap,
        ...(event.added as HTMLDivElement[]),
        ...(event.removed as HTMLDivElement[])
      );

      if (shiftPressed) {
        lastSelectedRef.current = lastSelected;
        if (!lastSelectedRef.current) return;

        const indexA = indexMap.reverseMap.get(lastSelected) || -1;
        const indexB = indexMap.reverseMap.get(lastSelectedRef.current) || -1;

        if (indexA === -1 || indexB === -1) {
          return;
        }

        const minIndex = Math.min(indexA, indexB);
        const maxIndex = Math.max(indexA, indexB);

        // Mark all elements between minIndex and maxIndex as selected
        indexMap.allElements.forEach((x, index) => {
          if (index >= minIndex && index <= maxIndex) {
            x.classList.add('selected');
          } else {
            x.classList.remove('selected');
          }
        });

        return;
      }

      lastSelectedRef.current = event.added[
        event.selected.length - 1
      ] as HTMLDivElement;

      event.added.forEach((el) => {
        el.classList.add('selected');
      });

      event.removed.forEach((el) => {
        el.classList.remove('selected');
      });

      lastSelectedRef.current = lastSelected;
    },
    [shiftPressed]
  );

  return { controlPressed, shiftPressed, handleSelectoSelect };
};

const useResources = (searchTerm: string) => {
  const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
  const [selectedTags] = useAtom(SELECTED_TAGS);
  const [resources, setResources] = React.useState<IResourceItem[] | null>(
    null
  );

  const updateResources = useDebouncedCallback(
    async () => {
      let currentResources: IResourceItem[];

      if (selectedTags?.[0].tags) {
        currentResources = await server.filterResourceByTag(
          selectedTags[0].tags,
          searchTerm
        );
      } else if (selectedTags?.[0].episodeIds) {
        currentResources = await server.filterResourceByEpisodeId(
          selectedTags[0].episodeIds,
          searchTerm
        );
      } else {
        currentResources = await server.listAllResources(true, searchTerm);
      }

      setResources(currentResources);
      setShowSpinner(false);
    },
    [setResources, selectedTags, searchTerm],
    300,
    500
  );

  React.useLayoutEffect(() => {
    setShowSpinner(true);
    updateResources();
  }, [updateResources, selectedTags]);

  return { resources, updateResources, showSpinner };
};

const InternalResource: React.FC = () => {
  const [css] = useStyletron();

  const additionalTabs = useAdditionalTabs();

  const [, , openFixLinkModal] = useFixResourceModal();
  const [, , openEraseURLModal] = useEraseURLModal();
  const [, , openBatchEditModal] = useBatchEditModal();

  const { handleFileUploadFinished } = useMergeResourcesCallback();

  const { handleOpenEditModal } = useEditModalCallback(openBatchEditModal);

  const databaseLocked = useDatabaseLocked();

  const [searchTerm] = useAtom(SEARCH_TERM_ATOM);

  const { resources, updateResources, showSpinner } = useResources(searchTerm);

  const selectoRef = React.useRef<Selecto>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const { controlPressed, shiftPressed, handleSelectoSelect } =
    useKeyboardShortcut();

  const onContainerScroll = React.useCallback(() => {
    selectoRef.current?.checkScroll?.();
  }, []);

  const $scroller = scrollerRef.current;

  const scrollOptions = React.useMemo(
    () =>
      $scroller
        ? {
            container: $scroller,
            throttleTime: 30,
            threshold: 0,
          }
        : undefined,
    [$scroller]
  );

  const onSelectoScroll = React.useCallback((event: OnScroll) => {
    scrollerRef.current?.scrollBy(
      event.direction[0] * 10,
      event.direction[1] * 10
    );
  }, []);

  return (
    <PivotLayout
      tabColors={TAB_COLORS}
      additionalTabs={additionalTabs}
      footer={
        <>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<EraserIconOutline width={20} />}
            onClick={openEraseURLModal}
            disabled={databaseLocked}
          >
            Erase URL
          </Button>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<FixIconOutline width={20} />}
            onClick={openFixLinkModal}
            disabled={databaseLocked}
          >
            Fix Link
          </Button>
        </>
      }
    >
      <RecativeBlock className={css(MAIN_CONTAINER_STYLES)}>
        <RecativeBlock position="fixed" top="116px" right="20px">
          {showSpinner ? <Spinner $size={SPINNER_SIZE.small} /> : null}
        </RecativeBlock>
        <RecativeBlock
          className={css(TREE_CONTAINER_STYLES)}
          gridArea="tree"
          maxHeight="calc(100vh - 320px)"
        >
          <SidePanel onRefreshResourceListRequest={updateResources} />
        </RecativeBlock>
        <RecativeBlock
          gridArea="upload"
          marginLeft="16px"
          marginRight="16px"
          marginTop="16px"
        >
          <Uploader
            disabled={databaseLocked}
            onProgressChange={updateResources}
            onFinished={handleFileUploadFinished}
          />
        </RecativeBlock>
        <div
          className={css(SCROLL_CONTAINER_STYLES)}
          ref={scrollerRef}
          onScroll={onContainerScroll}
        >
          <Selecto
            ref={selectoRef}
            ratio={0}
            hitRate={0}
            selectByClick
            selectFromInside
            dragContainer=".resource-list"
            continueSelect={controlPressed}
            selectableTargets={SELECTABLE_TARGETS}
            onSelectEnd={handleSelectoSelect}
            onScroll={onSelectoScroll}
            scrollOptions={scrollOptions}
          />
          <RecativeBlock
            className={cn('resource-list', css(CONTENT_CONTAINER_STYLES))}
          >
            {resources?.map((item) => (
              <div key={item.id} onDoubleClick={handleOpenEditModal}>
                <ResourceItem
                  id={item.id}
                  isGroup={item.type === 'group'}
                  fileName={item.label}
                  thumbnailSrc={item.thumbnailSrc}
                />
              </div>
            ))}
          </RecativeBlock>
        </div>
      </RecativeBlock>
      <EraseURLModal />
      <ErrorMergeModal />
      <FixResourceLinkModal />
      <BatchEditModal onRefreshResourceListRequest={updateResources} />
      <ReplaceFileModal onRefreshResourceListRequest={updateResources} />
      <ConfirmSplitModal onRefreshResourceListRequest={updateResources} />
      <ConfirmRemoveModal onRefreshResourceListRequest={updateResources} />
      <EditResourceFileModal onRefreshResourceListRequest={updateResources} />
      <EditResourceGroupModal onRefreshResourceListRequest={updateResources} />
      <GroupTypeSelectionModal onRefreshResourceListRequest={updateResources} />
    </PivotLayout>
  );
};

export const Resource = React.memo(InternalResource);
