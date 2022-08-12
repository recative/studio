import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'baseui';

import { RecativeBlock } from 'components/Block/Block';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { LabelMedium, LabelXSmall } from 'baseui/typography';

import type { SelectProps } from 'baseui/select';
import type { BlockOverrides } from 'baseui/block';

import { Select } from 'components/Select/Select';
import { FileIconOutline } from 'components/Icons/FileIconOutline';
import type {
  GetOptionLabel,
  OnChangeCallback,
} from 'components/Select/Select';

import { server } from 'utils/rpc';

export interface IDetailedSelectProps
  extends Omit<SelectProps, 'options' | 'onChange' | 'value'> {
  glob: string;
  value?: string;
  onChange?: (x: string) => void;
}

export interface IFile {
  id: string;
  label: string;
  updateTime: string;
}

const EMPTY_ARRAY: IFile[] = [];

export const AssetFileSelect: React.FC<IDetailedSelectProps> = ({
  glob,
  value,
  onChange,
  ...props
}) => {
  const [css, theme] = useStyletron();

  const labelOverrides = React.useMemo<BlockOverrides>(
    () => ({
      Block: {
        style: ({ $theme }) => ({
          color: $theme.colors.contentSecondary,
        }),
      },
    }),
    []
  );

  const fetchFileList = React.useCallback(async () => {
    const result = await server.getFileListFromAssetsPath(glob);

    return result.map(({ fileName, updateTime }) => ({
      id: fileName,
      label: fileName,
      updateTime: updateTime.toLocaleString('en-US'),
    }));
  }, [glob]);

  const [fileList, fileListActions] = useAsync(fetchFileList);

  React.useEffect(() => {
    fileListActions.execute();
  }, [fileListActions]);

  const descriptionContainerStyle = React.useMemo(
    () =>
      css({
        marginTop: theme.sizing.scale100,
      }),
    [css, theme.sizing.scale100]
  );

  const getOptionLabel = React.useCallback<GetOptionLabel<IFile>>(
    ({ option }) => {
      if (!option) {
        return <RecativeBlock>Invalid Option</RecativeBlock>;
      }

      return (
        <RecativeBlock display="flex" alignItems="center">
          <RecativeBlock paddingTop="4px">
            <FileIconOutline width={32} />
          </RecativeBlock>
          <RecativeBlock marginLeft="scale500">
            <LabelMedium>{option.label}</LabelMedium>
            <RecativeBlock className={descriptionContainerStyle}>
              <LabelXSmall overrides={labelOverrides}>
                {option.updateTime}
              </LabelXSmall>
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      );
    },
    [descriptionContainerStyle, labelOverrides]
  );

  const trueValue = React.useMemo(() => {
    if (!value) return [];
    if (!fileList.result) return [];

    const result = fileList.result.find((file) => file.id === value);

    if (!result) return [];
    return [result];
  }, [fileList, value]);

  const handleChange = React.useCallback<OnChangeCallback<IFile>>(
    ({ value: v }) => {
      onChange?.(v[0].id);
    },
    [onChange]
  );

  return (
    <Select<IFile>
      value={trueValue}
      onChange={handleChange}
      options={fileList.result ?? EMPTY_ARRAY}
      OptionLabel={getOptionLabel}
      size={SELECT_SIZE.compact}
      {...props}
    />
  );
};
