import * as React from 'react';

import { useStyletron } from 'baseui';

import { tagsByType, typeNameMap } from '@recative/definitions';

import { StatefulMenu, NestedMenus } from 'baseui/menu';
import { StatefulPopover, PLACEMENT } from 'baseui/popover';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import type { ButtonProps } from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';
import { ResourceTag } from './ResourceTag';

interface IMenuLabel {
  label: string;
  id: string;
}

const MENU_ITEMS = Object.entries(typeNameMap)
  .filter(([x]) => x !== 'meta-status' && x !== 'custom')
  .map(([key, value]) => ({
    label: value,
    id: key,
  }));

const MENU_ITEM_MAP = new Map<string, IMenuLabel[]>();

Object.entries(tagsByType).forEach(([key, tags]) => {
  tags.forEach((tag) => {
    const v = MENU_ITEM_MAP.get(key) ?? ([] as IMenuLabel[]);

    v.push({
      label: tag.label,
      id: tag.id,
    });

    MENU_ITEM_MAP.set(key, v);
  });
});

interface ChildMenuItem {
  label: string;
  id?: string;
}

const NESTED_MENU_OVERRIDES = {
  Option: {
    style: {
      paddingLeft: '16px',
    },
    props: { size: 'compact' },
  },
};

export interface IResourceTagSelectorProps extends ButtonProps {
  value?: string[];
  onAdd?: (x: string) => void;
  onRemove?: (x: string) => void;
}

export const useEventWrappersForResourceTagSelector = (
  o: string[] | undefined,
  callback: ((x: string[]) => void) | undefined
) => {
  const onAdd = useEvent((x: string) => o && callback?.([...o, x]));

  const onRemove = useEvent(
    (x: string) => o && callback?.(o.filter((y) => y !== x))
  );

  return { onAdd, onRemove };
};

export const useResourceTagSelector = () => {
  const [value, setValue] = React.useState<string[]>([]);

  const addValue = useEvent((x: string) => setValue((o) => [...o, x]));

  const removeValue = useEvent((x: string) =>
    setValue((o) => o.filter((y) => y !== x))
  );

  return [value, setValue, addValue, removeValue] as const;
};

export const ResourceTagSelector: React.FC<IResourceTagSelectorProps> =
  React.memo(({ value, onAdd, onRemove, ...props }) => {
    const [, theme] = useStyletron();
    const [focused, setFocused] = React.useState(false);

    const onItemSelect = useEvent(({ item }: { item: IMenuLabel }) => {
      if (item.id) onAdd?.(item.id);
    });

    const getChildMenu = useEvent((item: ChildMenuItem) => {
      if (!item.id) return null;

      const nestedMenuItems = MENU_ITEM_MAP.get(item.id);

      if (!nestedMenuItems) return null;

      return (
        <StatefulMenu
          items={nestedMenuItems}
          overrides={NESTED_MENU_OVERRIDES}
          onItemSelect={onItemSelect}
        />
      );
    });

    const mainMenuOverrides = React.useMemo(
      () => ({
        List: { style: { overflow: 'auto' } },
        Option: {
          style: {
            paddingLeft: '16px',
          },
          props: {
            size: 'compact',
            getChildMenu,
          },
        },
      }),
      [getChildMenu]
    );

    const buttonOverrides = React.useMemo(
      () => ({
        BaseButton: {
          style: {
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            borderColor: focused
              ? theme.colors.primaryA
              : theme.colors.inputBorder,
            borderWidth: theme.sizing.scale0,
            borderStyle: theme.borders.border100.borderStyle,
            transitionProperty: 'border',
            transitionDuration: theme.animation.timing200,
            transitionTimingFunction: theme.animation.easeOutCurve,
          },
        },
      }),
      [
        focused,
        theme.sizing.scale0,
        theme.colors.primaryA,
        theme.colors.inputBorder,
        theme.animation.timing200,
        theme.animation.easeOutCurve,
        theme.borders.border100.borderStyle,
      ]
    );

    const PopoverContent = useEvent(() => {
      return (
        <NestedMenus>
          <StatefulMenu items={MENU_ITEMS} overrides={mainMenuOverrides} />
        </NestedMenus>
      );
    });

    const onOpen = useEvent(() => setFocused(true));
    const onClose = useEvent(() => setFocused(false));

    return (
      <StatefulPopover
        content={PopoverContent}
        placement={PLACEMENT.bottomLeft}
        onOpen={onOpen}
        onClose={onClose}
      >
        <Button
          kind={BUTTON_KIND.secondary}
          overrides={buttonOverrides}
          {...props}
        >
          <RecativeBlock marginTop="-2px" marginBottom="-2px">
            {value?.length ? (
              value.map((x) => (
                <ResourceTag key={x} value={x} onRemove={onRemove} />
              ))
            ) : (
              <RecativeBlock
                marginTop="2px"
                marginBottom="2px"
                paddingLeft="8px"
                color={theme.colors.inputPlaceholder}
              >
                Select an tag
              </RecativeBlock>
            )}
          </RecativeBlock>
        </Button>
      </StatefulPopover>
    );
  });
