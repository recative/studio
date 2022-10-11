import * as React from 'react';

import { useStyletron } from 'styletron-react';
import { atom, useAtom } from 'jotai';

import type { StyleObject } from 'styletron-standard';
import type { ButtonOverrides } from 'baseui/button';

import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

export interface IFilterLabels {
  label: string;
  tags: string[] | null;
  episodeIds: string[] | null;
}

export const treeLabelContentContainerStyle: StyleObject = {
  whiteSpace: 'nowrap',
  overflow: 'clip',
  textOverflow: 'ellipsis',
};

const labelButtonOverride: ButtonOverrides = {
  BaseButton: {
    style: ({ $theme }) => ({
      width: '-webkit-fill-available',
      paddingTop: '4px',
      paddingBottom: '4px',
      paddingLeft: '0px !important',
      paddingRight: '0px !important',
      fontSize: $theme.typography.LabelSmall,
      justifyContent: 'flex-start',
      ':hover': { background: 'transparent' },
    }),
  },
};

export const SELECTED_TAGS = atom<IFilterLabels[] | null>(null);

export const getLabelButton = (condition: IFilterLabels) =>
  function LabelButton() {
    const [css] = useStyletron();
    const [selectedLabel, setSelectedLabel] = useAtom(SELECTED_TAGS);

    const handleButtonClick = React.useCallback(() => {
      setSelectedLabel([condition]);
    }, [setSelectedLabel]);

    return (
      <RecativeBlock className={css(treeLabelContentContainerStyle)}>
        <Button
          size={BUTTON_SIZE.compact}
          kind={BUTTON_KIND.tertiary}
          onClick={handleButtonClick}
          overrides={labelButtonOverride}
        >
          <RecativeBlock
            fontWeight={condition === selectedLabel?.[0] ? 700 : 500}
          >
            {condition.label}
          </RecativeBlock>
        </Button>
      </RecativeBlock>
    );
  };

const simpleButtonLabelOverride: ButtonOverrides = {
  BaseButton: {
    style: ({ $theme }) => ({
      width: '-webkit-fill-available',
      paddingTop: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px !important',
      paddingRight: '4px !important',
      justifyContent: 'flex-start',
      fontSize: $theme.typography.LabelSmall,
      ':hover': { background: 'transparent' },
    }),
  },
} as const;

export const getSimpleButtonLabel = (label: string) =>
  function SimpleLabelButton() {
    const [css] = useStyletron();

    return (
      <RecativeBlock className={css(treeLabelContentContainerStyle)}>
        <Button
          size={BUTTON_SIZE.compact}
          kind={BUTTON_KIND.tertiary}
          overrides={simpleButtonLabelOverride}
        >
          <RecativeBlock fontWeight={700}>{label}</RecativeBlock>
        </Button>
      </RecativeBlock>
    );
  };
