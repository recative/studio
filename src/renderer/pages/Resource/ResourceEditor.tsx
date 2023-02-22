import * as React from 'react';

import { current } from 'immer';

import type { Draft } from 'immer';
import type { Updater } from 'use-immer';
import type { StyleObject } from 'styletron-react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import {
  tagIdMap,
  LabelType,
  typeNameMap,
  PreloadLevel,
} from '@recative/definitions';
import type {
  IResourceTag,
  IEditableResourceFile,
  IGroupTypeResourceTag,
} from '@recative/definitions';

import { LabelLarge } from 'baseui/typography';
import { FormControl } from 'baseui/form-control';
import { LABEL_PLACEMENT } from 'baseui/checkbox';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { Select } from 'components/Select/Select';
import { Toggle } from 'components/Toggle/Toggle';
import { NotFound } from 'components/Illustrations/NotFound';
import { Thumbnail } from 'components/Thumbnail/Thumbnail';
import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { LockIconOutline } from 'components/Icons/LockIconOutline';
import { ExtensionConfiguration } from 'components/ExtensionConfiguration/ExtensionConfiguration';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForCheckboxType,
  useValueOptionForBaseUiSelectWithSingleValue,
  useOnChangeEventWrapperForBaseUiSelectWithMultipleValue,
  useOnChangeEventWrapperForBaseUiSelectWithSingleValue,
} from 'utils/hooks/useFormChangeCallbacks';
import { Hint, HintParagraph } from 'pages/Setting/components/Hint';

import { server } from 'utils/rpc';

import { FormTagItem } from './components/FormTagItem';

/**
 * This is a hack, while editing a resource group, we create an empty resource
 * file, and apply the changes on this mock group to every single file, to
 * make batch editing happens.
 */
export interface IEditableResourceGroup
  extends Omit<IEditableResourceFile, 'type'> {
  type: 'group';
}

export type IEditableResource = IEditableResourceFile | IEditableResourceGroup;

export const editableResourceGroupProps: (keyof Partial<IEditableResourceFile>)[] =
  [
    'cacheToHardDisk',
    'preloadLevel',
    'preloadTriggers',
    'episodeIds',
    'extensionConfigurations',
  ];

interface SelectOption<Id = string> {
  id: Id;
  label: string;
}

const previewStyles: StyleObject = {
  width: '100% !important',
  height: '25vh !important',
  background: '#f1f1f1',
  // @ts-ignore
  objectFit: 'contain !important',
};

const groupLabelStyles: StyleObject = {
  marginTop: '16px',
  marginBottom: '8px',
};

const tagFormItemContainerStyles: StyleObject = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px',
};

const preloadFormItemContainerStyles: StyleObject = {
  display: 'grid',
  gridTemplateColumns: 'repeat(1, 1fr)',
  gap: '8px',
};

const PRELOAD_LEVEL_MAP: Record<PreloadLevel, string> = {
  [PreloadLevel.None]: 'Do not preload',
  [PreloadLevel.BeforeApp]: 'Before Each Episode Loaded',
  [PreloadLevel.AfterApp]: 'After Each Episode Loaded',
  [PreloadLevel.BeforeEpisode]: 'Before Selected Episodes Loaded',
  [PreloadLevel.AfterEpisode]: 'After Selected Episodes Loaded',
  [PreloadLevel.InsideActPoint]: 'While the Act Point is Initialized',
};

const PRELOAD_LEVELS = Object.entries(PRELOAD_LEVEL_MAP).map(
  ([key, value]) => ({
    label: value,
    id: key as PreloadLevel,
  })
);

const EMPTY_PRELOAD_TRIGGERS: SelectOption[] = [];

const useTagTypeToReferenceMap = (file?: IEditableResource | null) => {
  const tags = file?.tags.filter(Boolean).join(',,,');

  return React.useMemo(() => {
    const tagTypeToReferenceMap: Partial<
      Record<LabelType, (IResourceTag | IGroupTypeResourceTag)[]>
    > = {};

    tags?.split(',,,').forEach((tag) => {
      const splitedTag = tag?.split(':');
      const tagType = splitedTag[0] as LabelType;
      const tagValue = splitedTag[1] as LabelType;

      const tagReference =
        tagType === 'custom'
          ? {
              id: tag,
              label: tagValue,
              type: LabelType.Custom,
            }
          : tagIdMap[tag];

      const tagList = tagTypeToReferenceMap[tagType] ?? [];
      tagList.push(tagReference);
      tagTypeToReferenceMap[tagType] = tagList;
    });

    return tagTypeToReferenceMap;
  }, [tags]);
};

