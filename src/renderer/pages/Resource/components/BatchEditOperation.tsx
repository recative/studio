import * as React from 'react';

import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Select, SIZE as SELECT_SIZE } from 'baseui/select';
import { KIND as BUTTON_KIND, SIZE as BUTTON_SIZE } from 'baseui/button';

import type { OnChangeParams } from 'baseui/select';

import { IconButton } from 'components/Button/IconButton';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import { IEditOperation } from '../../../../utils/BatchEditTypes';
import {
  OPERATIONS,
  ARRAY_SEEK_FOR,
  OBJECT_SEEK_FOR,
  EDITABLE_FIELDS,
} from '../../../../utils/batchEditConstants';

interface IBatchEditOperationProps {
  value: IEditOperation;
  onChange: (
    id: string,
    value: IEditOperation | ((value: IEditOperation) => IEditOperation)
  ) => void;
  onRemove: (id: string) => void;
}

/**
 * An editor item component.
 */
export const BatchEditOperation: React.FC<IBatchEditOperationProps> = ({
  value,
  onChange,
  onRemove,
}) => {
  const fieldType = React.useMemo(
    () => EDITABLE_FIELDS.find((x) => x.field === value.field)?.type,
    [value]
  );

  const complexField = fieldType === 'array' || fieldType === 'object';

  const handleEditableFieldChange = React.useCallback(
    (params: OnChangeParams) => {
      const nextValue = params
        .value[0] as unknown as typeof EDITABLE_FIELDS[number];

      onChange(value.operationId, (prev) => ({
        ...prev,
        field: nextValue?.field || '',
      }));
    },
    [onChange, value.operationId]
  );

  const handleSeekForChange = React.useCallback(
    (params: OnChangeParams) => {
      const nextValue = params.value[0] as unknown as
        | typeof ARRAY_SEEK_FOR[number]
        | typeof OBJECT_SEEK_FOR[number];

      onChange(value.operationId, (prev) => ({
        ...prev,
        seekFor: nextValue?.seekFor || '',
      }));
    },
    [onChange, value.operationId]
  );

  const handleOperationChange = React.useCallback(
    (params: OnChangeParams) => {
      const nextValue = params.value[0] as unknown as typeof OPERATIONS[number];

      onChange(value.operationId, (prev) => ({
        ...prev,
        operation: nextValue?.op || '',
      }));
    },
    [onChange, value.operationId]
  );

  const handleWhereChange = React.useCallback(
    (params: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(value.operationId, (prev) => ({
        ...prev,
        where: params.currentTarget.value,
      }));
    },
    [onChange, value.operationId]
  );

  const handleValueChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const stringValue = event.currentTarget.value;

      let finalValue: unknown = stringValue;

      switch (fieldType) {
        case 'boolean':
          finalValue = stringValue.startsWith('t');
          break;
        case 'string':
        case 'array':
          finalValue = stringValue;
          break;
        default:
          throw new Error('Not implemented');
          break;
      }

      onChange(
        value.operationId,
        (prev) =>
          ({
            ...prev,
            value: finalValue,
          } as IEditOperation)
      );
    },
    [fieldType, onChange, value.operationId]
  );

  const handleKeyChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const stringValue = event.currentTarget.value;

      onChange(
        value.operationId,
        (prev) =>
          ({
            ...prev,
            key: stringValue,
          } as IEditOperation)
      );
    },
    [onChange, value.operationId]
  );

  const fieldSelectValue = React.useMemo(() => {
    const field = EDITABLE_FIELDS.find((x) => x.field === value.field);

    return field ? [field] : undefined;
  }, [value.field]);

  const seekForSelectValue = React.useMemo(() => {
    if (!('seekFor' in value)) {
      return undefined;
    }

    const seekFor =
      fieldType === 'array'
        ? ARRAY_SEEK_FOR.find((x) => x.seekFor === value.seekFor)
        : OBJECT_SEEK_FOR.find((x) => x.seekFor === value.seekFor);

    return seekFor ? [seekFor] : undefined;
  }, [fieldType, value]);

  const operationValue = 'operation' in value ? value.operation : '';
  const operationSelectValue = React.useMemo(() => {
    const operation = OPERATIONS.find((x) => x.op === operationValue);

    return operation ? [operation] : undefined;
  }, [operationValue]);

  const whereValue = React.useMemo(() => {
    if (!('where' in value)) {
      return undefined;
    }

    return value.where;
  }, [value]);

  const KeyValue = React.useMemo(() => {
    if (!('key' in value)) {
      return undefined;
    }

    return value.key;
  }, [value]);

  const handleRemove = React.useCallback(() => {
    onRemove(value.operationId);
  }, [onRemove, value.operationId]);

  return (
    <Block width="100%" paddingBottom="8px">
      <FormControl label="What">
        <Select
          clearable={false}
          size={SELECT_SIZE.mini}
          value={fieldSelectValue}
          options={EDITABLE_FIELDS}
          onChange={handleEditableFieldChange}
        />
      </FormControl>
      {complexField && (
        <FormControl label="How">
          <Select
            clearable={false}
            size={SELECT_SIZE.mini}
            value={operationSelectValue}
            options={OPERATIONS}
            onChange={handleOperationChange}
          />
        </FormControl>
      )}
      {complexField &&
        (operationValue === 'edit' || operationValue === 'remove') && (
          <FormControl label="Where">
            <Block display="flex">
              <Block paddingRight="8px">
                <Select
                  clearable={false}
                  size={SELECT_SIZE.mini}
                  value={seekForSelectValue}
                  onChange={handleSeekForChange}
                  options={
                    fieldType === 'array' ? ARRAY_SEEK_FOR : OBJECT_SEEK_FOR
                  }
                />
              </Block>
              <Input
                size={INPUT_SIZE.mini}
                value={whereValue}
                onChange={handleWhereChange}
              />
            </Block>
          </FormControl>
        )}
      {operationValue !== 'remove' && (
        <>
          <FormControl label="To">
            <Block display="flex">
              {fieldType === 'object' && (
                <Block paddingRight="8px">
                  <Input
                    size={INPUT_SIZE.mini}
                    value={KeyValue}
                    onChange={handleKeyChange}
                    placeholder="key"
                  />
                </Block>
              )}
              <Input
                size={INPUT_SIZE.mini}
                value={value.value.toString()}
                onChange={handleValueChange}
                placeholder="value"
              />
            </Block>
          </FormControl>
          <Block display="flex" justifyContent="flex-end">
            <IconButton
              kind={BUTTON_KIND.tertiary}
              startEnhancer={<TrashIconOutline width={14} />}
              onClick={handleRemove}
              size={BUTTON_SIZE.mini}
            />
          </Block>
        </>
      )}
    </Block>
  );
};
