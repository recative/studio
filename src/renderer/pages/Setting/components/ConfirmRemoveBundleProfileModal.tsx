import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [
  ConfirmRemoveBundleProfileModal,
  useConfirmRemoveBundleProfileModal,
] = SimpleModalFactory<string>(
  'Remove Bundle Profile',
  'Are you sure you want to remove this bundle profile?',
  'Remove',
  'Cancel'
);
