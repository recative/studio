import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
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
  extends Omit<
    CheckboxProps,
    'labelPlacement' | 'overrides' | 'value' | 'onChange'
  > {
  title: string;
  description: string;
  id: string;
  onChange: (x: boolean, id: string) => void;
  value: boolean;
}

export const BundleOptionItem: React.FC<IBundleOptionItem> = ({
  title,
  id,
  description,
  value,
  onChange,
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

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(event.target.checked, id);
    },
    [id, onChange]
  );

  return (
    <ListItem>
      <Checkbox
        labelPlacement={LABEL_PLACEMENT.right}
        overrides={checkboxOverrides}
        checked={value}
        onChange={handleChange}
        {...props}
      >
        <RecativeBlock>
          <LabelMedium>{title}</LabelMedium>
          <LabelXSmall overrides={labelOverrides}>{description}</LabelXSmall>
        </RecativeBlock>
      </Checkbox>
    </ListItem>
  );
};
