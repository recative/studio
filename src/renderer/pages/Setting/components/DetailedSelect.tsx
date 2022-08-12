import * as React from 'react';

import { useStyletron } from 'baseui';

import { Block } from 'baseui/block';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { LabelMedium, LabelXSmall } from 'baseui/typography';

import type { SelectProps } from 'baseui/select';
import type { BlockOverrides } from 'baseui/block';

import { Select } from 'components/Select/Select';
import type {
  GetOptionLabel,
  OnChangeCallback,
} from 'components/Select/Select';

export interface IDetailedSelectOption {
  id: string;
  label: string;
  description: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface IDetailedSelectProps
  extends Omit<SelectProps, 'options' | 'value' | 'onChange'> {
  options: IDetailedSelectOption[];
  value: IDetailedSelectOption[];
  onChange: OnChangeCallback<IDetailedSelectOption>;
}

const InternalDetailedSelect: React.FC<IDetailedSelectProps> = ({
  options,
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

  const descriptionContainerStyle = React.useMemo(
    () =>
      css({
        marginTop: theme.sizing.scale100,
      }),
    [css, theme.sizing.scale100]
  );

  const getOptionLabel = React.useCallback<
    GetOptionLabel<IDetailedSelectOption>
  >(
    ({ option }) => {
      if (!option) return <Block>Invalid Option</Block>;

      return (
        <Block display="flex" alignItems="center">
          <Block>
            <option.Icon width={32} />
          </Block>
          <Block marginLeft="scale500">
            <LabelMedium>{option.label}</LabelMedium>
            <Block className={descriptionContainerStyle}>
              <LabelXSmall overrides={labelOverrides}>
                {option.description}
              </LabelXSmall>
            </Block>
          </Block>
        </Block>
      );
    },
    [descriptionContainerStyle, labelOverrides]
  );

  return (
    <Select<IDetailedSelectOption>
      onChange={onChange}
      options={options}
      OptionLabel={getOptionLabel}
      size={SELECT_SIZE.compact}
      {...props}
    />
  );
};

export const DetailedSelect = React.memo(InternalDetailedSelect);
