import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [ConfirmSyncPermissionModal, useConfirmSyncPermissionModal] =
  SimpleModalFactory<unknown>(
    'Sync Permission',
    'Are you sure you want to perform this operation? It will ensure that all permission configuration for each episode is available.',
    'Sync',
    'Cancel'
  );
