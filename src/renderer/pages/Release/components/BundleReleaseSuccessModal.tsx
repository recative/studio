import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [
  BundleReleaseSuccessModal,
  useBundleReleaseSuccessModal,
] = SimpleModalFactory(
  'Success',
  'Your bundle release was generated successfully.',
  'Confirm'
  );