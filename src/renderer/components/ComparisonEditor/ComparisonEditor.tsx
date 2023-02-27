import * as React from 'react';

import { SIZE as SELECT_SIZE } from 'baseui/select';

import { ComparisonOperator, comparisonOperators } from '@recative/node-system';

import {
  ITypedData,
  ITypedDataEditor,
  TypedDataEditor,
} from 'components/TypedDataEditor/TypedDataEditor';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import {
  GetOptionLabel,
  GetValueLabel,
  ISelectProps,
  Select,
} from 'components/Select/Select';
import { OpNeqIconOutline } from 'components/Icons/OpNeqIconOutline';
import { OpGtEqIconOutline } from 'components/Icons/OpGtEqIconOutline';
import { OpLsIconOutline } from 'components/Icons/OpLsIconOutline';
import { OpLsEqIconOutline } from 'components/Icons/OpLsEqIconOutline';
import { LabelXSmall } from 'baseui/typography';
import { OpGtIconOutline } from 'components/Icons/OpGtIconOutline';
import { OpWkEqIconOutline } from 'components/Icons/OpWkEqIconOutline';
import { OpWkNeqIconOutline } from 'components/Icons/OpWkNeqIconOutline';
import { OpStEqIconOutline } from 'components/Icons/OpStEqIconOutline';

export interface ICompareTypedData extends ITypedData {
  operator: string;
}

const operatorTypeMap: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  weakEq: OpWkEqIconOutline,
  weakNeq: OpWkNeqIconOutline,
  strongEq: OpStEqIconOutline,
  strongNeq: OpNeqIconOutline,
  gt: OpGtIconOutline,
  lt: OpLsIconOutline,
  gtEq: OpGtEqIconOutline,
  ltEq: OpLsEqIconOutline,
};

export interface IComparisonEditor {
  value: ICompareTypedData;
  onChange: (x: ICompareTypedData) => void;
}

const SELECT_OVERRIDE = {
  Root: {
    style: {
      width: '36px',
    },
  },
  Input: {
    style: {
      opacity: 0,
    },
  },
  InputContainer: {
    style: {
      height: '14px',
    },
  },
  ValueContainer: {
    style: {
      paddingTop: '9px',
      paddingBottom: '9px',
      paddingLeft: '6px',
      lineHeight: '14px',
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

export const ComparisonEditor: React.FC<IComparisonEditor> = ({
  value,
  onChange,
}) => {
  const handleOperatorChange: ISelectProps<ComparisonOperator>['onChange'] =
    React.useCallback(
      (event) => {
        onChange({
          operator: event.value[0].id,
          type: value.type,
          value: value.value,
        });
      },
      [onChange, value.type, value.value]
    );

  const handleValueChange: ITypedDataEditor['onChange'] = React.useCallback(
    (event) => {
      onChange({
        operator: value.operator,
        type: event.type,
        value: event.value,
      });
    },
    [onChange, value.operator]
  );

  const selectValue = React.useMemo(
    () => comparisonOperators.filter((x) => x.id === value.operator),
    [value.operator]
  );

  const ValueLabel: GetValueLabel<ComparisonOperator> = React.useCallback(
    ({ option: { id } }) => {
      const Component = operatorTypeMap[id];

      return (
        <RecativeBlock maxHeight="14px" marginBottom="-2px">
          <Component width={14} />
        </RecativeBlock>
      );
    },
    []
  );

  const OptionLabel: GetOptionLabel<ComparisonOperator> = React.useCallback(
    (props) => {
      const { option, optionState } = props;
      if (!option) return <RecativeBlock />;

      const { id, label } = option;
      const Component = operatorTypeMap[id];
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
    },
    []
  );

  return (
    <RecativeBlock display="flex">
      <RecativeBlock marginRight="4px">
        <Select
          onChange={handleOperatorChange}
          ValueLabel={ValueLabel}
          OptionLabel={OptionLabel}
          size={SELECT_SIZE.mini}
          value={selectValue}
          options={comparisonOperators}
          overrides={SELECT_OVERRIDE}
        />
      </RecativeBlock>
      <TypedDataEditor onChange={handleValueChange} value={value} />
    </RecativeBlock>
  );
};
