import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [
  ConfirmSyncInterfaceComponentModal,
  useConfirmSyncInterfaceComponentModal,
] = SimpleModalFactory<string>(
  'Sync Code',
  'Are you sure you want to perform this operation? It will erase the existing interface components with the new one.',
  'Sync',
  'Cancel'
);
