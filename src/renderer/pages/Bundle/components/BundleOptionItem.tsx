import * as React from 'react';

import { Block } from 'baseui/block';
import { ListItem } from 'baseui/list';
import { LabelMedium, LabelXSmall } from 'baseui/typography';
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox';

import type { BlockOverrides } from 'baseui/block';
import type { CheckboxProps, CheckboxOverrides } from 'baseui/checkbox';

export const checkboxOverrides: CheckboxOverrides = {
  Label: {
    style: ({ $theme }) => ({
      marginLeft: $theme.sizing.scale200,
    }),
  },
  Root: {
    style: {
      alignItems: 'center',
    },
  },
};

export interface IBundleOptionItem
  extends Omit<CheckboxProps, 'labelPlacement' | 'overrides'> {
  title: string;
  description: string;
}

export const BundleOptionItem: React.FC<IBundleOptionItem> = ({
  title,
  description,
  ...props
}) => {
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

  return (
    <ListItem>
      <Checkbox
        labelPlacement={LABEL_PLACEMENT.right}
        overrides={checkboxOverrides}
        {...props}
      >
        <Block>
          <LabelMedium>{title}</LabelMedium>
          <LabelXSmall overrides={labelOverrides}>{description}</LabelXSmall>
        </Block>
      </Checkbox>
    </ListItem>
  );
};
