import * as React from 'react';

import { useStyletron } from 'baseui';

import type { StyleObject } from 'styletron-standard';

import { Tab } from 'baseui/tabs-motion';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { SplitIconOutline } from 'components/Icons/SplitIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';
import { MergeIconOutline } from 'components/Icons/MergeIconOutline';
import { ReplaceIconOutline } from 'components/Icons/ReplaceIconOutline';
import { MetadataIconOutline } from 'components/Icons/MetadataIconOutline';
import { TabTitle, Separator } from 'components/Layout/Pivot';

import { useEvent } from 'utils/hooks/useEvent';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { PIVOT_TAB_OVERRIDES } from 'utils/style/tab';

import { useOpenEditModalCallback } from './useOpenEditModalCallback';
import { useMergeResourcesCallback } from './useMergeResourceCallback';

import { useReplaceFileModal } from '../components/ReplaceFileModal';
import { useConfirmSplitModal } from '../components/ConfirmSplitModal';
import { useConfirmRemoveModal } from '../components/ConfirmRemoveModal';

const pivotTitleStyles: StyleObject = {
  color: '#01579B',
};

export const useAdditionalTabs = () => {
  const [css] = useStyletron();
  const databaseLocked = useDatabaseLocked();
  const { promptGroupType } = useMergeResourcesCallback();

  const [, , handleOpenSplitModal] = useConfirmSplitModal();
  const [, , handleReplaceFileModalOpen] = useReplaceFileModal();
  const [, , handleRemoveResourceModalOpen] = useConfirmRemoveModal();

  const handleOpenEditModal = useOpenEditModalCallback();

  const handleMergeButtonClick = useEvent(() => promptGroupType());

  return React.useMemo(
    () => (
      <Tab
        key="resource"
        title={
          <TabTitle>
            <span className={css(pivotTitleStyles)}>Resource</span>
          </TabTitle>
        }
        overrides={PIVOT_TAB_OVERRIDES}
      >
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<MergeIconOutline width={20} />}
          onClick={handleMergeButtonClick}
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
      css,
      databaseLocked,
      handleMergeButtonClick,
      handleOpenEditModal,
      handleOpenSplitModal,
      handleRemoveResourceModalOpen,
      handleReplaceFileModalOpen,
    ]
  );
};
