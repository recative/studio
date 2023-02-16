import * as React from 'react';

import { FormControl } from 'baseui/form-control';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { VARIANT as TAG_VARIANT, SIZE as TAG_SIZE } from 'baseui/tag';

import { Select } from 'components/Select/Select';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import type { ISelectProps } from 'components/Select/Select';

import {
  labelColorMap,
  LabelType,
  tagsByType,
  typeNameMap,
} from '@recative/definitions';
import type {
  IResourceTag,
  IGroupTypeResourceTag,
} from '@recative/definitions';

interface IFormItemProps {
  typeId: LabelType;
  disabled?: boolean;
  value?: (IResourceTag | IGroupTypeResourceTag)[];
  creatable?: boolean;
  isCustom?: boolean;
  onTagChange: (
    typeId: LabelType,
    tagReference: (IResourceTag | IGroupTypeResourceTag)[]
  ) => void;
}

export const tagOverrides = {
  Root: {
    style: {
      height: '20px',
      paddingLeft: '4px',
      paddingRight: '4px',
      paddingTop: '0',
      paddingBottom: '0',
      marginTop: '4px',
      marginBottom: '4px',
      marginLeft: '2px',
      marginRight: '2px',
      borderRadius: '0',
    },
  },
  Text: {
    style: {
      fontSize: '10px',
      lineHeight: '12px',
    },
  },
};

const InternalFormTagItem: React.FC<IFormItemProps> = ({
  disabled,
  typeId,
  creatable,
  isCustom,
  value,
  onTagChange,
}) => {
  const handleChange: ISelectProps<
    IResourceTag | IGroupTypeResourceTag
  >['onChange'] = React.useCallback(
    (params) => {
      const idSet = new Set<string>();
      const filteredMetadata = params.value.filter((x) => {
        if (idSet.has(x.id)) return false;
        idSet.add(x.id);

        return x.type !== LabelType.MetaStatus;
      });

      if (isCustom) {
        onTagChange?.(
          typeId,
          filteredMetadata.map((x) => ({
            id: `${typeId}:${x.id ?? ''}`,
            label: x.id,
            type: LabelType.Custom,
          }))
        );
      }

      return onTagChange(typeId, filteredMetadata);
    },
    [isCustom, onTagChange, typeId]
  );

  return (
    <RecativeBlock>
      <FormControl label={typeNameMap[typeId]}>
        <Select<IResourceTag | IGroupTypeResourceTag>
          multi
          value={value}
          options={tagsByType[typeId]}
          creatable={creatable}
          disabled={disabled}
          size={SELECT_SIZE.mini}
          onChange={handleChange}
          overrides={{
            Tag: {
              props: {
                variant: TAG_VARIANT.light,
                size: TAG_SIZE.small,
                kind: labelColorMap[typeId],
                overrides: tagOverrides,
              },
            },
          }}
          filterOutSelected={false}
        />
      </FormControl>
    </RecativeBlock>
  );
};

export const FormTagItem = React.memo(InternalFormTagItem);
