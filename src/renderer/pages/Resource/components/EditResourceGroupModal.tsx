import * as React from 'react';
import cn from 'classnames';

import { nanoid } from 'nanoid';
import { styled, useStyletron } from 'baseui';
import { cloneDeep } from 'lodash';

import { useImmer } from 'use-immer';
import { useAsync } from '@react-hookz/web';

import type { Updater } from 'use-immer';
import type { StyleObject } from 'styletron-react';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { ListItem } from 'baseui/list';
import { LabelSmall } from 'baseui/typography';
import { StatefulMenu } from 'baseui/menu';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { StatefulTooltip, TRIGGER_TYPE, PLACEMENT } from 'baseui/tooltip';
import type { StatefulContainerProps } from 'baseui/menu';
import type { ListOverrides } from 'baseui/list';
import type { ModalOverrides } from 'baseui/modal';
import type { InputOverrides } from 'baseui/input';
import type { ButtonOverrides } from 'baseui/button';

import {
  ContextMenu,
  useContextMenu,
} from 'components/ContextMenu/ContextMenu';
import {
  ResourceSearchMode,
  useResourceSearchModal,
} from 'components/ResourceSearchModal/ResourceSearchModal';
import { ResourceItem } from 'components/Resource/ResourceItem';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';
import { ReplaceIconOutline } from 'components/Icons/ReplaceIconOutline';
import { EditGroupIconOutline } from 'components/Icons/EditGroupIconOutline';
import { MigrateTagIconOutline } from 'components/Icons/MigrateTagIconOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';

import { ButtonMenuOverride } from 'styles/Tooltip';
import { IconButtonOverrides } from 'styles/Button';

import { ModalManager } from 'utils/hooks/useModalManager';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { server } from 'utils/rpc';

import type {
  IActPoint,
  IResourceFile,
  IResourceItem,
  IResourceGroup,
  IEditableResourceFile,
} from '@recative/definitions';

import { ResourceEditor, IEditableResourceGroup } from '../ResourceEditor';
import { mergeGroupConfigurationToIndividualFile } from '../utils/mergeGroupConfigurationToIndividualFile';
import type { IResourceEditorRef, IEditableResource } from '../ResourceEditor';
import { useEditableResourceDefinition } from '../hooks/useEditableResourceDefinition';

import { ReplaceFileModal } from './ReplaceFileModal';

import 'react-contexify/dist/ReactContexify.css';

const CONTEXT_MENU_ID = nanoid();

const EMPTY_ARRAY = [] as IEditableResourceFile[];

export interface IEditResourceGroupModalProps {
  onRefreshResourceListRequest: () => void;
}

// Actually this value is only for prevent rendering bug, the true value is
// decided by `editableResourceGroupProps`, maybe we have to union the logic
// but not now, since is 00:30 now and I'm still working. FXXX my boss.
const nonBatchUpdateFieldsForGroups = ['id', 'label', 'managedBy'] as const;

const modalBodyStyles: StyleObject = {
  maxHeight: 'calc(100% - 210px)',
  boxSizing: 'border-box',
  overflow: 'clip',
  display: 'flex',
  alignItems: 'stretch',
};

const mainContentStyles: StyleObject = {
  flexGrow: 1,
  marginLeft: '12px',
  overflowY: 'auto',
};

const List = styled('ul', {
  width: '32%',
  maxWidth: '320px',
  maxHeight: '100%',
  marginTop: '0',
  marginRight: '0',
  marginBottom: '0',
  marginLeft: '0',
  paddingTop: '0',
  paddingRight: '0',
  paddingBottom: '0',
  paddingLeft: '0',
  overflowY: 'auto',
  listStyle: 'none',
});

