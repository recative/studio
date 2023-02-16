import * as React from 'react';

import { FormControl } from 'baseui/form-control';
import { SIZE as SELECT_SIZE } from 'baseui/select';

import { Select } from 'components/Select/Select';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import type { ISelectProps } from 'components/Select/Select';

import {
  LabelType,
  tagsByType,
  typeNameMap,
  emptyResourceTag,
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
          filterOutSelected={false}
        />
      </FormControl>
    </RecativeBlock>
  );
};

export const FormTagItem = React.memo(InternalFormTagItem);
