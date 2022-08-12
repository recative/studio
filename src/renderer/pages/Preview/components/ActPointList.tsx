import * as React from 'react';

import { useStyletron } from 'baseui';

import { RecativeBlock } from 'components/Block/Block';
import { LabelXSmall } from 'baseui/typography';
import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';
import type { ButtonOverrides } from 'baseui/button';

import { useActPoints } from '../../ActPoint/ActPoint';
import type {
  IActPointGroupProps,
  IActPointItemProps,
} from '../../ActPoint/ActPoint';

export const useStyles = () => {
  const [css] = useStyletron();

  const actPointGroupStyles = React.useMemo(
    () =>
      css({
        paddingTop: '8px',
        fontWeight: 'bold',
      }),
    [css]
  );

  const itemOverrides: ButtonOverrides = React.useMemo(
    () => ({
      Root: {
        style: {
          marginTop: '2px',
          marginRight: '8px',
        },
      },
    }),
    []
  );

  return { actPointGroupStyles, itemOverrides };
};

interface IActPointListProps {
  // eslint-disable-next-line react/no-unused-prop-types
  path?: string;
  // eslint-disable-next-line react/no-unused-prop-types
  title?: string;
  onItemSelected: (id: string) => void;
}

const ActPointItem: React.FC<
  Omit<IActPointItemProps, 'onClick'> & IActPointListProps
> = ({ title, id, onItemSelected }) => {
  const { itemOverrides } = useStyles();

  const handleItemClick = React.useCallback(() => {
    onItemSelected(id);
  }, [onItemSelected, id]);

  return (
    <Button
      size={BUTTON_SIZE.mini}
      kind={BUTTON_KIND.secondary}
      overrides={itemOverrides}
      onClick={handleItemClick}
    >
      {title}
    </Button>
  );
};

const ActPointGroup: React.FC<
  Omit<IActPointGroupProps, 'onItemClick'> & IActPointListProps
> = ({ id, title, items, onItemSelected }) => {
  const { actPointGroupStyles } = useStyles();

  return (
    <RecativeBlock id={id}>
      <RecativeBlock className={actPointGroupStyles}>
        <LabelXSmall>{title}</LabelXSmall>
      </RecativeBlock>

      <RecativeBlock>
        {items.map((item) => (
          <ActPointItem
            key={item.id}
            path={item.fullPath}
            title={item.secondLevelPath}
            onItemSelected={onItemSelected}
            {...item}
          />
        ))}
      </RecativeBlock>
    </RecativeBlock>
  );
};

export const ActPointList: React.FC<IActPointListProps> = ({
  onItemSelected,
}) => {
  const { actPoints } = useActPoints();

  return (
    <RecativeBlock>
      {actPoints.result &&
        Object.entries(actPoints.result).map(([groupId, items]) => {
          return (
            <ActPointGroup
              key={groupId}
              id={groupId}
              title={groupId}
              items={items}
              onItemSelected={onItemSelected}
            />
          );
        })}
    </RecativeBlock>
  );
};
