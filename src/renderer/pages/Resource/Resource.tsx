import * as React from 'react';
import cn from 'classnames';
import Selecto from 'react-selecto';
import type { OnSelect, OnScroll } from 'react-selecto';

import { useAtom } from 'jotai';
import { useStyletron } from 'baseui';
import { useDebouncedCallback, useKeyboardEvent } from '@react-hookz/web';

import type { StyleObject } from 'styletron-react';

import { Tab } from 'baseui/tabs-motion';
import { RecativeBlock } from 'components/Block/Block';
import { Search } from 'baseui/icon';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { TabTitle, Separator } from 'components/Layout/Pivot';
import { Resource as ResourceItem } from 'components/ResourceExplorer/Resource';

import { FixIconOutline } from 'components/Icons/FixIconOutline';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { SplitIconOutline } from 'components/Icons/SplitIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';
import { MergeIconOutline } from 'components/Icons/MergeIconOutline';
import { EraserIconOutline } from 'components/Icons/EraserIconOutline';
import { ReplaceIconOutline } from 'components/Icons/ReplaceIconOutline';
import { MetadataIconOutline } from 'components/Icons/MetadataIconOutline';

import type {
  IEditableResourceFile,
  IResourceItem,
  IResourceGroup,
} from '@recative/definitions';
import { server } from 'utils/rpc';
import { useKeyPressed } from 'utils/hooks/useKeyPressed';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { PIVOT_TAB_OVERRIDES } from 'utils/style/tab';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

import { Uploader } from './components/Uploader';
import { EraseURLModal } from './components/EraseURLModal';
import { BatchEditModal } from './components/BatchEditModal';
import { ErrorSplitModal } from './components/ErrorSplitModal';
import { ReplaceFileModal } from './components/ReplaceFileModal';
import { ConfirmSplitModal } from './components/ConfirmSplitModal';
import { ConfirmRemoveModal } from './components/ConfirmRemoveModal';
import { FixResourceLinkModal } from './components/FixResourceLinkModal';
import { EditResourceFileModal } from './components/EditResourceFileModal';
import { EditResourceGroupModal } from './components/EditResourceGroupModal';
import { GroupTypeSelectionModal } from './components/GroupTypeSelectionModal';
import { ResourceTree, SELECTED_TAGS } from './components/ResourceTree';

import { getSelectedId } from './utils/getSelectedId';
import { useMergeResourcesCallback } from './hooks/useMergeResourceCallback';

import { IEditOperation } from '../../../utils/BatchEditTypes';

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
  const [filesInGroup, setFilesInGroup] = React.useState<
    IEditableResourceFile[]
  >([]);
  const [groupOfModal, setGroupOfModal] = React.useState<IResourceGroup | null>(
    null
  );
  const [mode, setMode] = React.useState<
    'edit-group' | 'edit-file' | 'create-group' | null
  >(null);

  const handleOpenEditModal = React.useCallback(async () => {
    const selectedResourceIds = getSelectedId();

    if (selectedResourceIds.length !== 1) {
      handleOpenBatchEditModal();
      return;
    }

    const selectedResourceId = selectedResourceIds[0];

    if (!selectedResourceId) return;

    const queryResult = await server.getResourceWithDetailedFileList(
      selectedResourceId
    );

    if (!queryResult) return;

    const { group, files } = queryResult;

    setFilesInGroup(
      files.map((file) => ({
        ...file,
        dirty: false,
      })) as IEditableResourceFile[]
    );

    setGroupOfModal(group);
    setMode(group ? 'edit-group' : 'edit-file');
  }, [handleOpenBatchEditModal]);

  const handleCloseModal = React.useCallback(() => {
    setFilesInGroup([]);
    setGroupOfModal(null);
    setMode(null);
  }, []);

  return {
    filesInGroup,
    groupOfModal,
    modalMode: mode,
    handleOpenEditModal,
    handleCloseModal,
  };
};

