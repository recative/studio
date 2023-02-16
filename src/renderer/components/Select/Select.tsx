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
  option?: T | undefined;
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
  readonly options: T[] | undefined;
  readonly value?: Array<T> | ReadonlyArray<T> | string[] | string | null;
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
  const nextValue = React.useMemo(
    () =>
      (typeof value === 'string' ? [value] : value)
        ?.map((x) =>
          typeof x === 'string' ? props.options?.find((y) => y.id === x) : x
        )
        .filter(Boolean) as T[],
    [props.options, value]
  );

  return (
    <OriginalSelect
      {...props}
      value={nextValue ?? undefined}
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
