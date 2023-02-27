import * as React from 'react';

import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { LabelXSmall } from 'baseui/typography';
import { SIZE as SELECT_SIZE } from 'baseui/select';

import {
  PrimitiveTypeAnnotation,
  primitiveTypeAnnotations,
} from '@recative/node-system';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { DtStrIconOutline } from 'components/Icons/DtStrIconOutline';
import { DtNumIconOutline } from 'components/Icons/DtNumIconOutline';
import { DtBoolIconOutline } from 'components/Icons/DtBoolIconOutline';
import { DtNullIconOutline } from 'components/Icons/DtNullIconOutline';
import { DtNaNEqIconOutline } from 'components/Icons/DtNaNEqIconOutline';
import { DtUndefIconOutline } from 'components/Icons/DtUndefIconOutline';
import {
  GetOptionLabel,
  GetValueLabel,
  ISelectProps,
  Select,
} from 'components/Select/Select';

import { useEvent } from 'utils/hooks/useEvent';

export interface ITypedData {
  type: string;
  value: string;
}

const dataTypeMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  string: DtStrIconOutline,
  number: DtNumIconOutline,
  boolean: DtBoolIconOutline,
  nan: DtNaNEqIconOutline,
  undefined: DtUndefIconOutline,
  null: DtNullIconOutline,
};

const SELECT_OVERRIDE = {
  Input: {
    style: {
      opacity: 0,
    },
  },
  ValueContainer: {
    style: {
      maxHeight: '24px',
      paddingLeft: '4px',
    },
  },
  IconsContainer: {
    style: { display: 'none' },
  },
  Dropdown: {
    style: {
      width: '140px',
    },
  },
  ClearIcon: {
    props: {
      overrides: {
        Svg: {
          style: { display: 'none' },
        },
      },
    },
  },
};

const INPUT_OVERRIDE = {
  Root: {
    style: {
      paddingLeft: '4px',
      paddingRight: '4px',
    },
  },
  Input: {
    style: {
      paddingLeft: '8px',
    },
  },
  StartEnhancer: {
    style: {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
};

export interface ITypedDataEditor {
  value: ITypedData;
  onChange: (x: ITypedData) => void;
}

export const TypedDataEditor: React.FC<ITypedDataEditor> = ({
  value,
  onChange,
}) => {
  const handleValueChange = useEvent(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ type: value.type, value: event.target.value });
    }
  );

  const handleTypeChange: ISelectProps<PrimitiveTypeAnnotation>['onChange'] =
    React.useCallback(
      (event) => {
        onChange({ type: event.value[0].id, value: value.value });
      },
      [onChange, value.value]
    );

  const ValueLabel: GetValueLabel<PrimitiveTypeAnnotation> = React.useCallback(
    ({ option: { id } }) => {
      const Component = dataTypeMap[id];

      return (
        <RecativeBlock marginRight="2px">
          <Component width={16} />
        </RecativeBlock>
      );
    },
    []
  );

  const OptionLabel: GetOptionLabel<PrimitiveTypeAnnotation> =
    React.useCallback((props) => {
      const { option, optionState } = props;
      if (!option) return <RecativeBlock />;

      const { id, label } = option;
      const Component = dataTypeMap[id];
      return (
        <RecativeBlock display="flex" alignItems="center">
          <RecativeBlock
            marginRight="10px"
            lineHeight="14px"
            maxHeight="14px"
            filter={
              optionState.$selected
                ? new Array(8).fill('drop-shadow(0 0 0.15px black)').join(' ')
                : new Array(3).fill('drop-shadow(0 0 0.15px black)').join(' ')
            }
          >
            <Component width={14} />
          </RecativeBlock>
          <LabelXSmall>
            <RecativeBlock fontWeight={optionState.$selected ? 800 : undefined}>
              {label}
            </RecativeBlock>
          </LabelXSmall>
        </RecativeBlock>
      );
    }, []);

  const selectValue = React.useMemo(
    () => primitiveTypeAnnotations.filter((x) => x.id === value.type),
    [value.type]
  );

  return (
    <Input
      value={value.value}
      onChange={handleValueChange}
      overrides={INPUT_OVERRIDE}
      size={INPUT_SIZE.compact}
      startEnhancer={
        <Select
          onChange={handleTypeChange}
          ValueLabel={ValueLabel}
          OptionLabel={OptionLabel}
          size={SELECT_SIZE.mini}
          value={selectValue}
          options={primitiveTypeAnnotations}
          overrides={SELECT_OVERRIDE}
        />
      }
      placeholder="Controlled Input"
      clearOnEscape
    />
  );
};
