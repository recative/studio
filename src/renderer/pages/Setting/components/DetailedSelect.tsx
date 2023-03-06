import * as React from 'react';

import { useStyletron } from 'baseui';

import { RecativeBlock } from 'components/Block/RecativeBlock';
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
  Icon: React.FC<React.SVGProps<SVGSVGElement>> | null;
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
      if (!option) return <RecativeBlock>Invalid Option</RecativeBlock>;

      return (
        <RecativeBlock display="flex" alignItems="center">
          {option.Icon && (
            <RecativeBlock>
              <option.Icon width={26} />
            </RecativeBlock>
          )}
          <RecativeBlock marginLeft={theme.sizing.scale600}>
            <LabelMedium>{option.label}</LabelMedium>
            <RecativeBlock className={descriptionContainerStyle}>
              <LabelXSmall overrides={labelOverrides}>
                {option.description}
              </LabelXSmall>
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      );
    },
    [descriptionContainerStyle, labelOverrides, theme.sizing.scale600]
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
