import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [ConfirmRemoveTokenModal, useConfirmRemoveTokenModal] =
  SimpleModalFactory<string>(
    'Remove Token',
    'Would you like to remove the token? This action cannot be undone and will revoke access to any resources that are associated with this token.',
    'Remove',
    'Cancel'
  );
