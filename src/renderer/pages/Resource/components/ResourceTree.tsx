import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { StatefulTreeView } from 'baseui/tree-view';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

import { SearchBar } from './SearchBar';

import { getLabelButton, getSimpleButtonLabel } from '../utils/getLabelButton';

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
              label: episode.label?.en ?? 'Unknown Episode',
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
    <RecativeBlock id="recative-resource-tree">
      <style>
        {`
            #recative-resource-tree ul[role="group"] svg[title="Blank"] {
              display: none
            }
        `}
      </style>
      <SearchBar />
      {episodes.result ? (
        <StatefulTreeView indentGuides data={trueData} />
      ) : null}
    </RecativeBlock>
  );
};

export const ResourceTree = React.memo(InternalResourceTree);