const modalOverrides: ModalOverrides = {
  Dialog: {
    style: {
      width: '80vw',
      height: '80vh',
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
  Input: {
    style: ({ $theme }) => ({
      backgroundColor: 'transparent',
      fontSize: $theme.sizing.scale700,
      fontWeight: 500,
    }),
  },
};

const fileListOverrides: ListOverrides = {
  Root: { style: { backgroundColor: 'transparent' } },
};

const listItemOverrides: ButtonOverrides = {
  BaseButton: {
    style: {
      width: '-webkit-fill-available',
      textAlign: 'left',
      display: 'block',
    },
  },
};

const listItemContainerStyles = {
  width: '-webkit-fill-available',
  paddingRight: 0,
};

const menuItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const disabledMenuItemStyles = {
  opacity: 0.5,
  cursor: 'default',
};

export const useEditResourceGroupModal = ModalManager<string, null>(null);

const useFileIdToFileMap = (
  files: IEditableResourceFile[] | null,
  setEditableResourceGroup: React.Dispatch<
    React.SetStateAction<IEditableResourceGroup | null>
  >
) => {
  const [fileIdToFileMap, setFileIdToFileMap] = useImmer<
    Record<string, IEditableResourceFile>
  >({});

  React.useEffect(() => {
    if (!files) return;
    setFileIdToFileMap(() => {
      const result: Record<string, IEditableResourceFile> = {};

      if (!files) return result;

      files.forEach((file) => {
        result[file.id] = { ...file, dirty: false };
      });

      return result;
    });
  }, [setFileIdToFileMap, files]);

  const handleAddFile = React.useCallback(
    async (fileId: string | string[]) => {
      const formattedFileIds = Array.isArray(fileId) ? fileId : [fileId];
      const queriedFiles = await Promise.all(
        formattedFileIds.map((x) => server.getResource(x)).filter(Boolean)
      );

      if (!queriedFiles.length) {
        throw new Error('File not found');
      }

      if (queriedFiles.find((x) => x === null)) {
        throw new TypeError(`Query contains empty result`);
      }

      if (queriedFiles.find((x) => x?.type !== 'file')) {
        throw new TypeError(
          'Files included items that is not a file, this is not allowed.'
        );
      }

      setFileIdToFileMap((draft) => {
        for (let i = 0; i < formattedFileIds.length; i += 1) {
          const queriedFile = queriedFiles[i] as IResourceFile;

          draft[queriedFile.id] = {
            ...queriedFile,
            dirty: false,
          };
        }
      });
    },
    [setFileIdToFileMap]
  );

  const handleRemoveFile = React.useCallback(
    (fileId: string | string[]) => {
      setFileIdToFileMap((draft) => {
        if (Array.isArray(fileId)) {
          for (let i = 0; i < fileId.length; i += 1) {
            delete draft[fileId[i]];
          }
        } else {
          delete draft[fileId];
        }
      });
    },
    [setFileIdToFileMap]
  );

  const handleUpdateFile = React.useCallback(
    async (resource: IEditableResource) => {
      const clonedResource = cloneDeep(resource);

      setFileIdToFileMap((draft) => {
        if (clonedResource.type === 'file') {
          draft[resource.id] = clonedResource;
        } else {
          setEditableResourceGroup(clonedResource);

          Object.values(draft).forEach((fileToBeMerged) => {
            mergeGroupConfigurationToIndividualFile(fileToBeMerged, resource);
          });
        }
      });
    },
    [setFileIdToFileMap, setEditableResourceGroup]
  );

  return {
    fileIdToFileMap,
    handleAddFile,
    handleRemoveFile,
    handleUpdateFile,
    setFileIdToFileMap,
  };
};

const useGroupModalSubmitCallback = (
  editorRef: React.RefObject<IResourceEditorRef>,
  fileIdToFileMap: Record<string, IEditableResourceFile>,
  groupOfLabel: IResourceGroup | null,
  groupLabel: string,
  editableResourceGroup: IEditableResourceGroup | null,
  onRefreshResourceListRequest: () => void
) => {
  return React.useCallback(async () => {
    const previousFile = editorRef.current?.value;

    const finalFileMap = previousFile
      ? { ...fileIdToFileMap, [previousFile.id]: previousFile }
      : { ...fileIdToFileMap };

    const files = Object.values(finalFileMap)
      .map((file) => {
        if (file.type !== 'file') return null;

        const nextFile: IResourceFile = cloneDeep(file);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (nextFile as any).dirty;

        if (editableResourceGroup) {
          mergeGroupConfigurationToIndividualFile(
            nextFile,
            editableResourceGroup
          );
        }

        return nextFile;
      })
      .filter(((x) => x !== null) as (file: unknown) => file is IResourceFile);

    await server.updateOrInsertResources(files);

    if (groupOfLabel) {
      await server.updateResourceLabel(groupOfLabel.id, groupLabel);
      await server.updateFilesOfGroup(
        groupOfLabel.id,
        files.map((x) => x.id)
      );

      onRefreshResourceListRequest();
    }
  }, [
    editorRef,
    fileIdToFileMap,
    groupOfLabel,
    editableResourceGroup,
    groupLabel,
    onRefreshResourceListRequest,
  ]);
};

export const useLabelUpdateCallback = (
  group: IResourceGroup | IResourceFile | null
) => {
  const [groupName, setGroupName] = React.useState('');

  React.useEffect(() => {
    setGroupName(group?.label || '');
  }, [group]);

  const handleGroupLabelUpdate = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setGroupName(event.currentTarget.value);
    },
    [setGroupName]
  );

  return [groupName, handleGroupLabelUpdate] as const;
};

