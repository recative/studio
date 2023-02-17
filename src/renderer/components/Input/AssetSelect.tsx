import * as React from 'react';
import { useDebouncedCallback, useAsync } from '@react-hookz/web';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Select, SIZE as SELECT_SIZE } from 'baseui/select';
import type { SelectOverrides } from 'baseui/select';

import {
  ResourceItem,
  ResourceItemVariant,
} from 'components/Resource/ResourceItem';
import { ActPointItem } from 'components/ActPoint/ActPointItem';

import { server } from 'utils/rpc';
import { IActPoint, IResourceItem } from '@recative/definitions';

export type Option = IActPoint | IResourceItem;

export enum AssetSelectType {
  Texture,
  Asset,
}

interface IAssetSelectProps {
  disabled?: boolean;
  value?: (Option | string)[] | null;
  type: AssetSelectType;
  onChange: (x: Option[]) => void;
  size?: typeof SELECT_SIZE[keyof typeof SELECT_SIZE];
  overrides?: SelectOverrides;
}

interface IAssetSelectOptionProps {
  option: IActPoint | IResourceItem;
}

export const SelectOption: React.FC<IAssetSelectOptionProps> = ({
  option: item,
}) => {
  if (!item) {
    return <RecativeBlock>No Item</RecativeBlock>;
  }

  if ('type' in item) {
    return <ResourceItem {...item} variant={ResourceItemVariant.NoTags} />;
  }

  return <ActPointItem {...item} />;
};

const useSearchAssetCallback = (type: AssetSelectType) => {
  const [options, setOptions] = React.useState<Option[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSearch = useDebouncedCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { value } = event.target;

      const searchResult =
        type === AssetSelectType.Asset
          ? await server.searchAssetResources(value)
          : await server.searchTextureResources(value);
      setOptions(searchResult);
      setIsLoading(false);
    },
    [],
    300,
    500
  );

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsLoading(true);
      handleSearch(event);
    },
    [handleSearch]
  );

  return { isLoading, options, handleInputChange };
};

export const AssetSelect: React.FC<IAssetSelectProps> = ({
  size,
  type,
  value,
  onChange,
  overrides,
  disabled,
}) => {
  const { isLoading, options, handleInputChange } =
    useSearchAssetCallback(type);

  const [trueValue, trueValueActions] = useAsync(
    (_value: IAssetSelectProps['value']): Promise<(Option | null)[]> => {
      return Promise.all(
        _value?.map(async (item) => {
          if (typeof item === 'string') {
            return (
              (await server.getResource(item)) ||
              (await server.getActPoint(item))
            );
          }
          return item;
        }) || []
      );
    },
    [null]
  );

  const filteredTrueValue = React.useMemo(() => {
    return trueValue.result?.filter((x) => x !== null) as Option[] | null;
  }, [trueValue.result]);

  React.useEffect(() => {
    void trueValueActions.execute(value);
  }, [value, trueValueActions]);

  return (
    <Select
      disabled={disabled}
      options={options}
      value={filteredTrueValue || []}
      placeholder="Asset"
      isLoading={isLoading}
      onChange={({ value: nextValue }) =>
        onChange(nextValue as unknown as Option[])
      }
      onInputChange={handleInputChange}
      size={size}
      overrides={overrides}
      getOptionLabel={({ option }) => {
        return option ? (
          <SelectOption option={option as unknown as Option} />
        ) : null;
      }}
      getValueLabel={({ option }) => {
        return option ? (
          <SelectOption option={option as unknown as Option} />
        ) : null;
      }}
    />
  );
};
