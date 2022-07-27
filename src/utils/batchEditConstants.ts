export const EDITABLE_FIELDS = [
  {
    id: 'url',
    field: 'url',
    type: 'object',
    label: 'URL',
  },
  {
    id: 'cacheToHardDisk',
    field: 'cacheToHardDisk',
    type: 'boolean',
    label: 'Cache to hard disk',
  },
  {
    id: 'preloadLevel',
    field: 'preloadLevel',
    type: 'string',
    label: 'Preload level',
  },
  {
    id: 'preloadTriggers',
    field: 'preloadTriggers',
    type: 'array',
    label: 'Preload triggers',
  },
  {
    id: 'episodeIds',
    field: 'episodeIds',
    type: 'array',
    label: 'Episode IDs',
  },
  {
    id: 'tags',
    field: 'tags',
    type: 'array',
    label: 'Tags',
  },
  {
    id: 'mimeType',
    field: 'mimeType',
    type: 'string',
    label: 'MIME Type',
  },
  {
    id: 'extensionConfigurations',
    field: 'extensionConfigurations',
    type: 'object',
    label: 'Extension Configurations',
  },
] as const;

// 'eq' | 'contains' | 'startsWith' | 'endWith'
export const ARRAY_SEEK_FOR = [
  {
    seekFor: 'eq',
    label: 'equals to',
    id: 'eq',
  },
  {
    seekFor: 'contains',
    label: 'contains',
    id: 'contains',
  },
  {
    seekFor: 'startsWith',
    label: 'starts with',
    id: 'startsWith',
  },
  {
    seekFor: 'endsWith',
    label: 'ends with',
    id: 'endsWith',
  },
] as const;

// 'keyEq' | 'valEq' | 'valContains' | 'valStartsWith' | 'valEndWith'
export const OBJECT_SEEK_FOR = [
  {
    seekFor: 'keyEq',
    label: 'key equals to',
    id: 'keyEq',
  },
  {
    seekFor: 'valEq',
    label: 'value equals to',
    id: 'valEq',
  },
  {
    seekFor: 'valContains',
    label: 'value contains',
    id: 'valContains',
  },
  {
    seekFor: 'valStartsWith',
    label: 'value starts with',
    id: 'valStartsWith',
  },
  {
    seekFor: 'valEndsWith',
    label: 'value ends with',
    id: 'valEndsWith',
  },
] as const;

// 'add' | 'remove' | 'edit'
export const OPERATIONS = [
  {
    op: 'add',
    label: 'Add',
    id: 'add',
  },
  {
    op: 'remove',
    label: 'Remove',
    id: 'remove',
  },
  {
    op: 'edit',
    label: 'Edit',
    id: 'edit',
  },
] as const;
