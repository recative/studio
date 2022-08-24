import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';
import { atom, useAtom } from 'jotai';

import type { StyleObject } from 'styletron-standard';
import type { ButtonOverrides } from 'baseui/button';

import { StatefulTreeView } from 'baseui/tree-view';
import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

interface IFilterLabels {
  label: string;
  tags: string[] | null;
  episodeIds: string[] | null;
}

const treeLabelContentContainerStyle: StyleObject = {
  whiteSpace: 'nowrap',
  overflow: 'clip',
  textOverflow: 'ellipsis',
};

const simpleButtonLabelOverride: ButtonOverrides = {
  BaseButton: {
    style: ({ $theme }) => ({
      width: '-webkit-fill-available',
      paddingTop: '4px',
      paddingBottom: '4px',
      justifyContent: 'flex-start',
      fontSize: $theme.typography.LabelSmall,
      ':hover': { background: 'transparent' },
    }),
  },
} as const;

export const SELECTED_TAGS = atom<IFilterLabels[] | null>(null);

const getSimpleButtonLabel = (label: string) =>
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

const labelButtonOverride: ButtonOverrides = {
  BaseButton: {
    style: ({ $theme }) => ({
      width: '-webkit-fill-available',
      paddingTop: '4px',
      paddingBottom: '4px',
      fontSize: $theme.typography.LabelSmall,
      justifyContent: 'flex-start',
      ':hover': { background: 'transparent' },
    }),
  },
};

const getLabelButton = (condition: IFilterLabels) =>
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
          tags: [
            'role:video',
            'group:video',
            'category:video',
            'role:video!',
            'group:video!',
            'category:video!',
          ],
          episodeIds: null,
        }),
      },
      {
        id: 12,
        label: getLabelButton({
          label: 'Audio',
          tags: [
            'role:audio',
            'category:audio',
            'role:audio!',
            'category:audio!',
          ],
          episodeIds: null,
        }),
      },
      {
        id: 13,
        label: getLabelButton({
          label: 'Texture',
          tags: [
            'group:texture',
            'category:image',
            'group:texture!',
            'category:image!',
          ],
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
          tags: [
            'role:subtitle',
            'category:subtitle',
            'role:subtitle!',
            'category:subtitle!',
          ],
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
    <RecativeBlock minWidth="240px">
      {episodes.result ? (
        <StatefulTreeView indentGuides data={trueData} />
      ) : null}
    </RecativeBlock>
  );
};

export const ResourceTree = React.memo(InternalResourceTree);
