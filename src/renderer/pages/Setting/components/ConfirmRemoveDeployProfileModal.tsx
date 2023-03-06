import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [
  ConfirmRemoveDeployProfileModal,
  useConfirmRemoveDeployProfileModal,
] = SimpleModalFactory<string>(
  'Remove Deploy Profile',
  'Are you sure you want to remove this deploy profile?',
  'Remove',
  'Cancel'
);