const useListItemContextMenu = (
  files: IEditableResourceFile[],
  onRemoveResourceFile: (resourceFile: IEditableResourceFile) => Promise<void>,
  onReplaceFile: (fileId: string) => void
) => {
  const [css, theme] = useStyletron();

  const contextConfig = React.useMemo(() => {
    return Object.fromEntries(files.map((item) => [item.id, item] as const));
  }, [files]);

  const [triggers, hideContextMenu, selectedValue] = useContextMenu(
    CONTEXT_MENU_ID,
    contextConfig
  );

  const handleItemClick = React.useCallback<
    StatefulContainerProps['onItemSelect']
  >(
    (event) => {
      hideContextMenu();
      switch (event.item.label.props.id) {
        case 'delete':
          if (selectedValue && !selectedValue.managedBy) {
            onRemoveResourceFile(selectedValue);
          }
          break;
        case 'replace':
          if (selectedValue && !selectedValue.managedBy) {
            onReplaceFile(selectedValue.id);
          }
          break;
        default:
      }
    },
    [hideContextMenu, onRemoveResourceFile, onReplaceFile, selectedValue]
  );

  const contextMenuItem = React.useMemo(() => {
    return [
      {
        label: (
          <RecativeBlock
            id="replace"
            className={css(menuItemStyles)}
            fontWeight={500}
            color={
              selectedValue?.managedBy
                ? theme.colors.buttonDisabledText
                : theme.colors.buttonPrimaryText
            }
            cursor={selectedValue?.managedBy ? 'not-allowed' : 'pointer'}
          >
            <ReplaceIconOutline width={18} /> <span>Replace</span>
          </RecativeBlock>
        ),
      },
      {
        label: (
          <RecativeBlock
            id="delete"
            className={css(menuItemStyles)}
            fontWeight={500}
            color={
              selectedValue?.managedBy
                ? theme.colors.buttonDisabledText
                : theme.colors.buttonPrimaryText
            }
            cursor={selectedValue?.managedBy ? 'not-allowed' : 'pointer'}
          >
            <TrashIconOutline width={18} /> <span>Delete</span>
          </RecativeBlock>
        ),
      },
    ];
  }, [
    css,
    theme.colors.buttonDisabledText,
    theme.colors.buttonPrimaryText,
    selectedValue,
  ]);

  return { triggers, contextMenuItem, handleItemClick };
};