const useRemoveResourceCallback = () => {
  const [resourceIds, setResourceIds] = React.useState<string[]>([]);
  const [removeModalOpen, setRemoveModalOpen] = React.useState<boolean>(false);
  const [isHardRemove, setIsHardRemove] = React.useState<boolean>(false);
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const shiftPressed = useKeyPressed('Shift');

  const handleRemoveResourceModalOpen = React.useCallback(() => {
    const selectedResourceIds = getSelectedId();
    setResourceIds(selectedResourceIds);
    setIsHardRemove(shiftPressed);
    setRemoveModalOpen(true);
  }, [shiftPressed]);

  const handleRemoveResourceModalClose = React.useCallback(() => {
    setResourceIds([]);
    setIsHardRemove(false);
    setRemoveModalOpen(false);
  }, []);

  const handleRemoveResourceConfirmed = React.useCallback(async () => {
    if (!workspaceConfiguration) return;
    server.removeResources(resourceIds, isHardRemove);
    handleRemoveResourceModalClose();
  }, [
    resourceIds,
    isHardRemove,
    workspaceConfiguration,
    handleRemoveResourceModalClose,
  ]);

  useKeyboardEvent('Delete', handleRemoveResourceModalOpen);

  return {
    isHardRemove,
    removeModalOpen,
    handleRemoveResourceModalOpen,
    handleRemoveResourceModalClose,
    handleRemoveResourceConfirmed,
  };
};

const useSplitModalCallback = () => {
  const [splitModalOpen, setSplitModalOpen] = React.useState(false);

  const handleOpenSplitModal = React.useCallback(() => {
    setSplitModalOpen(true);
  }, []);

  const handleCloseSplitModal = React.useCallback(() => {
    setSplitModalOpen(false);
  }, []);

  const handleSplitGroups = React.useCallback(async () => {
    const selectedIds = getSelectedId();
    if (selectedIds.length) {
      await server.splitGroup(getSelectedId());
    }
  }, []);

  return {
    splitModalOpen,
    handleOpenSplitModal,
    handleCloseSplitModal,
    handleSplitGroups,
  };
};

const useFixLinkModalState = () => {
  const [showFixResourceModal, setShowFixResourceModal] = React.useState(false);

  const handleShowFixResourceModalButtonClick = React.useCallback(() => {
    setShowFixResourceModal(true);
  }, []);

  const handleFixResourceModalClose = React.useCallback(() => {
    setShowFixResourceModal(false);
  }, []);

  return {
    showFixResourceModal,
    handleShowFixResourceModalButtonClick,
    handleFixResourceModalClose,
  };
};

const useEraseURLState = () => {
  const [showEraseURLModal, setEraseURLModal] = React.useState(false);

  const handleShowEraseURLModalButtonClick = React.useCallback(() => {
    setEraseURLModal(true);
  }, []);

  const handleEraseURLModalClose = React.useCallback(() => {
    setEraseURLModal(false);
  }, []);

  return {
    showEraseURLModal,
    handleShowEraseURLModalButtonClick,
    handleEraseURLModalClose,
  };
};

const useBatchEditModalState = () => {
  const [showBatchEditModal, setShowBatchEditModal] = React.useState(false);

  const [selectedResources, setSelectedResources] = React.useState<string[]>(
    []
  );

  const handleShowBatchEditModalClick = React.useCallback(() => {
    setShowBatchEditModal(true);
    setSelectedResources(getSelectedId());
  }, []);

  const handleBatchEditModalClose = React.useCallback(() => {
    setShowBatchEditModal(false);
  }, []);

  const handleBatchEditModalSubmit = React.useCallback(
    (x: IEditOperation[]) => {
      server.batchUpdateResource(selectedResources, x);
      setShowBatchEditModal(false);
    },
    [selectedResources]
  );

  return {
    showBatchEditModal,
    handleShowBatchEditModalClick,
    handleBatchEditModalClose,
    handleBatchEditModalSubmit,
  };
};

