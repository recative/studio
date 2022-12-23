import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [BundleReleaseCreatedModal, useBundleReleaseCreatedModal] =
  SimpleModalFactory<unknown>(
    'Bundle Release Created',
    'Your bundle release record has been created successfully.',
    'Confirm'
  );