const useModalEditMenu = (
  group: IResourceGroup | null,
  onAddResourceFile: (resourceFile: IResourceFile) => Promise<void>,
  setFileIdToFileMap: Updater<Record<string, IEditableResourceFile>>
) => {
  const [css] = useStyletron();

  const handleSearchModalSubmit = React.useCallback(
    (x: IResourceItem | IActPoint) => {
      if ('type' in x && x.type === 'file') {
        onAddResourceFile(x);
      }
    },
    [onAddResourceFile]
  );

  const { handleOpenResourceModal } = useResourceSearchModal(
    ResourceSearchMode.FileResource,
    handleSearchModalSubmit
  );

  const handleMigrateLabelToCustomTag = React.useCallback(() => {
    setFileIdToFileMap((draft) => {
      Object.keys(draft).forEach((resourceId) => {
        const resource = draft[resourceId];
        if (!resource) return;

        // Remove all content after the last `.` as the body of this tag.
        const splitedLabel = resource.label.split('.');
        const tagBody =
          splitedLabel.length > 1
            ? splitedLabel.slice(0, -1).join('.')
            : resource.label;
        const tag = `custom:${tagBody}`;

        if (!resource.tags.includes(tag)) {
          resource.tags.push(tag);
        }
      });

      return draft;
    });
  }, [setFileIdToFileMap]);

  const onModalEditMenuSelected = React.useCallback<
    StatefulContainerProps['onItemSelect']
  >(
    (event) => {
      switch (event.item.id) {
        case 'add':
          handleOpenResourceModal();
          break;
        case 'labelToTag':
          handleMigrateLabelToCustomTag();
          break;
        default:
      }
    },
    [handleOpenResourceModal, handleMigrateLabelToCustomTag]
  );

  const modalMenuItem = React.useCallback(
    () => (
      <StatefulMenu
        items={[
          {
            id: 'id',
            label: (
              <RecativeBlock
                id="id"
                className={cn(css(menuItemStyles), css(disabledMenuItemStyles))}
              >
                <span>{group?.id}</span>
              </RecativeBlock>
            ),
          },
          {
            id: 'add',
            label: (
              <RecativeBlock
                id="add"
                className={css(menuItemStyles)}
                fontWeight={500}
              >
                <AddIconOutline width={18} /> <span>Add Resource</span>
              </RecativeBlock>
            ),
          },
          {
            id: 'labelToTag',
            label: (
              <RecativeBlock
                id="labelToTag"
                className={css(menuItemStyles)}
                fontWeight={500}
              >
                <MigrateTagIconOutline width={18} /> <span>Label To Tag</span>
              </RecativeBlock>
            ),
          },
        ]}
        onItemSelect={onModalEditMenuSelected}
      />
    ),
    [css, onModalEditMenuSelected, group]
  );

  return { onModalEditMenuSelected, modalMenuItem };
};

const useReplaceFileModalState = (
  filesInGroup: IResourceFile[],
  handleAddFile: (fileId: string | string[]) => void,
  handleRemoveFile: (fileId: string | string[]) => void
) => {
  const [showReplaceFileModal, setShowReplaceFileModal] = React.useState(false);

  const [selectedResourceToReplace, setSelectedResource] = React.useState<
    string | undefined
  >(undefined);

  const handleReplaceFileModalOpen = React.useCallback((selectedId: string) => {
    setSelectedResource(selectedId);
    setShowReplaceFileModal(true);
  }, []);

  const handleReplaceFileModalClose = React.useCallback(() => {
    setShowReplaceFileModal(false);
    setSelectedResource(undefined);
  }, []);

  const handleFileReplaced = React.useCallback(
    (oldFileId: string, newFiles: IResourceFile[]) => {
      if (!selectedResourceToReplace) return;

      const filesIdsToBeRemoved = [
        oldFileId,
        ...filesInGroup
          .filter((x) => x.managedBy === oldFileId)
          .map((x) => x.id),
      ];

      const fileIdsToBeAdded = newFiles.map((x) => x.id);
      handleRemoveFile(filesIdsToBeRemoved);
      handleAddFile(fileIdsToBeAdded);
    },
    [filesInGroup, handleAddFile, handleRemoveFile, selectedResourceToReplace]
  );

  return {
    showReplaceFileModal,
    selectedResourceToReplace,
    handleFileReplaced,
    handleReplaceFileModalOpen,
    handleReplaceFileModalClose,
  };
};

const useSelectedFileState = (
  fileIdToFileMap: Record<string, IEditableResourceFile>,
  editableResourceGroup: IEditableResourceGroup | null
) => {
  const [selectedFileId, setSelectedFileId] = React.useState('');

  const handleButtonClickCallbacks = React.useMemo(() => {
    const result: Record<string, () => void> = {};

    Object.keys(fileIdToFileMap).forEach((fileId) => {
      result[fileId] = () => setSelectedFileId(fileId);
    });

    if (editableResourceGroup) {
      result[editableResourceGroup.id] = () => {
        setSelectedFileId(editableResourceGroup.id);
      };
    }

    return result;
  }, [fileIdToFileMap, editableResourceGroup]);

  const resetSelectedFile = React.useCallback(() => setSelectedFileId(''), []);

  return { selectedFileId, resetSelectedFile, handleButtonClickCallbacks };
};

