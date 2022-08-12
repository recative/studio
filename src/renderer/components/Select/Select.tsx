import * as React from 'react';
import { UseControllerProps } from 'react-hook-form';
import { Select as OriginalSelect } from 'baseui/select';
import type {
  SelectProps as OriginalSelectProps,
  OnChangeParams,
} from 'baseui/select';

export interface Option {
  id?: string | number;
  label?: React.ReactNode;
  disabled?: boolean;
  clearableValue?: boolean;
  isCreatable?: boolean;
  __optgroup?: string;
}

export type OnChangeCallback<T> = (
  value: Omit<OnChangeParams, 'value'> & { value: ReadonlyArray<T> }
) => void;

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

export interface ISelectProps<T extends Option | Readonly<Option>>
  extends Omit<
    OriginalSelectProps,
    'onChange' | 'options' | 'value' | 'getOptionLabel' | 'getValueLabel'
  > {
  readonly options: T[];
  readonly value?: ReadonlyArray<T> | null;
  readonly onChange: (
    value: Omit<OnChangeParams, 'value'> & { value: ReadonlyArray<T> }
  ) => void;
  OptionLabel?: GetOptionLabel<T> | null;
  ValueLabel?: GetValueLabel<T> | null;
}

export const Select = <T extends Option>({
  onChange,
  value,
  OptionLabel,
  ValueLabel,
  ...props
}: ISelectProps<T>) => {
  return (
    <OriginalSelect
      {...props}
      value={value ?? undefined}
      onChange={onChange as unknown as OriginalSelectProps['onChange']}
      getOptionLabel={
        OptionLabel as unknown as OriginalSelectProps['getOptionLabel']
      }
      getValueLabel={
        ValueLabel as unknown as OriginalSelectProps['getValueLabel']
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
