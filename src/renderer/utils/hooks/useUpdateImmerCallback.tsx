import * as React from 'react';

import {
  ACT_POINT_CONTENT_EXTENSION_ID,
  VIDEO_CONTENT_EXTENSION_ID,
} from '@recative/definitions';
import type { IResourceItem, IActPoint } from '@recative/definitions';

import { server } from 'utils/rpc';

export const useInputUpdateImmerCallback = <
  Key extends string,
  ObjectValue extends Record<Key, KeyValue>,
  ConvertFunction extends
    | ((
        value: string,
        event?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => KeyValue)
    | null,
  KeyValue extends ConvertFunction extends null ? string : ObjectValue[Key]
>(
  setValue: (updateFn: (draft: ObjectValue) => ObjectValue | void) => void,
  targetKey: Key,
  convertValueFn: ConvertFunction
) => {
  const handleChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue((draft: ObjectValue) => {
        if (!(targetKey in draft)) return;

        const { value } = event.currentTarget;

        if (convertValueFn === null) {
          (draft[targetKey] as unknown as string) = value;
        } else {
          (draft[targetKey] as unknown as KeyValue) = convertValueFn(
            value,
            event
          );
        }
      });
    },
    [convertValueFn, setValue, targetKey]
  );

  return handleChange;
};

export const useAssetUpdateImmerCallback = <
  ObjectValue extends
    | { contentId: string; contentExtensionId: string }
    | Record<never, never>
>(
  value: ObjectValue,
  setValue: (updateFn: (draft: ObjectValue) => ObjectValue | void) => void
) => {
  const [item, setItem] = React.useState<IActPoint | IResourceItem | null>(
    null
  );

  const contentId = 'contentId' in value ? value.contentId : null;

  React.useEffect(() => {
    if (contentId) {
      server
        .getResourceAndActPoints([contentId])
        .then((resource) => {
          if (resource[0]) setItem(resource[0]);
          return null;
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [contentId]);

  const handleChange = React.useCallback(
    (resource: IResourceItem | IActPoint) => {
      setValue((draft: ObjectValue) => {
        if (!('contentId' in draft)) return;

        draft.contentId = resource.id;
        draft.contentExtensionId =
          'firstLevelPath' in resource
            ? ACT_POINT_CONTENT_EXTENSION_ID
            : VIDEO_CONTENT_EXTENSION_ID;
        setItem(resource);
      });
    },
    [setValue]
  );
  return [item, handleChange] as const;
};
