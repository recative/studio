import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

import { useAsync } from '@react-hookz/web';
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

import { ModalManager } from 'utils/hooks/useModalManager';

import { server } from 'utils/rpc';

import { BundleOptionItem } from './BundleOptionItem';

export interface ICreateBundleModalProps {
  onSubmit: (ids: string[], bundleReleaseId: number) => void;
}

const ulStyles = {
  paddingLeft: '0',
  paddingRight: '0',
  listStyle: 'none',
};

export const useCreateBundleModal = ModalManager<number, null>(null);

export const CreateBundleModal: React.FC<ICreateBundleModalProps> = ({
  onSubmit,
}) => {
  const [profiles, profilesActions] = useAsync(server.listBundleProfile);

  const profileIds = React.useMemo(() => {
    return profiles.result?.map((profile) => profile.id) ?? [];
  }, [profiles.result]);

  const [css] = useStyletron();
  const [showBundleOption, data, , onClose] = useCreateBundleModal();

  React.useEffect(() => {
    profilesActions.execute();
  }, [profilesActions, profilesActions.execute]);

  const [selectedProfiles, setSelectedProfiles] = React.useState(
    () =>
      new Set(
        (localStorage.getItem('@recative/studio/selectedProfile') ?? '')
          .split(',,,')
          .filter(Boolean)
      )
  );

  const handleSelectProfile = React.useCallback(
    (checked: boolean, id: string) => {
      if (checked) {
        selectedProfiles.add(id);
      } else {
        selectedProfiles.delete(id);
      }

      setSelectedProfiles(new Set(selectedProfiles));

      localStorage.setItem(
        '@recative/studio/selectedProfile',
        Array.from(selectedProfiles).join(',,,')
      );
    },
    [selectedProfiles]
  );

  const handleSubmit = useEvent(() => {
    if (data === null) {
      return;
    }
    onSubmit(
      Array.from(selectedProfiles).filter((x) => profileIds.includes(x)),
      data
    );
    onClose();
  });

  if (profiles.status === 'not-executed' || profiles.status === 'loading') {
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
        {profiles.result?.length ? (
          <ul className={css(ulStyles)}>
            {profiles.result?.map((x) => {
              return (
                <BundleOptionItem
                  key={x.id}
                  title={x.label}
                  description={x.bundleExtensionId}
                  id={x.id}
                  value={selectedProfiles.has(x.id)}
                  onChange={handleSelectProfile}
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
