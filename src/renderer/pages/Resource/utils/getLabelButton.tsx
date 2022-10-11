import * as React from 'react';

import { useStyletron } from 'styletron-react';

import type { StyleObject } from 'styletron-standard';
import type { ButtonOverrides } from 'baseui/button';

import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

export const treeLabelContentContainerStyle: StyleObject = {
  whiteSpace: 'nowrap',
  overflow: 'clip',
  textOverflow: 'ellipsis',
};

const labelButtonOverride: ButtonOverrides = {
  BaseButton: {
    style: ({ $theme }) => ({
      width: '-webkit-fill-available',
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingLeft: '0px !important',
      paddingRight: '0px !important',
      fontSize: $theme.typography.LabelSmall,
      justifyContent: 'flex-start',
      ':hover': { background: 'transparent' },
    }),
  },
};

export const getLabelButton = <Payload,>(
  getHighlight: () => boolean,
  label: string,
  payload: Payload,
  onClick: (x: Payload) => void
) =>
  function LabelButton() {
    const [css] = useStyletron();

    const handleButtonClick = React.useCallback(() => {
      onClick(payload);
    }, []);

    return (
      <RecativeBlock className={css(treeLabelContentContainerStyle)}>
        <Button
          size={BUTTON_SIZE.compact}
          kind={BUTTON_KIND.tertiary}
          onClick={handleButtonClick}
          overrides={labelButtonOverride}
        >
          <RecativeBlock fontWeight={getHighlight() ? 700 : 500}>
            {label}
          </RecativeBlock>
        </Button>
      </RecativeBlock>
    );
  };

const simpleButtonLabelOverride: ButtonOverrides = {
  BaseButton: {
    style: ({ $theme }) => ({
      width: '-webkit-fill-available',
      paddingTop: '8px',
      paddingBottom: '8px',
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
