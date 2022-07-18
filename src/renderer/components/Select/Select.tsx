import * as React from 'react';
import { UseControllerProps } from 'react-hook-form';
import { Select as OriginalSelect } from 'baseui/select';
import type {
  SelectProps as OriginalSelectProps,
  OnChangeParams,
} from 'baseui/select';

interface Option {
  readonly id?: string | number;
  readonly label?: React.ReactNode;
  readonly disabled?: boolean;
  readonly clearableValue?: boolean;
  readonly isCreatable?: boolean;
  readonly __optgroup?: string;
}

export type GetOptionLabel<T extends Option> = (args: {
  option?: T;
  optionState: {
    $selected?: boolean;
    $disabled?: boolean;
    $isHighlighted?: boolean;
  };
}) => React.ReactNode;
export type GetValueLabel<T extends Option> = (args: {
  option: T;
}) => React.ReactNode;

export interface SelectProps<T extends Option>
  extends Omit<
    OriginalSelectProps,
    'onChange' | 'options' | 'value' | 'getOptionLabel' | 'getValueLabel'
  > {
  readonly options: T[];
  readonly value?: ReadonlyArray<T> | null;
  readonly onChange: (
    value: Omit<OnChangeParams, 'value'> & { value: ReadonlyArray<T> }
  ) => void;
  getOptionLabel?: GetOptionLabel<T>;
  getValueLabel?: GetValueLabel<T>;
}

export const Select = <T extends Option>({
  onChange,
  value,
  getOptionLabel,
  getValueLabel,
  ...props
}: SelectProps<T>) => {
  return (
    <OriginalSelect
      {...props}
      value={value ?? undefined}
      onChange={onChange as unknown as OriginalSelectProps['onChange']}
      getOptionLabel={
        getOptionLabel as unknown as OriginalSelectProps['getOptionLabel']
      }
      getValueLabel={
        getValueLabel as unknown as OriginalSelectProps['getValueLabel']
      }
    />
  );
};

export interface ControlledSelectProps<T extends Option>
  extends UseControllerProps<T>,
    Omit<
      OriginalSelectProps,
      'onChange' | 'options' | 'value' | 'getOptionLabel' | 'getValueLabel'
    > {
  readonly options: T[];
  getOptionLabel?: GetOptionLabel<T>;
  getValueLabel?: GetValueLabel<T>;
}
