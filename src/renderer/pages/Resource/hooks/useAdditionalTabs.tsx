import * as React from 'react';

import { Tab } from 'baseui/tabs-motion';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { TabTitle, Separator } from 'components/Layout/Pivot';

import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { SplitIconOutline } from 'components/Icons/SplitIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';
import { MergeIconOutline } from 'components/Icons/MergeIconOutline';
import { ReplaceIconOutline } from 'components/Icons/ReplaceIconOutline';
import { MetadataIconOutline } from 'components/Icons/MetadataIconOutline';

import { PIVOT_TAB_OVERRIDES } from 'utils/style/tab';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { useReplaceFileModal } from '../components/ReplaceFileModal';
import { useConfirmSplitModal } from '../components/ConfirmSplitModal';
import { useConfirmRemoveModal } from '../components/ConfirmRemoveModal';
import { useEditResourceFileModal } from '../components/EditResourceFileModal';
import { useMergeResourcesCallback } from './useMergeResourceCallback';
import { getSelectedId } from '../utils/getSelectedId';

export const useAdditionalTabs = () => {
  const databaseLocked = useDatabaseLocked();
  const { promptGroupType } = useMergeResourcesCallback();

  const [, , handleOpenSplitModal] = useConfirmSplitModal();
  const [, , handleOpenEditModal] = useEditResourceFileModal();
  const [, , handleReplaceFileModalOpen] = useReplaceFileModal();
  const [, , handleRemoveResourceModalOpen] = useConfirmRemoveModal();

  return React.useMemo(
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
          onClick={() => handleOpenEditModal(getSelectedId()[0])}
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
};
