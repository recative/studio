import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { Block } from 'baseui/block';
import { ButtonGroup } from 'baseui/button-group';
import { FormControl } from 'baseui/form-control';
import { ParagraphLarge } from 'baseui/typography';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Button, SIZE as BUTTON_SIZE } from 'baseui/button';
import {
  Checkbox,
  STYLE_TYPE as CHECKBOX_STYLE_TYPE,
  LABEL_PLACEMENT as CHECKBOX_LABEL_PLACEMENT,
} from 'baseui/checkbox';

import type { IConfigUiField } from '@recative/extension-sdk';

import { Toggle } from 'components/Toggle/Toggle';
import { ExtensionIconFilled } from 'components/Icons/ExtensionIconFilled';

import { server } from 'utils/rpc';

export interface IExtensionConfigurationProps {
  domain: 'uploader' | 'resourceProcessor';
  type: 'plugin' | 'resource';
  disabled?: boolean;
  TitleComponent?: React.FC<{ children: React.ReactNode }>;
  getValue: (extensionId: string, key: string) => string;
  setValue: (
    extensionId: string,
    key: string,
    value: string
  ) => void | Promise<void>;
}

const pluginTitleContainerStyles = {
  display: 'flex',
  alignItems: 'center',
} as const;

const optionsStyle = { textTransform: 'capitalize' } as const;

const iconContainerStyle = {
  height: '1em',
  marginLeft: '6px',
  opacity: 0.6,
  transform: 'translateY(-5%)',
} as const;

const useExtensionMetadata = (
  domain: IExtensionConfigurationProps['domain'],
  type: IExtensionConfigurationProps['type']
) => {
  const [extensionMetadata, extensionMetadataActions] = useAsync(async () => {
    const serverSideExtensionMetadata = await server.getExtensionMetadata();

    const result = serverSideExtensionMetadata[domain].map((uploader) => {
      let fields: IConfigUiField[] | undefined;
      if (type === 'plugin') {
        fields = uploader.pluginConfigUiFields;
      } else if (type === 'resource') {
        fields = uploader.resourceConfigUiFields;
      } else {
        throw new TypeError(`Unknown field domain: ${domain}`);
      }

      return {
        id: uploader.id,
        label: uploader.label,
        fields,
      };
    });

    return result;
  });

  React.useEffect(() => {
    extensionMetadataActions.execute();
  }, [
    type,
    domain,
    extensionMetadataActions,
    extensionMetadataActions.execute,
  ]);

  return extensionMetadata.result || [];
};

export const ExtensionConfiguration: React.FC<IExtensionConfigurationProps> = ({
  domain,
  type,
  disabled,
  TitleComponent = ParagraphLarge,
  getValue,
  setValue,
}) => {
  const [css] = useStyletron();

  const extensionMetadata = useExtensionMetadata(domain, type);

  const [overwrittenValue, setOverwrittenValue] = React.useState<
    Record<string, string>
  >({});

  const onChangeCallbacks = React.useMemo(() => {
    const result: Record<string, any> = {};

    const syncValue = (extensionId: string, fieldId: string, value: string) => {
      const fieldQueryKey = `${extensionId}~~${fieldId}`;

      setValue(extensionId, fieldId, value);
      setOverwrittenValue((oldValue) => {
        const newValue = { ...oldValue };
        newValue[fieldQueryKey] = value;
        return newValue;
      });
    };

    extensionMetadata.forEach((extension) => {
      extension.fields?.forEach((field) => {
        const fieldQueryKey = `${extension.id}~~${field.id}`;
        if (field.type === 'string') {
          result[fieldQueryKey] = (
            event: React.FormEvent<HTMLInputElement>
          ) => {
            syncValue(extension.id, field.id, event.currentTarget.value);
          };
        } else if (field.type === 'boolean') {
          result[fieldQueryKey] = (
            event: React.FormEvent<HTMLInputElement>
          ) => {
            syncValue(
              extension.id,
              field.id,
              event.currentTarget.checked ? 'yes' : 'no'
            );
          };
        } else if (field.type === 'groupedBoolean') {
          result[fieldQueryKey] = (
            _event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
            index: number
          ) => {
            const configKey = field.ids[index];
            const value = getValue(extension.id, configKey);
            syncValue(extension.id, configKey, value === 'yes' ? 'no' : 'yes');
          };
        } else {
          throw new TypeError(
            `Unknown field type: ${(field as { type: string }).type}`
          );
        }
      });
    });

    return result;
  }, [extensionMetadata, getValue, setValue]);

  const groupedBooleanSelectedValues = React.useMemo(() => {
    const result: Record<string, number[]> = {};

    extensionMetadata.forEach((extension) => {
      extension.fields?.forEach((field) => {
        const fieldQueryKey = `${extension.id}~~${field.id}`;
        if (field.type === 'groupedBoolean') {
          result[fieldQueryKey] = field.ids
            .map((id, index) =>
              (overwrittenValue[fieldQueryKey] ??
                getValue(extension.id, id)) === 'yes'
                ? -1
                : index
            )
            .filter((x) => x !== -1);
        }
      });
    });

    return result;
  }, [extensionMetadata, getValue, overwrittenValue]);

  return (
    <Block>
      {extensionMetadata.map((extension) => {
        return (
          <Block key={extension.id}>
            <TitleComponent>
              <span className={css(pluginTitleContainerStyles)}>
                <span>{extension.label}</span>
                <span className={css(iconContainerStyle)}>
                  <ExtensionIconFilled width="1em" height="1em" />
                </span>
              </span>
            </TitleComponent>
            {extension.fields &&
              extension.fields.map(({ id, ...config }) => {
                const fieldQueryKey = `${extension.id}~~${id}`;
                if (config.type === 'string') {
                  return (
                    <FormControl key={id} label={config.label}>
                      <Input
                        size={INPUT_SIZE.mini}
                        disabled={disabled}
                        value={
                          overwrittenValue[fieldQueryKey] ??
                          getValue(extension.id, id)
                        }
                        onChange={onChangeCallbacks[fieldQueryKey]}
                      />
                    </FormControl>
                  );
                }

                if (config.type === 'groupedBoolean') {
                  return (
                    <FormControl key={id} label={config.label}>
                      <ButtonGroup
                        mode="checkbox"
                        size={BUTTON_SIZE.mini}
                        selected={groupedBooleanSelectedValues[fieldQueryKey]}
                        onClick={onChangeCallbacks[fieldQueryKey]}
                        disabled={disabled}
                      >
                        {config.ids.map((optionId, index) => (
                          <Button key={optionId}>
                            <span className={css(optionsStyle)}>
                              {config.labels[index]}
                            </span>
                          </Button>
                        ))}
                      </ButtonGroup>
                    </FormControl>
                  );
                }

                if (config.type === 'boolean') {
                  return (
                    <FormControl key={id} label={config.title}>
                      <Toggle
                        checked={
                          (overwrittenValue[fieldQueryKey] ??
                            getValue(extension.id, id)) === 'yes'
                        }
                        labelPlacement={CHECKBOX_LABEL_PLACEMENT.right}
                        onChange={onChangeCallbacks[fieldQueryKey]}
                        disabled={disabled}
                      >
                        {config.label}
                      </Toggle>
                    </FormControl>
                  );
                }

                throw new TypeError(
                  `Unknown field type: ${(config as { type: string }).type}`
                );
              })}
          </Block>
        );
      })}
    </Block>
  );
};
