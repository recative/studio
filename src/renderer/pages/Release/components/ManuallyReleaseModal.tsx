import * as React from 'react';

import {
  ROLE,
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  SIZE as MODAL_SIZE,
} from 'baseui/modal';
import { FormControl } from 'baseui/form-control';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { ModalManager } from 'utils/hooks/useModalManager';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForBaseUiSelectWithSingleValue,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { useEvent } from 'utils/hooks/useEvent';
import { server } from 'utils/rpc';
import { Select } from 'components/Select/Select';
import { ReleaseSelect } from './ReleaseSelect';
import { ISimpleRelease } from '@recative/definitions';
import { useTerminalModal } from 'components/Terminal/TerminalModal';
import { useBundleReleaseCreatedModal } from './BundleReleaseCreatedModal';

export const useManuallyReleaseModal = ModalManager<unknown, null>(null);

const INITIAL_FORM_VALUE = {
  id: '',
  notes: '',
  releaseType: '',
  mediaRelease: undefined as ISimpleRelease | undefined,
  codeRelease: undefined as ISimpleRelease | undefined,
};

interface IManuallyReleaseModalProps {
  onDataRefreshRequest: () => void;
}

const RELEASE_TYPE = [
  { label: 'Media Release', id: 'media' },
  { label: 'Code Release', id: 'code' },
  { label: 'Bundle Release', id: 'bundle' },
];

export const ManuallyReleaseModal: React.FC<IManuallyReleaseModalProps> = ({
  onDataRefreshRequest,
}) => {
  const [isOpen, , , onClose] = useManuallyReleaseModal();
  const [, , openTerminal] = useTerminalModal();
  const [, , openBundleReleaseCreatedModal] = useBundleReleaseCreatedModal();

  const [clonedConfig, valueChangeCallbacks, ,] =
    useFormChangeCallbacks(INITIAL_FORM_VALUE);

  const handleNotesChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.notes
  );

  const handleReleaseTypeChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.releaseType
    );

  const handleAddPermission = useEvent(async () => {
    onClose();

    if (clonedConfig.releaseType === 'media') {
      openTerminal('createMediaRelease');
      server.createMediaRelease(clonedConfig.notes);
    } else if (clonedConfig.releaseType === 'code') {
      openTerminal('createCodeRelease');
      server.createCodeRelease(clonedConfig.notes);
    } else {
      await server.createBundleRelease(
        clonedConfig.mediaRelease?.id ?? 0,
        clonedConfig.codeRelease?.id ?? 0,
        clonedConfig.notes
      );
      await openBundleReleaseCreatedModal(null);
      onDataRefreshRequest();
    }
  });

  const formattedReleaseType = React.useMemo(() => {
    const result = RELEASE_TYPE.find((x) => x.id === clonedConfig.releaseType);
    return result ? [result] : [];
  }, [clonedConfig.releaseType]);

  return (
    <Modal
      animate
      autoFocus
      isOpen={isOpen}
      closeable={false}
      onClose={onClose}
      role={ROLE.dialog}
      size={MODAL_SIZE.auto}
    >
      <ModalHeader>Manually Release</ModalHeader>
      <ModalBody>
        <RecativeBlock minWidth="400px">
          <FormControl
            label="Notes"
            caption="Human readable notes for the release"
          >
            <Input
              size={INPUT_SIZE.mini}
              value={clonedConfig.notes}
              onChange={handleNotesChange}
            />
          </FormControl>

          <FormControl label="Release Type" caption="The type of the release">
            <Select<typeof RELEASE_TYPE[number]>
              options={RELEASE_TYPE}
              value={formattedReleaseType}
              placeholder="Select color"
              onChange={handleReleaseTypeChange}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          {clonedConfig.releaseType === 'bundle' && (
            <>
              <FormControl
                label="Media bundle"
                caption="The type of the media bundle"
              >
                <ReleaseSelect
                  size={SELECT_SIZE.mini}
                  placeholder="Select Media bundle"
                  type="media"
                  value={clonedConfig.mediaRelease}
                  onChange={valueChangeCallbacks.mediaRelease}
                />
              </FormControl>
              <FormControl
                label="Code bundle"
                caption="The type of the code bundle"
              >
                <ReleaseSelect
                  size={SELECT_SIZE.mini}
                  placeholder="Select Code bundle"
                  type="code"
                  value={clonedConfig.codeRelease}
                  onChange={valueChangeCallbacks.codeRelease}
                />
              </FormControl>
            </>
          )}
        </RecativeBlock>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleAddPermission}>Add</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
