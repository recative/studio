import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [
  ConfirmSyncInterfaceComponentSuccessModal,
  useConfirmSyncInterfaceComponentSuccessModal,
] = SimpleModalFactory<unknown>(
  'Success',
  'The latest interface component is downloaded successfully.',
  'OK'
);
