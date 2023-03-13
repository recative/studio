import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [
  ConfirmRemoveUploadProfileModal,
  useConfirmRemoveUploadProfileModal,
] = SimpleModalFactory<string>(
  'Remove Upload Profile',
  'Are you sure you want to remove this upload profile?',
  'Remove',
  'Cancel'
);
