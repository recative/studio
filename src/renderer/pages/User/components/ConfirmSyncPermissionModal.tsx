import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [ConfirmSyncPermissionModal, useConfirmSyncPermissionModal] =
  SimpleModalFactory<unknown>(
    'Sync Permission',
    'This operation will ensure all permission configuration for each episode is available',
    'Sync',
    'Cancel'
  );
