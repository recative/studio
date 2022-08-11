import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'baseui';

import { Block } from 'baseui/block';
import { LabelMedium, LabelXSmall } from 'baseui/typography';
import { Select, SIZE as SELECT_SIZE } from 'baseui/select';

import type { SelectProps } from 'baseui/select';
import type { BlockOverrides } from 'baseui/block';

import { FileIconOutline } from 'components/Icons/FileIconOutline';

import { server } from 'utils/rpc';

export interface IDetailedSelectProps extends Omit<SelectProps, 'options'> {
  glob: string;
}

export const AssetFileSelect: React.FC<IDetailedSelectProps> = ({
  glob,
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

  const getOptionLabel = React.useCallback(
    (x: any) => {
      return (
        <Block display="flex" alignItems="center">
          <Block paddingTop="4px">
            <FileIconOutline width={32} />
          </Block>
          <Block marginLeft="scale500">
            <LabelMedium>{x.option.label}</LabelMedium>
            <Block className={descriptionContainerStyle}>
              <LabelXSmall overrides={labelOverrides}>
                {x.option.updateTime}
              </LabelXSmall>
            </Block>
          </Block>
        </Block>
      );
    },
    [descriptionContainerStyle, labelOverrides]
  );

  return (
    <Select
      options={fileList.result}
      getOptionLabel={getOptionLabel}
      size={SELECT_SIZE.compact}
      {...props}
    />
  );
};
