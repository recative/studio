import * as React from 'react';

import { current } from 'immer';

import type { Draft } from 'immer';
import type { Updater } from 'use-immer';
import type { StyleObject } from 'styletron-react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { Block } from 'baseui/block';
import { Input } from 'baseui/input';
import { Textarea, SIZE as TEXTAREA_SIZE } from 'baseui/textarea';
import { LabelLarge } from 'baseui/typography';
import { FormControl } from 'baseui/form-control';
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';

import { Select } from 'components/Select/Select';
import { NotFound } from 'components/Illustrations/NotFound';
import { ExtensionConfiguration } from 'components/ExtensionConfiguration/ExtensionConfiguration';
import type { SelectProps } from 'components/Select/Select';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForCheckboxType,
  useOnChangeEventWrapperForBaseUiSelectWithMultipleValue,
  useOnChangeEventWrapperForBaseUiSelectWithSingleValue,
} from 'utils/hooks/useFormChangeCallbacks';

import {
  LabelType,
  tagsByType,
  typeNameMap,
  tagIdMap,
  emptyResourceTag,
  PreloadLevel,
} from '@recative/definitions';
import type {
  IResourceTag,
  IEditableResourceFile,
  IGroupTypeResourceTag,
} from '@recative/definitions';
import { server } from 'utils/rpc';

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
  ['cacheToHardDisk', 'preloadLevel', 'preloadTriggers', 'episodeIds'];

interface IFormItemProps {
  typeId: LabelType;
  disabled?: boolean;
  tagReference?: IResourceTag | IGroupTypeResourceTag;
  custom?: boolean;
  onTagChange: (typeId: LabelType, tagReference: IResourceTag) => void;
}

interface SelectOption<Id = string> {
  id: Id;
  label: string;
}

