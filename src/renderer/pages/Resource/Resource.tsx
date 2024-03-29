import * as React from 'react';
import cn from 'classnames';
import Selecto from 'react-selecto';
import type { OnSelect, OnScroll } from 'react-selecto';

import useConstant from 'use-constant';
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
import { useEvent } from 'utils/hooks/useEvent';
import { useKeyPressed } from 'utils/hooks/useKeyPressed';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { Uploader } from './components/Uploader';
import { SidePanel } from './components/SidePanel';
import { SELECTED_TAGS } from './components/ResourceTree';
import { BatchEditModal } from './components/BatchEditModal';
import { ErrorMergeModal } from './components/ErrorMergeModal';
import { SEARCH_TERM_ATOM } from './components/SearchBar';
import { ReplaceFileModal } from './components/ReplaceFileModal';
import { ConfirmSplitModal } from './components/ConfirmSplitModal';
import { ConfirmRemoveModal } from './components/ConfirmRemoveModal';
import { EditResourceFileModal } from './components/EditResourceFileModal';
import { EditResourceGroupModal } from './components/EditResourceGroupModal';
import { GroupTypeSelectionModal } from './components/GroupTypeSelectionModal';
import { AlreadyInGroupAlertModal } from './components/AlreadyInGroupAlertModal';
import { EraseURLModal, useEraseURLModal } from './components/EraseURLModal';
import {
  useFixResourceModal,
  FixResourceLinkModal,
} from './components/FixResourceLinkModal';

import { useAdditionalTabs } from './hooks/useAdditionalTabs';
import { useMergeResourcesCallback } from './hooks/useMergeResourceCallback';
import { LayoutBooster } from './utils/LayoutBooster';
import { DragAreaPainter } from './utils/DargAreaPainter';
import { useOpenEditModalCallback } from './hooks/useOpenEditModalCallback';

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
  maxWidth: '100vw',
  userSelect: 'none',
};

const SCROLL_CONTAINER_STYLES: StyleObject = {
  gridArea: 'main',
  width: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
};

const TREE_CONTAINER_STYLES: StyleObject = {
  overflowY: 'scroll',
};

const SELECTABLE_TARGETS = ['.explorer-item'];

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
            x.classList.add('resource-selected');
          } else {
            x.classList.remove('resource-selected');
          }
        });

        return;
      }

      lastSelectedRef.current = event.added[
        event.selected.length - 1
      ] as HTMLDivElement;

      event.added.forEach((el) => {
        el.classList.add('resource-selected');
      });

      event.removed.forEach((el) => {
        el.classList.remove('resource-selected');
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

      if (selectedTags?.[0].isGhost) {
        currentResources = await server.filterGhostFiles();
      } else if (selectedTags?.[0].tags) {
        currentResources = await server.filterResourceByTag(
          selectedTags[0].tags,
          searchTerm
        );
      } else if (selectedTags?.[0].episodeIds) {
        currentResources = await server.filterResourceByEpisodeId(
          selectedTags[0].episodeIds,
          searchTerm
        );
      } else if (selectedTags?.[0].preloadLevel) {
        currentResources = await server.filterResourcePreloadLevel(
          selectedTags[0].preloadLevel,
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

  const { handleFileUploadFinished } = useMergeResourcesCallback();

  const handleOpenEditModal = useOpenEditModalCallback();

  const databaseLocked = useDatabaseLocked();

  const [searchTerm] = useAtom(SEARCH_TERM_ATOM);

  const { resources, updateResources, showSpinner } = useResources(searchTerm);

  const selectoRef = React.useRef<{ selecto: Selecto } | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const { controlPressed, handleSelectoSelect } = useKeyboardShortcut();

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

  const layoutBooster = useConstant(
    () => new LayoutBooster(SELECTABLE_TARGETS[0], '.scroll-container', 160, 16)
  );

  const getElementPoints = useEvent((target: HTMLElement | SVGElement) => {
    const info = layoutBooster.getElementRect(target);

    return [info.pos1, info.pos2, info.pos4, info.pos3];
  });

  const dragAreaPainterRef = React.useRef<DragAreaPainter | null>(null);

  if (selectoRef.current) {
    selectoRef.current.selecto.getElementPoints = getElementPoints;
  }

  if (!dragAreaPainterRef.current && selectoRef.current) {
    dragAreaPainterRef.current = new DragAreaPainter(
      // @ts-ignore: The typing provided by selecto is incorrect.
      selectoRef.current.selecto,
      '.scroll-container'
    );

    dragAreaPainterRef.current.syncCanvasSize();
  }

  const onSelectoScroll = useEvent((event: OnScroll) => {
    scrollerRef.current?.scrollBy(
      event.direction[0] * 10,
      event.direction[1] * 10
    );

    layoutBooster.handleContainerScroll();
  });

  const onContainerScroll = useEvent(() => {
    selectoRef.current?.selecto.checkScroll();
    layoutBooster.handleContainerScroll();
  });

  const handleWindowResize = useDebouncedCallback(
    (updateElements = false) => {
      layoutBooster.updateContainerSize();
      layoutBooster.updateGridAnchors();

      if (updateElements) {
        layoutBooster.updateElements();
      }

      const painter = dragAreaPainterRef.current;

      if (painter) {
        painter.syncCanvasSize();
      }
    },
    [layoutBooster],
    300,
    500
  );

  React.useEffect(() => {
    handleWindowResize(true);
  }, [handleWindowResize, resources]);

  React.useEffect(() => {
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleWindowResize]);

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
          className={cn(css(SCROLL_CONTAINER_STYLES), 'scroll-container')}
          ref={scrollerRef}
          onScroll={onContainerScroll}
        >
          <Selecto
            // @ts-ignore: The type definition provided by Selecto is incorrect
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
            getElementRect={layoutBooster.getElementRect}
          />
          <RecativeBlock
            className={cn('resource-list', css(CONTENT_CONTAINER_STYLES))}
          >
            {resources?.map((item, index) => (
              <RecativeBlock
                display="inline-block !important"
                key={item.id}
                verticalAlign="top"
                onDoubleClick={handleOpenEditModal}
              >
                <ResourceItem
                  id={item.id}
                  index={index}
                  isGroup={item.type === 'group'}
                  isManaged={item.type === 'file' && !!item.managedBy}
                  fileName={item.label}
                  thumbnailSrc={item.thumbnailSrc}
                />
              </RecativeBlock>
            ))}
          </RecativeBlock>
        </div>
      </RecativeBlock>
      <EraseURLModal />
      <ErrorMergeModal />
      <FixResourceLinkModal />
      <AlreadyInGroupAlertModal onCancel={null} onSubmit={null} />
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