const useResourceTagChangeCallback = (
  tagTypeToReferenceMap: Partial<
    Record<LabelType, (IResourceTag | IGroupTypeResourceTag)[]>
  >,
  onChange?: (x: IEditableResource) => void,
  setFile?: Updater<IEditableResource | null>
) => {
  const handleResourceTagChange = React.useCallback(
    (
      type: LabelType,
      nextTagReference: (IResourceTag | IGroupTypeResourceTag)[]
    ) => {
      tagTypeToReferenceMap[type] = nextTagReference;

      const nextTags = new Set<string>();
      Object.values(tagTypeToReferenceMap).forEach((x) =>
        x.filter(Boolean).forEach((a) => nextTags.add(a.id))
      );

      setFile?.((draft) => {
        if (draft) {
          const result: IEditableResource = {
            ...draft,
            tags: Array.from(nextTags),
          };
          onChange?.(result);
          return result;
        }

        return null;
      });
    },
    [tagTypeToReferenceMap, setFile, onChange]
  );

  return handleResourceTagChange;
};

const useEpisodes = () => {
  const [episodesForSelect, episodesForSelectAction] = useAsync(async () => {
    const episodes = await server.listEpisodes();

    const episodeOptions = episodes.map((episode) => ({
      id: episode.id,
      label: episode.episode.label.en,
    }));

    const episodeListMap = Object.fromEntries(
      episodes.map((episode) => [episode.id, episode.episode.label.en])
    );

    return [episodeListMap, episodeOptions] as const;
  });

  React.useEffect(() => {
    void episodesForSelectAction.execute();
  }, [episodesForSelectAction]);

  return (
    episodesForSelect.result ||
    ([
      {} as Record<string, string>,
      [] as { id: string; label: string }[],
    ] as const)
  );
};

const useFileState = (
  ref: React.Ref<IResourceEditorRef> | null,
  onFileChange: IResourceEditorProps['onChange']
) => {
  const handleFieldChange = React.useCallback(
    (_: unknown, draft: Draft<IEditableResource> | null) => {
      if (draft) {
        draft.dirty = true;
        onFileChange?.(current(draft));
      }
    },
    [onFileChange]
  );

  const [file, callbacks, , setFile] = useFormChangeCallbacks<
    IEditableResource,
    IEditableResource | null
  >(null, handleFieldChange);

  const handleResetFile = React.useCallback(() => {
    setFile(null);
  }, [setFile]);

  React.useImperativeHandle(
    ref,
    () => {
      return {
        value: file,
        setValue: setFile,
        reset: handleResetFile,
      };
    },
    [file, handleResetFile, setFile]
  );

  return [file, callbacks, setFile] as const;
};

export interface IResourceEditorRef {
  value: IEditableResource | null;
  setValue: Updater<IEditableResource | null>;
  reset: () => void;
}

interface IResourceEditorProps {
  onInitialized?: () => void;
  onChange?: (file: IEditableResource) => void;
}

const useExtensionSettings = (
  file: IEditableResource | null,
  onChange?: (x: IEditableResource) => void,
  setFile?: Updater<IEditableResource | null>
) => {
  const getValue = React.useCallback(
    (extensionId: string, fieldId: string) => {
      const fieldQueryKey = `${extensionId}~~${fieldId}`;
      return file?.extensionConfigurations[fieldQueryKey] || '';
    },
    [file]
  );

  const setValue = React.useCallback(
    (extensionId: string, key: string, value: string) => {
      const fieldQueryKey = `${extensionId}~~${key}`;
      setFile?.((draft) => {
        if (draft) {
          draft.extensionConfigurations[fieldQueryKey] = value;
          draft.dirty = true;
          onChange?.(current(draft));
        }
        return draft;
      });
    },
    [onChange, setFile]
  );

  return [getValue, setValue] as const;
};

