import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [ConfirmRemoveAssetModal, useConfirmRemoveAssetModal] =
  SimpleModalFactory<string>(
    'Remove Asset',
    'Are you sure you want to remove this asset?',
    'Remove',
    'Cancel'
  );
