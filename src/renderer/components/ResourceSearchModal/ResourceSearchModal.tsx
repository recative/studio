import * as React from 'react';

import { atom, useAtom } from 'jotai';
import { useDebouncedCallback } from '@react-hookz/web';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import type { IResourceItem, IActPoint } from '@recative/definitions';

import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { Modal, ModalBody, ModalHeader, ROLE, SIZE } from 'baseui/modal';

import type { InputOverrides } from 'baseui/input';
import type { ModalOverrides } from 'baseui/modal';
import type { ButtonProps, ButtonOverrides } from 'baseui/button';

import { SelectOption } from 'components/Input/AssetSelect';
import { ResourceItem } from 'components/Resource/ResourceItem';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SearchIconOutline } from 'components/Icons/SearchIconOutline';

import { server } from 'utils/rpc';

export enum ResourceSearchMode {
  Texture,
  Asset,
  FileResource,
}

interface IResourceSearchButtonProps {
  type: ResourceSearchMode;
  value: IResourceItem | IActPoint | null;
  onChange: (x: IResourceItem | IActPoint) => void;
}

const RESOURCE_SEARCH_MODAL_OPEN = atom(false);
const RESOURCE_SEARCH_MODE = atom<ResourceSearchMode>(
  ResourceSearchMode.Texture
);
const ON_RESOURCE_FILE_SELECT = atom<
  IResourceSearchButtonProps['onChange'] | null
>(null);

const modalBodyStyles: StyleObject = {
  maxHeight: 'calc(100% - 172px)',
  boxSizing: 'border-box',
  overflow: 'clip',
  display: 'flex',
  alignItems: 'stretch',
};

const mainContentStyles: StyleObject = {
  marginLeft: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  flexGrow: 1,
  flexWrap: 'wrap',
};

const listItemOverrides: ButtonOverrides = {
  BaseButton: {
    style: {
      width: '33%',
      textAlign: 'left',
      display: 'block',
    },
  },
};

const modalOverrides: ModalOverrides = {
  Dialog: {
    style: {
      width: '60vw',
      maxWidth: '1000px',
      height: '80vh',
    },
  },
};

const resourceSearchButtonOverrides: ButtonOverrides = {
  BaseButton: {
    style: {
      width: '100%',
      textAlign: 'left',
      display: 'block',
    },
  },
};

export const titleOverrides: InputOverrides = {
  Root: {
    style: ({ $theme, $isFocused }) => ({
      backgroundColor: 'transparent',
      borderColor: $isFocused
        ? $theme.borders.border600.borderColor
        : 'transparent',
    }),
  },
  InputContainer: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  StartEnhancer: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  EndEnhancer: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  Input: {
    style: ({ $theme }) => ({
      backgroundColor: 'transparent',
      fontSize: $theme.sizing.scale700,
      fontWeight: 500,
    }),
  },
};

const useModalStatus = () => {
  const [resourceSearchModalIsOpen, setResourceSearchModalIsOpen] = useAtom(
    RESOURCE_SEARCH_MODAL_OPEN
  );

  const handleResourceSearchModalClose = React.useCallback(() => {
    setResourceSearchModalIsOpen(false);
  }, [setResourceSearchModalIsOpen]);

  return { resourceSearchModalIsOpen, handleResourceSearchModalClose };
};

const useSearchQuery = (onModalClose: () => void) => {
  const [mode] = useAtom(RESOURCE_SEARCH_MODE);
  const [onResourceFileSelect] = useAtom(ON_RESOURCE_FILE_SELECT);

  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [resources, setResources] = React.useState<
    (IResourceItem | IActPoint)[]
  >([]);

  const handleSearch = useDebouncedCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { value } = event.target;

      if (mode === ResourceSearchMode.Asset) {
        setResources(await server.searchAssetResources(value));
      } else if (mode === ResourceSearchMode.FileResource) {
        setResources(await server.searchFileResources(value));
      } else if (mode === ResourceSearchMode.Texture) {
        setResources(await server.searchTextureResources(value));
      }
      setIsLoading(false);
    },
    [mode],
    300,
    500
  );

  const handleQueryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setQuery(event.currentTarget.value);
      handleSearch(event);
    },
    [handleSearch]
  );

  const handleItemClick = React.useCallback(
    (x: IResourceItem | IActPoint) => {
      onResourceFileSelect?.(x);
      onModalClose();
    },
    [onResourceFileSelect, onModalClose]
  );

  return { query, resources, isLoading, handleItemClick, handleQueryChange };
};

export const useResourceSearchModal = (
  type: ResourceSearchMode,
  onSelect: IResourceSearchButtonProps['onChange']
) => {
  const [, setResourceSearchMode] = useAtom(RESOURCE_SEARCH_MODE);
  const [searchModalOpen, setSearchModalOpen] = useAtom(
    RESOURCE_SEARCH_MODAL_OPEN
  );
  const [, setOnSelect] = useAtom(ON_RESOURCE_FILE_SELECT);

  const handleOpenResourceModal = React.useCallback(() => {
    if (searchModalOpen) {
      return;
    }
    setSearchModalOpen(true);
    setResourceSearchMode(type);
    setOnSelect(() => onSelect);
  }, [
    searchModalOpen,
    setSearchModalOpen,
    setResourceSearchMode,
    type,
    setOnSelect,
    onSelect,
  ]);

  return { handleOpenResourceModal };
};

export const ResourceSearchButton: React.FC<
  IResourceSearchButtonProps &
    Pick<ButtonProps, 'kind' | 'overrides' | 'size' | 'shape' | 'disabled'>
> = ({ kind, type, value, onChange, ...props }) => {
  const { handleOpenResourceModal } = useResourceSearchModal(type, onChange);

  return (
    <Button
      kind={kind || BUTTON_KIND.secondary}
      overrides={resourceSearchButtonOverrides}
      onClick={handleOpenResourceModal}
      {...props}
    >
      {value ? <SelectOption option={value} /> : 'Select Asset'}
    </Button>
  );
};

export const ResourceSearchModal: React.FC = React.memo(() => {
  const [css] = useStyletron();

  const { resourceSearchModalIsOpen, handleResourceSearchModalClose } =
    useModalStatus();
  const { query, resources, handleQueryChange, handleItemClick } =
    useSearchQuery(handleResourceSearchModalClose);

  return (
    <Modal
      animate
      autoFocus
      isOpen={resourceSearchModalIsOpen}
      onClose={handleResourceSearchModalClose}
      role={ROLE.dialog}
      size={SIZE.default}
      overrides={modalOverrides}
    >
      <ModalHeader>
        <Input
          size={INPUT_SIZE.large}
          overrides={titleOverrides}
          value={query}
          onChange={handleQueryChange}
          startEnhancer={<SearchIconOutline width={20} />}
          placeholder="Search for a resource"
        />
      </ModalHeader>
      <ModalBody className={css(modalBodyStyles)}>
        <RecativeBlock className={css(mainContentStyles)}>
          {resources.map((thisResource) => (
            <Button
              key={thisResource.id}
              overrides={listItemOverrides}
              kind={BUTTON_KIND.tertiary}
              onClick={() => handleItemClick(thisResource)}
            >
              <ResourceItem {...thisResource} />
            </Button>
          ))}
        </RecativeBlock>
      </ModalBody>
    </Modal>
  );
});
