import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';
import { atom, useAtom } from 'jotai';

import { Block } from 'baseui/block';
import { StatefulTreeView, TreeLabelInteractable } from 'baseui/tree-view';
import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';

import type { StyleObject } from 'styletron-standard';
import type { ButtonOverrides } from 'baseui/button';

import { server } from 'utils/rpc';

interface IFilterLabels {
  label: string;
  tags: string[] | null;
  episodeIds: string[] | null;
}

const TREE_LABEL_CONTENT_CONTAINER_STYLE: StyleObject = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const SELECTED_TAGS = atom<IFilterLabels[] | null>(null);

const getSimpleButtonLabel = (label: string) =>
  function SimpleLabelButton() {
    const [css] = useStyletron();

    return (
      <TreeLabelInteractable>
        <Block className={css(TREE_LABEL_CONTENT_CONTAINER_STYLE)}>
          <Button
            size={BUTTON_SIZE.compact}
            kind={BUTTON_KIND.tertiary}
            overrides={{
              BaseButton: {
                style: () => ({
                  width: '-webkit-fill-available',
                  justifyContent: 'flex-start',
                  ':hover': { background: 'transparent' },
                }),
              },
            }}
          >
            {label}
          </Button>
        </Block>
      </TreeLabelInteractable>
    );
  };

const getLabelButton = (condition: IFilterLabels) =>
  function LabelButton() {
    const [css] = useStyletron();
    const [selectedLabel, setSelectedLabel] = useAtom(SELECTED_TAGS);

    const handleButtonClick = React.useCallback(() => {
      setSelectedLabel([condition]);
    }, [setSelectedLabel]);

    const buttonOverride: ButtonOverrides = React.useMemo(
      () => ({
        BaseButton: {
          style: () => ({
            width: '-webkit-fill-available',
            justifyContent: 'flex-start',
            ':hover': { background: 'transparent' },
            fontWeight: condition === selectedLabel?.[0] ? `bold` : `normal`,
          }),
        },
      }),
      [selectedLabel]
    );

    return (
      <TreeLabelInteractable>
        <Block className={css(TREE_LABEL_CONTENT_CONTAINER_STYLE)}>
          <Button
            size={BUTTON_SIZE.compact}
            kind={BUTTON_KIND.tertiary}
            onClick={handleButtonClick}
            overrides={buttonOverride}
          >
            {condition.label}
          </Button>
        </Block>
      </TreeLabelInteractable>
    );
  };

const MOCK_DATA = [
  {
    id: -1,
    label: getLabelButton({
      label: 'All Resources',
      tags: null,
      episodeIds: null,
    }),
  },
  {
    id: 1,
    label: getSimpleButtonLabel('By Resource Type'),
    isExpanded: true,
    children: [
      {
        id: 11,
        label: getLabelButton({
          label: 'Video',
          tags: ['role:video', 'group:video', 'category:video'],
          episodeIds: null,
        }),
      },
      {
        id: 12,
        label: getLabelButton({
          label: 'Audio',
          tags: ['role:audio', 'category:audio'],
          episodeIds: null,
        }),
      },
      {
        id: 13,
        label: getLabelButton({
          label: 'Texture',
          tags: ['group:texture', 'category:image'],
          episodeIds: null,
        }),
      },
      {
        id: 14,
        label: getLabelButton({
          label: 'Frame Sequence',
          tags: ['group:frameSequence'],
          episodeIds: null,
        }),
      },
      {
        id: 15,
        label: getLabelButton({
          label: 'Subtitle',
          tags: ['role:subtitle', 'category:subtitle'],
          episodeIds: null,
        }),
      },
    ],
  },
];

const EMPTY_ARRAY = [] as const;

export const InternalResourceTree: React.FC = () => {
  const [episodes, episodesActions] = useAsync(server.getEpisodeList, null);

  React.useEffect(() => {
    episodesActions.execute();
  }, [episodesActions]);

  const trueData = React.useMemo(
    () => [
      ...MOCK_DATA,
      {
        id: 2,
        label: getSimpleButtonLabel('By Episode'),
        isExpanded: true,
        children: [
          {
            id: 20,
            label: getLabelButton({
              label: 'Empty',
              tags: null,
              episodeIds: ['empty'],
            }),
          },
          ...(episodes.result?.map((episode, index) => ({
            id: 20 + index + 1,
            label: getLabelButton({
              label: episode.label.en,
              tags: null,
              episodeIds: [episode.id],
            }),
          })) ?? EMPTY_ARRAY),
        ],
      },
    ],
    [episodes.result]
  );

  return (
    <Block minWidth="240px">
      {episodes.result ? (
        <StatefulTreeView indentGuides data={trueData} />
      ) : null}
    </Block>
  );
};

export const ResourceTree = React.memo(InternalResourceTree);