const useEditableResourceGroup = (
  groupId: string | null,
  files: IEditableResourceFile[] | null,
  extensionMetadata: ReturnType<typeof useExtensionMetadata>
) => {
  const [editableResourceGroup, setEditableResourceGroup] =
    React.useState<IEditableResourceGroup | null>(null);

  React.useLayoutEffect(() => {
    if (files && groupId && extensionMetadata) {
      // We want to build such a feature, some fields are treated as group-level,
      // this is possible to make a fake group level resource file, and treated
      // as a group, while this file is updated, all files will be updated at
      // once, very tricky but works :D
      // The batch update is handled by `handleUpdateFile`, you can find it in
      // this file.
      const file = cloneDeep(files[0]) as unknown as IEditableResourceGroup;

      nonBatchUpdateFieldsForGroups.forEach((x) => {
        delete file[x];
      });

      for (let i = 0; i < extensionMetadata.length; i += 1) {
        const metadata = extensionMetadata[i];
        const blackList = metadata.nonMergeableResourceExtensionConfiguration;

        if (blackList) {
          for (let j = 0; j < blackList.length; j += 1) {
            const config = blackList[j];
            delete file.extensionConfigurations[config];
          }
        }

        file.type = 'group';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (file as any).id = groupId;
        setEditableResourceGroup(file);
      }
    }
  }, [files, groupId, extensionMetadata]);

  return { editableResourceGroup, setEditableResourceGroup };
};

const useExtensionMetadata = () => {
  const asyncFn = React.useCallback(async () => {
    return (await server.getExtensionMetadata()).resourceProcessor;
  }, []);

  const [extensionMetadata, actions] = useAsync(asyncFn);

  React.useEffect(() => {
    actions.execute();
  }, [actions]);

  return extensionMetadata.result;
};

