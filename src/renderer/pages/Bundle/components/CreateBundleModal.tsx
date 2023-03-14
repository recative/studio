import * as React from 'react';

import { useStyletron } from 'styletron-react';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { KIND as BUTTON_KIND } from 'baseui/button';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { useTerminalModal } from 'components/Terminal/TerminalModal';
import { useProfileChangeCallback } from 'components/ProfileTable/ProfileTable';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { ModalManager } from 'utils/hooks/useModalManager';
import { useUploadProfiles } from 'utils/hooks/useUploadProfiles';

import { useBundleProfiles } from 'utils/hooks/useBundleProfiles';
import { BundleOptionItem } from './BundleOptionItem';

const ulStyles = {
  paddingLeft: '0',
  paddingRight: '0',
  listStyle: 'none',
};

export const useCreateBundleModal = ModalManager<number, null>(null);

export const CreateBundleModal: React.FC = () => {
  const [, , openTerminal] = useTerminalModal();

  const [bundleProfiles, selectedBundleProfile, setSelectedBundleProfile] =
    useBundleProfiles();

  const [css] = useStyletron();
  const [showBundleOption, data, , onClose] = useCreateBundleModal();

  const candidates = React.useMemo(
    () => bundleProfiles.result?.map((x) => x.id) ?? [],
    [bundleProfiles.result]
  );

  const handleChange = useProfileChangeCallback(
    candidates,
    selectedBundleProfile,
    setSelectedBundleProfile
  );

  const handleSubmit = useEvent(() => {
    if (data === null) {
      return;
    }
    void server.createBundles(selectedBundleProfile, data);
    void openTerminal('createBundles');
    onClose();
  });

  if (
    bundleProfiles.status === 'not-executed' ||
    bundleProfiles.status === 'loading'
  ) {
    return null;
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={showBundleOption}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Create Bundle</ModalHeader>
      <ModalBody>
        {bundleProfiles.result?.length ? (
          <ul className={css(ulStyles)}>
            {bundleProfiles.result?.map((x) => {
              return (
                <BundleOptionItem
                  key={x.id}
                  title={x.label}
                  description={x.extensionId}
                  id={x.id}
                  value={selectedBundleProfile.includes(x.id)}
                  onChange={handleChange}
                />
              );
            })}
          </ul>
        ) : (
          <RecativeBlock
            marginBottom="-32px"
            paddingTop="24px"
            paddingBottom="24px"
          >
            <EmptySpace
              title="No profile found"
              content="Create a profile in settings page"
            />
          </RecativeBlock>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton kind={BUTTON_KIND.primary} onClick={handleSubmit}>
          OK
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
