import { SimpleModalFactory } from 'components/SimpleModal/SimpleModal';

export const [AlreadyInGroupAlertModal, useAlreadyInGroupAlertModal] =
  SimpleModalFactory<null>(
    'Invalid Operation',
    'It is not possible to add a file that is already part of the group. This operation is invalid.',
    'Confirm'
  );
