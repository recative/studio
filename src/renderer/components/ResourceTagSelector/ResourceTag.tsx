import * as React from 'react';

import { labelColorMap, tagIdMap, LabelType } from '@recative/definitions';

import { Tag, VARIANT } from 'baseui/tag';

import { useEvent } from 'utils/hooks/useEvent';

const tagOverrides = {
  Root: {
    style: {
      height: '20px',
      paddingLeft: '4px',
      paddingRight: '4px',
      paddingTop: '0',
      paddingBottom: '0',
      marginTop: '0',
      marginBottom: '0',
      marginLeft: '2px',
      marginRight: '2px',
      borderRadius: '0',
      userSelect: 'none',
    },
  },
  Text: {
    style: {
      fontSize: '10px',
      lineHeight: '12px',
    },
  },
};

export interface IResourceTag {
  value: string;
  onRemove?: (x: string) => void;
}

export const ResourceTag: React.FC<IResourceTag> = ({ value, onRemove }) => {
  const splitedTag = value?.split(':');
  const tagType = splitedTag[0] as LabelType;
  const tagValue = splitedTag[1] as LabelType;

  const handleRemove = useEvent((event: Event) => {
    event.stopPropagation();
    onRemove?.(value);
  });

  return (
    <Tag
      variant={VARIANT.outlined}
      kind={labelColorMap[tagType]}
      overrides={tagOverrides}
      onClick={handleRemove}
      onActionClick={handleRemove}
    >
      {tagIdMap[value]?.label || tagValue}
    </Tag>
  );
};