const InternalEditResourceGroupModal: React.FC<IEditResourceGroupModalProps> =
  ({ onRefreshResourceListRequest }) => {
    const editorRef = React.useRef<IResourceEditorRef>(null);

    const [css] = useStyletron();

    const [isOpen, fileId, , onClose] = useEditResourceGroupModal();
    const { group, files } = useEditableResourceDefinition(isOpen, fileId);

    const [groupLabel, handleGroupLabelUpdate] = useLabelUpdateCallback(group);

    const extensionMetadata = useExtensionMetadata();

    const { editableResourceGroup, setEditableResourceGroup } =
      useEditableResourceGroup(group?.id ?? null, files, extensionMetadata);

    const {
      fileIdToFileMap,
      handleAddFile,
      handleRemoveFile,
      handleUpdateFile,
      setFileIdToFileMap,
    } = useFileIdToFileMap(files, setEditableResourceGroup);

    const handleGroupModalSubmit = useGroupModalSubmitCallback(
      editorRef,
      fileIdToFileMap,
      group,
      groupLabel,
      editableResourceGroup,
      onRefreshResourceListRequest
    );

    const { selectedFileId, resetSelectedFile, handleButtonClickCallbacks } =
      useSelectedFileState(fileIdToFileMap, editableResourceGroup);

    const handleModalClose = React.useCallback(() => {
      resetSelectedFile();
      onClose();
    }, [onClose, resetSelectedFile]);

    const handleSubmitClick = React.useCallback(() => {
      handleGroupModalSubmit();
      handleModalClose();
    }, [handleGroupModalSubmit, handleModalClose]);

    const handleAddResourceFile = React.useCallback(
      async (resourceFile: IResourceFile) => {
        if (!group) {
          throw new TypeError(
            `Resource item is not a group, this is not allowed`
          );
        }
        await server.addFileToGroup(resourceFile, group.id);
        handleAddFile(resourceFile.id);
      },
      [group, handleAddFile]
    );

    const handleRemoveResourceFile = React.useCallback(
      async (resourceFile: IEditableResourceFile) => {
        await server.removeFileFromGroup(resourceFile);
        handleRemoveFile(resourceFile.id);
      },
      [handleRemoveFile]
    );

    const {
      showReplaceFileModal,
      selectedResourceToReplace,
      handleFileReplaced,
      handleReplaceFileModalOpen,
      handleReplaceFileModalClose,
    } = useReplaceFileModalState(files, handleAddFile, handleRemoveFile);

    const { triggers, contextMenuItem, handleItemClick } =
      useListItemContextMenu(
        files || EMPTY_ARRAY,
        handleRemoveResourceFile,
        handleReplaceFileModalOpen
      );

    const { modalMenuItem } = useModalEditMenu(
      group,
      handleAddResourceFile,
      setFileIdToFileMap
    );

    React.useEffect(() => {
      if (selectedFileId === editableResourceGroup?.id) {
        editorRef.current?.setValue(editableResourceGroup);
      } else {
        const nextFile = fileIdToFileMap[selectedFileId];

        editorRef.current?.setValue(nextFile ?? null);
      }
    }, [fileIdToFileMap, selectedFileId, editableResourceGroup]);

    const databaseLocked = useDatabaseLocked();

    return (
      <Modal
        onClose={handleModalClose}
        isOpen={isOpen}
        animate
        autoFocus
        size={SIZE.default}
        role={ROLE.dialog}
        closeable={false}
        overrides={modalOverrides}
      >
        <ModalHeader>
          <RecativeBlock display="flex">
            <Input
              disabled={databaseLocked}
              size={INPUT_SIZE.large}
              overrides={titleOverrides}
              value={groupLabel}
              onChange={handleGroupLabelUpdate}
            />
            <StatefulTooltip
              overrides={ButtonMenuOverride}
              content={modalMenuItem}
              placement={PLACEMENT.bottomRight}
              triggerType={TRIGGER_TYPE.click}
            >
              <Button
                kind={BUTTON_KIND.tertiary}
                startEnhancer={<EditGroupIconOutline width={16} />}
                overrides={IconButtonOverrides}
              />
            </StatefulTooltip>
          </RecativeBlock>
        </ModalHeader>
        <ModalBody className={css(modalBodyStyles)}>
          <List>
            {group && (
              <ListItem overrides={fileListOverrides}>
                <div style={listItemContainerStyles}>
                  <Button
                    overrides={listItemOverrides}
                    kind={
                      selectedFileId === group?.id
                        ? BUTTON_KIND.secondary
                        : BUTTON_KIND.tertiary
                    }
                    onClick={handleButtonClickCallbacks[group.id]}
                  >
                    <LabelSmall>
                      <RecativeBlock display="flex">
                        <RecativeBlock marginRight="8px">
                          <ResourceManagerIconOutline width={16} />
                        </RecativeBlock>
                        <RecativeBlock>Group</RecativeBlock>
                      </RecativeBlock>
                    </LabelSmall>
                  </Button>
                </div>
              </ListItem>
            )}
            {Object.values(fileIdToFileMap).map((file) => (
              <ListItem key={file.id} overrides={fileListOverrides}>
                <div
                  style={listItemContainerStyles}
                  onContextMenu={triggers[file.id]}
                >
                  <Button
                    overrides={listItemOverrides}
                    kind={
                      selectedFileId === file.id
                        ? BUTTON_KIND.secondary
                        : BUTTON_KIND.tertiary
                    }
                    onClick={handleButtonClickCallbacks[file.id]}
                  >
                    <ResourceItem {...file} />
                  </Button>
                </div>
              </ListItem>
            ))}
          </List>
          <ContextMenu id={CONTEXT_MENU_ID}>
            <StatefulMenu
              items={contextMenuItem}
              onItemSelect={handleItemClick}
            />
          </ContextMenu>
          <RecativeBlock className={css(mainContentStyles)}>
            {extensionMetadata ? (
              <ResourceEditor ref={editorRef} onChange={handleUpdateFile} />
            ) : null}
          </RecativeBlock>
        </ModalBody>
        <ModalFooter>
          <ModalButton kind={BUTTON_KIND.tertiary} onClick={handleModalClose}>
            Cancel
          </ModalButton>
          <ModalButton disabled={databaseLocked} onClick={handleSubmitClick}>
            Confirm
          </ModalButton>
        </ModalFooter>
        <ReplaceFileModal
          isOpen={showReplaceFileModal}
          fileId={selectedResourceToReplace}
          onReplaced={handleFileReplaced}
          onClose={handleReplaceFileModalClose}
        />
      </Modal>
    );
  };

export const EditResourceGroupModal = React.memo(
  InternalEditResourceGroupModal
);
