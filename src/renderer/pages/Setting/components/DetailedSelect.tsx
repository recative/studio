import * as React from 'react';

import { useStyletron } from 'baseui';

import { Block } from 'baseui/block';
import { LabelMedium, LabelXSmall } from 'baseui/typography';
import { Select, SIZE as SELECT_SIZE } from 'baseui/select';

import type { SelectProps } from 'baseui/select';
import type { BlockOverrides } from 'baseui/block';

export interface IDetailedSelectOption {
  id: string;
  label: string;
  description: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface IDetailedSelectProps extends Omit<SelectProps, 'options'> {
  options: IDetailedSelectOption[];
}

export const DetailedSelect: React.FC<IDetailedSelectProps> = ({
  options,
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
          <Block>
            <x.option.Icon width={32} />
          </Block>
          <Block marginLeft="scale500">
            <LabelMedium>{x.option.label}</LabelMedium>
            <Block className={descriptionContainerStyle}>
              <LabelXSmall overrides={labelOverrides}>
                {x.option.description}
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
      options={options}
      getOptionLabel={getOptionLabel}
      size={SELECT_SIZE.compact}
      {...props}
    />
  );
};
