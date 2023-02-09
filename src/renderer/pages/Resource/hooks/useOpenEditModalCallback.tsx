import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';

import { useBatchEditModal } from '../components/BatchEditModal';
import { useEditResourceFileModal } from '../components/EditResourceFileModal';
import { useEditResourceGroupModal } from '../components/EditResourceGroupModal';

import { getSelectedId } from '../utils/getSelectedId';

export const useOpenEditModalCallback = () => {
  const [, , openEditResourceFileModal] = useEditResourceFileModal();
  const [, , openEditResourceGroupModal] = useEditResourceGroupModal();
  const [, , openBatchEditModal] = useBatchEditModal();

  const handleOpenEditModal = useEvent(async () => {
    const selectedResourceIds = getSelectedId();

    if (selectedResourceIds.length !== 1) {
      openBatchEditModal(getSelectedId());
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
  });

  return handleOpenEditModal;
};
