import * as React from 'react';

import { useImmer } from 'use-immer';
import type { Draft } from 'immer';

import type { SelectProps, OnChangeParams } from 'baseui/select';

import { noUndefined } from '../../../utils/noUndefined';
import type { WritableKeys } from '../../../utils/typeUtils';

export const useFormChangeCallbacks = <
  // eslint-disable-next-line @typescript-eslint/ban-types -- I KNOW WHAT AM I DOING!
  FieldTrueValue extends object,
  Field extends FieldTrueValue | null
>(
  field: Field,
  onChange?: (field: string, draft: Draft<Field> | null) => void
) => {
  type ImmutableDataType = Field extends null ? Field | null : Field;
  const [clonedValue, setClonedValue] = useImmer<ImmutableDataType>(
    field as ImmutableDataType
  );

  const fieldKeys = Object.keys(clonedValue || {}).join(',,,');

  const valueChangeFactory = React.useCallback(
    <T extends WritableKeys<Field>>(key: T) =>
      (value: FieldTrueValue[T]) => {
        setClonedValue((draft) => {
          const hackedPrevState = draft as FieldTrueValue | null;

          if (!hackedPrevState) return;

          hackedPrevState[key] = value;
          onChange?.(key.toString(), draft as Draft<Field>);
        });
      },
    [onChange, setClonedValue]
  );

  const callbacks = React.useMemo(() => {
    const result: Record<string, ReturnType<typeof valueChangeFactory>> = {};
    fieldKeys.split(',,,').forEach((key) => {
      result[key] = valueChangeFactory(key as WritableKeys<Field>);
    });

    return result;
  }, [fieldKeys, valueChangeFactory]) as Field extends null
    ? Record<string, undefined>
    : Record<WritableKeys<Field>, ReturnType<typeof valueChangeFactory>>;

  return [clonedValue, callbacks, valueChangeFactory, setClonedValue] as const;
};

export const useOnChangeEventWrapperForStringType = <
  T extends HTMLInputElement | HTMLTextAreaElement
>(
  callback: ((x: string) => void) | undefined
) => {
  return React.useCallback(
    (event: React.ChangeEvent<T>) => {
      callback?.(event.currentTarget.value);
    },
    [callback]
  );
};

export const useOnChangeEventWrapperForBooleanType = <
  T extends HTMLInputElement
>(
  callback: ((x: boolean) => void) | undefined
): React.FormEventHandler<T> => {
  return React.useCallback(
    (event: React.FormEvent<T>) => {
      callback?.(!!event.currentTarget.value);
    },
    [callback]
  );
};

export const useOnChangeEventWrapperForCheckboxType = <
  T extends HTMLInputElement
>(
  callback: ((x: boolean) => void) | undefined
): React.FormEventHandler<T> => {
  return React.useCallback(
    (event: React.FormEvent<T>) => {
      callback?.(event.currentTarget.checked);
    },
    [callback]
  );
};

export const useOnChangeEventWrapperForBaseUiSelectWithMultipleValue = (
  callback: ((x: string[]) => void) | undefined
): Exclude<SelectProps['onChange'], undefined> => {
  const result: SelectProps['onChange'] = React.useCallback(
    (event: OnChangeParams) => {
      callback?.(
        noUndefined(event.value.map((x) => x.id)).map((x) => x.toString())
      );
    },
    [callback]
  );

  return result;
};

export const useOnChangeEventWrapperForBaseUiSelectWithSingleValue = (
  callback: ((x: string) => void) | undefined
): Exclude<SelectProps['onChange'], undefined> => {
  const result: SelectProps['onChange'] = React.useCallback(
    (event: OnChangeParams) => {
      const value = event.value[0].id;
      if (value) {
        callback?.(value.toString());
      }
    },
    [callback]
  );

  return result;
};
