import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [ConfirmRemovePermissionModal, useConfirmRemovePermissionModal] =
  SimpleModalFactory<string>(
    'Remove Permission',
    'Are you sure you want to remove this permission? This action will revoke access to any resources associated with this permission and cannot be undone.',
    'Remove',
    'Cancel'
  );