const InternalResourceEditor: React.ForwardRefRenderFunction<
  IResourceEditorRef,
  IResourceEditorProps
> = ({ onInitialized, onChange }, ref) => {
  const [css] = useStyletron();

  const [file, handleValueChange, setFile] = useFileState(ref, onChange);

  const databaseLocked = useDatabaseLocked();
  const tagTypeToReferenceMap = useTagTypeToReferenceMap(file);
  const handleResourceTagChange = useResourceTagChangeCallback(
    tagTypeToReferenceMap,
    onChange,
    setFile
  );
  const [episodesMap, episodeOptions] = useEpisodes();
  const [getExtensionSettings, setExtensionSettings] = useExtensionSettings(
    file,
    onChange,
    setFile
  );

  React.useEffect(() => {
    onInitialized?.();
  }, [onInitialized]);

  const handleCacheToHardDiskChange = useOnChangeEventWrapperForCheckboxType(
    handleValueChange.cacheToHardDisk
  );
  const handleEpisodesChange =
    useOnChangeEventWrapperForBaseUiSelectWithMultipleValue(
      handleValueChange.episodeIds
    );
  const preloadLevelSelectedValue =
    useValueOptionForBaseUiSelectWithSingleValue(
      file?.preloadLevel,
      PRELOAD_LEVELS
    );
  const handlePreloadLevelChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      handleValueChange.preloadLevel
    );
  const handlePreloadTriggersChange =
    useOnChangeEventWrapperForBaseUiSelectWithMultipleValue(
      handleValueChange.preloadTriggers
    );

  const episodesSelectValue = React.useMemo(
    () =>
      file
        ? file.episodeIds?.map((episodeId) => ({
            id: episodeId,
            label: episodesMap[episodeId],
          }))
        : [],
    [episodesMap, file]
  );

  const preloadTriggersSelectValue = React.useMemo(
    () =>
      file?.preloadTriggers?.map((x) => ({
        id: x,
        label: x,
        isCreatable: true,
      })) || [],
    [file]
  );

  if (!file) {
    return (
      <RecativeBlock
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        overflow="clip"
      >
        <NotFound width="320px" />
      </RecativeBlock>
    );
  }

  const urlKeys = Object.keys(file.url);
  const extensionKeys = Object.keys(file.extensionConfigurations);

  return (
    <RecativeBlock>
      {file.type !== 'group' && (
        <>
          <RecativeBlock>
            <Thumbnail
              className={css(previewStyles)}
              id={file?.id}
              label={file?.label}
              src={file?.thumbnailSrc}
            />
          </RecativeBlock>
          {!!file.managedBy && (
            <Hint Artwork={LockIconOutline}>
              <HintParagraph>
                This is a managed file, you can not update it manually.
              </HintParagraph>
            </Hint>
          )}
          <LabelLarge className={css(groupLabelStyles)}>Metadata</LabelLarge>
          <FormControl label="ID">
            <Input disabled value={file?.id} size={INPUT_SIZE.mini} />
          </FormControl>
          <FormControl label="MIME Type">
            <Input disabled value={file?.mimeType} size={INPUT_SIZE.mini} />
          </FormControl>
          <FormControl label="Date Imported">
            <Input
              disabled
              value={
                file?.importTime ? new Date(file.importTime).toISOString() : ''
              }
              size={INPUT_SIZE.mini}
            />
          </FormControl>
          <LabelLarge className={css(groupLabelStyles)}>Tags</LabelLarge>
          <RecativeBlock className={css(tagFormItemContainerStyles)}>
            {Object.keys(typeNameMap)
              .filter((x) => x !== 'meta-status' && x !== 'custom')
              .map((_typeId) => (
                <FormTagItem
                  key={_typeId}
                  disabled={databaseLocked || !!file.managedBy}
                  typeId={_typeId as unknown as LabelType}
                  onTagChange={handleResourceTagChange}
                  value={tagTypeToReferenceMap[_typeId as unknown as LabelType]}
                />
              ))}
          </RecativeBlock>
          <RecativeBlock>
            <FormTagItem
              creatable
              isCustom
              disabled={databaseLocked || !!file.managedBy}
              typeId={LabelType.Custom}
              onTagChange={handleResourceTagChange}
              value={tagTypeToReferenceMap[LabelType.Custom]}
            />
          </RecativeBlock>
        </>
      )}
      {(!file.resourceGroupId || file.type === 'group') && (
        <>
          <LabelLarge className={css(groupLabelStyles)}>
            Resource Loading
          </LabelLarge>
          <RecativeBlock className={css(preloadFormItemContainerStyles)}>
            <RecativeBlock>
              <FormControl label="Cache">
                <Toggle
                  checked={file?.cacheToHardDisk || false}
                  labelPlacement={LABEL_PLACEMENT.right}
                  onChange={handleCacheToHardDiskChange}
                  disabled={databaseLocked || !!file.managedBy}
                >
                  Cache Resource to Hard Disk
                </Toggle>
              </FormControl>
            </RecativeBlock>
            <RecativeBlock>
              <FormControl label="Level">
                <Select
                  value={preloadLevelSelectedValue}
                  options={PRELOAD_LEVELS}
                  placeholder="Select Level"
                  onChange={handlePreloadLevelChange}
                  disabled={databaseLocked || !!file.managedBy}
                  size={SELECT_SIZE.mini}
                />
              </FormControl>
            </RecativeBlock>
            <RecativeBlock>
              <FormControl label="Episodes">
                <Select
                  multi
                  options={episodeOptions}
                  placeholder="Episodes"
                  value={episodesSelectValue}
                  onChange={handleEpisodesChange}
                  disabled={databaseLocked || !!file.managedBy}
                  size={SELECT_SIZE.mini}
                />
              </FormControl>
            </RecativeBlock>
            <RecativeBlock>
              <FormControl label="Preload Triggers">
                <Select
                  multi
                  creatable
                  options={EMPTY_PRELOAD_TRIGGERS}
                  value={preloadTriggersSelectValue}
                  placeholder="Triggers"
                  onChange={handlePreloadTriggersChange}
                  disabled={databaseLocked || !!file.managedBy}
                  size={SELECT_SIZE.mini}
                />
              </FormControl>
            </RecativeBlock>
          </RecativeBlock>
          <RecativeBlock paddingTop="16px" paddingBottom="16px">
            <ExtensionConfiguration
              key={file.id}
              domain="resourceProcessor"
              type="resource"
              TitleComponent={LabelLarge}
              getValue={getExtensionSettings}
              setValue={setExtensionSettings}
              disabled={databaseLocked || !!file.managedBy}
            />
          </RecativeBlock>
        </>
      )}
      {file.type !== 'group' && (
        <>
          {file?.url && (
            <RecativeBlock>
              <LabelLarge className={css(groupLabelStyles)}>
                Uploaded URL
              </LabelLarge>
              {urlKeys.length ? (
                urlKeys.map((key) => (
                  <FormControl key={key} label={key}>
                    <Input
                      readOnly
                      value={file.url[key]}
                      size={INPUT_SIZE.mini}
                    />
                  </FormControl>
                ))
              ) : (
                <EmptySpace
                  title="Empty"
                  content="This file has not been uploaded to any CDN"
                />
              )}
            </RecativeBlock>
          )}
          {file?.extensionConfigurations && (
            <RecativeBlock>
              <LabelLarge className={css(groupLabelStyles)}>
                Extension Configurations
              </LabelLarge>
              {extensionKeys.length ? (
                extensionKeys.map((key) => (
                  <FormControl key={key} label={key}>
                    <Input
                      readOnly
                      value={file.extensionConfigurations[key]}
                      size={INPUT_SIZE.mini}
                    />
                  </FormControl>
                ))
              ) : (
                <EmptySpace
                  title="Empty"
                  content="This file is not configured for any extensions"
                />
              )}
            </RecativeBlock>
          )}
        </>
      )}
    </RecativeBlock>
  );
};

export const ResourceEditor = React.memo(
  React.forwardRef<IResourceEditorRef, IResourceEditorProps>(
    InternalResourceEditor
  )
);
ResourceEditor.whyDidYouRender = true;