const previewStyles: StyleObject = {
  width: '100%',
  height: '25vh',
  background: '#f1f1f1',
  objectFit: 'contain',
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

const InternalFormTagItem: React.FC<IFormItemProps> = ({
  disabled,
  typeId,
  custom,
  tagReference,
  onTagChange,
}) => {
  const tag = tagsByType[typeId];

  const options = React.useMemo(() => [emptyResourceTag, ...tag], [tag]);

  const handleChange: SelectProps<
    IResourceTag | IGroupTypeResourceTag
  >['onChange'] = React.useCallback(
    (params) => {
      if (custom && params.value[0]?.type !== LabelType.MetaStatus) {
        const createdTag = params.value[0]?.id || '';
        return onTagChange(typeId, {
          id: `${typeId}:${createdTag}`,
          label: createdTag,
          type: LabelType.Custom,
        });
      }
      return onTagChange(typeId, params.value[0] as unknown as IResourceTag);
    },
    [custom, onTagChange, typeId]
  );

  const value = React.useMemo(
    () => [tagReference || emptyResourceTag],
    [tagReference]
  );

  return (
    <Block>
      <FormControl label={typeNameMap[typeId]}>
        <Select
          creatable={custom}
          disabled={disabled}
          options={options}
          value={value}
          placeholder="Select color"
          onChange={handleChange}
        />
      </FormControl>
    </Block>
  );
};

const FormTagItem = React.memo(InternalFormTagItem);

const useTagTypeToReferenceMap = (file?: IEditableResource | null) => {
  const tags = file?.tags.join(',,,');

  return React.useMemo(() => {
    const tagTypeToReferenceMap: Partial<
      Record<LabelType, IResourceTag | IGroupTypeResourceTag>
    > = {};

    tags?.split(',,,').forEach((tag) => {
      const splitedTag = tag.split(':');
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
      tagTypeToReferenceMap[tagType] = tagReference;
    });

    return tagTypeToReferenceMap;
  }, [tags]);
};

const useResourceTagChangeCallback = (
  tagTypeToReferenceMap: Partial<
    Record<LabelType, IResourceTag | IGroupTypeResourceTag>
  >,
  onChange?: (x: IEditableResource) => void,
  setFile?: Updater<IEditableResource | null>
) => {
  const handleResourceTagChange = React.useCallback(
    (type: LabelType, nextTagReference: IResourceTag) => {
      tagTypeToReferenceMap[type] = nextTagReference;

      const nextTags = Object.values(tagTypeToReferenceMap).map((x) => x.id);

      setFile?.((draft) => {
        if (draft) {
          const result: IEditableResource = {
            ...draft,
            tags: nextTags,
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
    episodesForSelectAction.execute();
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

const usePluginSettings = (
  file: IEditableResource | null,
  setFile: Updater<IEditableResource | null>
) => {
  const getValue = React.useCallback(
    (extensionId: string, fieldId: string) => {
      const fieldQueryKey = `${extensionId}~~${fieldId}`;
      return file?.pluginConfigurations[fieldQueryKey] || '';
    },
    [file]
  );

  const setValue = React.useCallback(
    (extensionId: string, key: string, value: string) => {
      const fieldQueryKey = `${extensionId}~~${key}`;
      setFile((draft) => {
        if (draft) {
          draft.pluginConfigurations[fieldQueryKey] = value;
        }
        return draft;
      });
    },
    [setFile]
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
  const [getPluginSettings, setPluginSettings] = usePluginSettings(
    file,
    setFile
  );

  const levelSelectValue = React.useMemo(
    () =>
      file
        ? [
            {
              id: file?.preloadLevel || PreloadLevel.None,
              label: PRELOAD_LEVEL_MAP[file?.preloadLevel],
            },
          ]
        : [],
    [file]
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
      <Block
        display="flex"
        justifyContent="center"
        alignItems="center"
        maxHeight="--webkit-fill-available"
        overflow="hidden"
      >
        <NotFound width="320px" />
      </Block>
    );
  }

  return (
    <Block>
      {file.type !== 'group' && (
        <>
          <Block>
            <img
              className={css(previewStyles)}
              src={file?.thumbnailSrc || ''}
              alt={file?.label}
            />
          </Block>
          <LabelLarge className={css(groupLabelStyles)}>Metadata</LabelLarge>
          <FormControl label="ID">
            <Input disabled value={file?.id} />
          </FormControl>
          <FormControl label="MIME Type">
            <Input disabled value={file?.mimeType} />
          </FormControl>
          <FormControl label="Date Imported">
            <Input
              disabled
              value={
                file?.importTime ? new Date(file.importTime).toISOString() : ''
              }
            />
          </FormControl>
          <LabelLarge className={css(groupLabelStyles)}>Tags</LabelLarge>
          <Block className={css(tagFormItemContainerStyles)}>
            {Object.keys(typeNameMap)
              .filter((x) => x !== 'meta-status' && x !== 'custom')
              .map((_typeId) => (
                <FormTagItem
                  key={_typeId}
                  disabled={databaseLocked}
                  typeId={_typeId as unknown as LabelType}
                  onTagChange={handleResourceTagChange}
                  tagReference={
                    tagTypeToReferenceMap[_typeId as unknown as LabelType]
                  }
                />
              ))}
          </Block>
          <Block>
            <FormTagItem
              custom
              disabled={databaseLocked}
              typeId={LabelType.Custom}
              onTagChange={handleResourceTagChange}
              tagReference={tagTypeToReferenceMap[LabelType.Custom]}
            />
          </Block>
        </>
      )}
      {(!file.resourceGroupId || file.type === 'group') && (
        <>
          <LabelLarge className={css(groupLabelStyles)}>
            Resource Loading
          </LabelLarge>
          <Block className={css(preloadFormItemContainerStyles)}>
            <Block>
              <FormControl label="Cache">
                <Checkbox
                  checked={file?.cacheToHardDisk || false}
                  checkmarkType={STYLE_TYPE.toggle_round}
                  labelPlacement={LABEL_PLACEMENT.right}
                  onChange={handleCacheToHardDiskChange}
                >
                  Cache Resource to Hard Disk
                </Checkbox>
              </FormControl>
            </Block>
            <Block>
              <FormControl label="Level">
                <Select
                  value={levelSelectValue}
                  options={PRELOAD_LEVELS}
                  placeholder="Select Level"
                  onChange={handlePreloadLevelChange}
                />
              </FormControl>
            </Block>
            <Block>
              <FormControl label="Episodes">
                <Select
                  multi
                  options={episodeOptions}
                  placeholder="Episodes"
                  value={episodesSelectValue}
                  onChange={handleEpisodesChange}
                />
              </FormControl>
            </Block>
            <Block>
              <FormControl label="Preload Triggers">
                <Select
                  multi
                  creatable
                  options={EMPTY_PRELOAD_TRIGGERS}
                  value={preloadTriggersSelectValue}
                  placeholder="Triggers"
                  onChange={handlePreloadTriggersChange}
                />
              </FormControl>
            </Block>
          </Block>
        </>
      )}
      {file.type !== 'group' && (
        <>
          <LabelLarge className={css(groupLabelStyles)}>Extensions</LabelLarge>
          <ExtensionConfiguration
            domain="resourceProcessor"
            type="resource"
            getValue={getPluginSettings}
            setValue={setPluginSettings}
          />
          <LabelLarge className={css(groupLabelStyles)}>
            Uploaded URL
          </LabelLarge>
          <Textarea
            disabled
            size={TEXTAREA_SIZE.compact}
            value={JSON.stringify(file?.url, null, 2) ?? ''}
          />
        </>
      )}
    </Block>
  );
};

export const ResourceEditor = React.memo(
  React.forwardRef<IResourceEditorRef, IResourceEditorProps>(
    InternalResourceEditor
  )
);
ResourceEditor.whyDidYouRender = true;
