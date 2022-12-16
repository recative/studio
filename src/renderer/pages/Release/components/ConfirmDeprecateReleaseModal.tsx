import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

interface IConfirmDeprecateReleaseModalData {
  id: number;
  type: 'media' | 'code' | 'bundle';
}

export const [ConfirmDeprecateReleaseModal, useConfirmDeprecateReleaseModal] =
  SimpleModalFactory<IConfirmDeprecateReleaseModalData>(
    'Deprecate Release',
    'Confirm deprecation of this release? Please exercise caution as related releases and resources will be permanently removed and this action cannot be undone.',
    'Deprecate',
    'Cancel'
  );