const useReplaceFileModalState = () => {
  const [showReplaceFileModal, setShowReplaceFileModal] = React.useState(false);

  const [selectedResourceToReplace, setSelectedResource] = React.useState<
    string | undefined
  >(undefined);
  const [multipleFileError, setMultipleFileError] =
    React.useState<boolean>(false);

  const handleReplaceFileModalOpen = React.useCallback(() => {
    const files = getSelectedId();

    setMultipleFileError(files.length > 1);
    setSelectedResource(files[0]);
    setShowReplaceFileModal(true);
  }, []);

  const handleReplaceFileModalClose = React.useCallback(() => {
    setShowReplaceFileModal(false);
    setSelectedResource(undefined);
    setMultipleFileError(false);
  }, []);

  return {
    showReplaceFileModal,
    selectedResourceToReplace,
    multipleFileError,
    handleReplaceFileModalOpen,
    handleReplaceFileModalClose,
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

const useSearchCallback = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSearchTerm(event.target.value);
    },
    []
  );

  return { searchTerm, handleSearchInputChange };
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
  }, [updateResources]);

  return { resources, updateResources, showSpinner };
};

const InternalResource: React.FC = () => {
  const [css] = useStyletron();

  const {
    splitModalOpen,
    handleOpenSplitModal,
    handleCloseSplitModal,
    handleSplitGroups,
  } = useSplitModalCallback();

  const {
    openPromptGroupTypeModal,
    closePromptGroupTypeModal,
    parsingGroupTypeFailed,
    parsingGroupTypeError,
    candidateGroupTypes,
    promptGroupType,
    groupFiles,
  } = useMergeResourcesCallback();

  const {
    showBatchEditModal,
    handleShowBatchEditModalClick,
    handleBatchEditModalClose,
    handleBatchEditModalSubmit,
  } = useBatchEditModalState();

  const {
    filesInGroup,
    groupOfModal,
    modalMode,
    handleOpenEditModal,
    handleCloseModal,
  } = useEditModalCallback(handleShowBatchEditModalClick);

  const {
    isHardRemove,
    removeModalOpen,
    handleRemoveResourceModalOpen,
    handleRemoveResourceModalClose,
    handleRemoveResourceConfirmed,
  } = useRemoveResourceCallback();

  const {
    showFixResourceModal,
    handleShowFixResourceModalButtonClick,
    handleFixResourceModalClose,
  } = useFixLinkModalState();

  const {
    showEraseURLModal,
    handleShowEraseURLModalButtonClick,
    handleEraseURLModalClose,
  } = useEraseURLState();

  const databaseLocked = useDatabaseLocked();

  const { searchTerm, handleSearchInputChange } = useSearchCallback();

  const { resources, updateResources, showSpinner } = useResources(searchTerm);

  const selectoRef = React.useRef<Selecto>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const isEditFileMode = modalMode === 'edit-file';
  const isEditGroupMode = modalMode === 'edit-group';

  const { controlPressed, shiftPressed, handleSelectoSelect } =
    useKeyboardShortcut();

  const {
    showReplaceFileModal,
    selectedResourceToReplace,
    multipleFileError,
    handleReplaceFileModalOpen,
    handleReplaceFileModalClose,
  } = useReplaceFileModalState();

  const additionalTabs = React.useMemo(
    () => (
      <Tab
        key="resource"
        title={
          <TabTitle>
            <span style={{ color: '#01579B' }}>Resource</span>
          </TabTitle>
        }
        overrides={PIVOT_TAB_OVERRIDES}
      >
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<MergeIconOutline width={20} />}
          onClick={() => promptGroupType()}
          disabled={databaseLocked}
        >
          Merge
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<SplitIconOutline width={20} />}
          onClick={handleOpenSplitModal}
          disabled={databaseLocked}
        >
          Split
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<EditIconOutline width={20} />}
          onClick={handleOpenEditModal}
        >
          Edit
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<ReplaceIconOutline width={20} />}
          onClick={handleReplaceFileModalOpen}
        >
          Replace
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<TrashIconOutline width={20} />}
          onClick={handleRemoveResourceModalOpen}
          disabled={databaseLocked}
        >
          Delete
        </Button>
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<MetadataIconOutline width={20} />}
        >
          Metadata
        </Button>
      </Tab>
    ),
    [
      databaseLocked,
      handleOpenEditModal,
      handleOpenSplitModal,
      handleRemoveResourceModalOpen,
      handleReplaceFileModalOpen,
      promptGroupType,
    ]
  );

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
            onClick={handleShowEraseURLModalButtonClick}
            disabled={databaseLocked}
          >
            Erase URL
          </Button>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<FixIconOutline width={20} />}
            onClick={handleShowFixResourceModalButtonClick}
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
          <RecativeBlock
            paddingTop="4px"
            paddingLeft="4px"
            paddingRight="4px"
            paddingBottom="4px"
          >
            <Input
              size={INPUT_SIZE.compact}
              endEnhancer={<Search size="18px" />}
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
          </RecativeBlock>
          <ResourceTree />
        </RecativeBlock>
        <RecativeBlock gridArea="upload" margin="16px">
          <Uploader
            disabled={databaseLocked}
            onProgressChange={updateResources}
            onFinished={(files) => {
              if (files.length < 2) return;

              promptGroupType(
                files.map((x) => x.id),
                false
              );
            }}
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
      <ConfirmSplitModal
        isOpen={splitModalOpen}
        onClose={handleCloseSplitModal}
        onSubmit={async () => {
          await handleSplitGroups();
          handleCloseSplitModal();
          updateResources();
        }}
      />
      <ErrorSplitModal
        isOpen={openPromptGroupTypeModal && parsingGroupTypeFailed}
        message={parsingGroupTypeError}
        onClose={closePromptGroupTypeModal}
      />
      <GroupTypeSelectionModal
        isOpen={openPromptGroupTypeModal && !parsingGroupTypeFailed}
        candidates={candidateGroupTypes}
        onSubmit={async (x) => {
          await groupFiles(x);
          updateResources();
        }}
        onClose={closePromptGroupTypeModal}
      />
      <EditResourceFileModal
        file={isEditFileMode ? filesInGroup[0] : null}
        isOpen={isEditFileMode}
        onClose={handleCloseModal}
        onSubmit={async (file, fileLabel) => {
          handleCloseModal();
          await server.updateOrInsertResources([file]);
          if (isEditFileMode) {
            await server.updateResourceLabel(file.id, fileLabel);
            updateResources();
          }
        }}
      />
      <EditResourceGroupModal
        files={isEditGroupMode ? filesInGroup : null}
        group={isEditGroupMode ? groupOfModal : null}
        isOpen={isEditGroupMode}
        onClose={handleCloseModal}
        onSubmit={async (files, groupLabel) => {
          await server.updateOrInsertResources(files);
          if (groupOfModal) {
            await server.updateResourceLabel(groupOfModal.id, groupLabel);
            await server.updateFilesOfGroup(
              groupOfModal.id,
              files.map((x) => x.id)
            );
            updateResources();
          }
        }}
        onAddResourceFile={async (resourceFile) => {
          if (groupOfModal) {
            await server.addFileToGroup(resourceFile, groupOfModal.id);
            updateResources();
          }
        }}
        onRemoveResourceFile={async (resourceFile) => {
          await server.removeFileFromGroup(resourceFile);
          updateResources();
        }}
      />
      <ConfirmRemoveModal
        isOpen={removeModalOpen}
        isHard={isHardRemove}
        onClose={handleRemoveResourceModalClose}
        onSubmit={() => {
          handleRemoveResourceConfirmed();
          updateResources();
        }}
      />
      <FixResourceLinkModal
        isOpen={showFixResourceModal}
        onClose={handleFixResourceModalClose}
      />
      <EraseURLModal
        isOpen={showEraseURLModal}
        onClose={handleEraseURLModalClose}
      />
      <BatchEditModal
        isOpen={showBatchEditModal}
        onClose={handleBatchEditModalClose}
        onSubmit={handleBatchEditModalSubmit}
      />
      <ReplaceFileModal
        multipleFileError={multipleFileError}
        fileId={selectedResourceToReplace}
        isOpen={showReplaceFileModal}
        onReplaced={updateResources}
        onClose={handleReplaceFileModalClose}
      />
    </PivotLayout>
  );
};

export const Resource = React.memo(InternalResource);
