import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { atom, useAtom } from 'jotai';

import { StatefulTreeView } from 'baseui/tree-view';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

import { SearchBar } from './SearchBar';

import { getLabelButton, getSimpleButtonLabel } from '../utils/getLabelButton';

const EMPTY_ARRAY = [] as const;

export interface IFilterLabels {
  label: string;
  tags: string[] | null;
  episodeIds: string[] | null;
}

const STATEFUL_TREE_OVERRIDE = {
  TreeLabel: { style: { paddingTop: 0, paddingBottom: 0 } },
};

export const SELECTED_TAGS = atom<IFilterLabels[] | null>(null);

export const InternalResourceTree: React.FC = () => {
  const [selectedLabel, setSelectedLabel] = useAtom(SELECTED_TAGS);

  const [episodes, episodesActions] = useAsync(server.getEpisodeList, null);

  React.useEffect(() => {
    episodesActions.execute();
  }, [episodesActions]);

  const internalGetLabelButton = React.useCallback(
    (x: IFilterLabels) =>
      getLabelButton(
        () => selectedLabel?.[0]?.label === x.label,
        x.label,
        x,
        () => setSelectedLabel([x])
      ),
    [selectedLabel, setSelectedLabel]
  );

  const trueData = React.useMemo(
    () => [
      {
        id: -1,
        label: internalGetLabelButton({
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
            label: internalGetLabelButton({
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
            label: internalGetLabelButton({
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
            label: internalGetLabelButton({
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
            label: internalGetLabelButton({
              label: 'Frame Sequence',
              tags: ['group:frameSequence'],
              episodeIds: null,
            }),
          },
          {
            id: 15,
            label: internalGetLabelButton({
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
      {
        id: 2,
        label: getSimpleButtonLabel('By Episode'),
        isExpanded: true,
        children: [
          {
            id: 20,
            label: internalGetLabelButton({
              label: 'Empty',
              tags: null,
              episodeIds: ['empty'],
            }),
          },
          ...(episodes.result?.map((episode, index) => ({
            id: 20 + index + 1,
            label: internalGetLabelButton({
              label: episode.label?.en ?? 'Unknown Episode',
              tags: null,
              episodeIds: [episode.id],
            }),
          })) ?? EMPTY_ARRAY),
        ],
      },
    ],
    [episodes.result, internalGetLabelButton]
  );

  return (
    <RecativeBlock id="recative-resource-tree">
      <style>
        {`
            #recative-resource-tree ul[role="group"] svg[title="Blank"] {
              display: none;
            }

            #recative-resource-tree li[role="treeitem"]> div > div:nth-of-type(2) {
              width: 100%;
            }
        `}
      </style>
      <SearchBar />
      {episodes.result ? (
        <StatefulTreeView
          indentGuides
          overrides={STATEFUL_TREE_OVERRIDE}
          data={trueData}
        />
      ) : null}
    </RecativeBlock>
  );
};

export const ResourceTree = React.memo(InternalResourceTree);
