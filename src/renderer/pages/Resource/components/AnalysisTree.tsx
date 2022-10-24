import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useGetSet } from 'react-use';

import { StatefulTreeView, TreeNodeData } from 'baseui/tree-view';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';

import { AnalysisChart } from './AnalysisChart';

const EMPTY_ARRAY = [] as const;

const STATEFUL_TREE_OVERRIDE = {
  TreeLabel: { style: { paddingTop: 0, paddingBottom: 0 } },
};

export const InternalAnalysisTree: React.FC = () => {
  const [getEnabledEpisodes, setEnabledEpisodes] = useGetSet(new Set<number>());
  const [episodes, episodesActions] = useAsync(server.getEpisodeList, null);

  React.useEffect(() => {
    episodesActions.execute();
  }, [episodesActions]);

  const handleToggle = useEvent((node: TreeNodeData) => {
    if (!node) return;
    if (!node.id) return;
    if (getEnabledEpisodes().has(node.id as number)) return;

    setEnabledEpisodes((x) => new Set<number>([...x, node.id] as number[]));
  });

  const trueData = React.useMemo(
    () => [
      ...(episodes.result?.map((episode, index) => ({
        id: 20 + index + 1,
        label: () => (
          <RecativeBlock
            padding="8px 0"
            fontWeight={500}
            fontSize="13px"
            lineHeight="16px"
          >
            {episode.label?.en ?? 'Unknown Episode'}
          </RecativeBlock>
        ),
        children: [
          {
            id: episode.id,
            label: () => {
              return (
                <RecativeBlock overflow="clip">
                  <AnalysisChart
                    isOpen={getEnabledEpisodes().has(20 + index + 1)}
                    episodeId={episode.id}
                  />
                </RecativeBlock>
              );
            },
          },
        ],
      })) ?? EMPTY_ARRAY),
    ],
    [getEnabledEpisodes, episodes.result]
  );

  return (
    <RecativeBlock id="recative-analysis-tree" paddingTop="8px">
      <style>
        {`
            #recative-analysis-tree ul[role="group"] svg[title="Blank"] {
              display: none;
            }

            #recative-analysis-tree li[role="treeitem"]> div > div:nth-of-type(2) {
              width: 100%;
            }
        `}
      </style>
      {episodes.result ? (
        <StatefulTreeView
          indentGuides
          overrides={STATEFUL_TREE_OVERRIDE}
          data={trueData}
          onToggle={handleToggle}
        />
      ) : null}
    </RecativeBlock>
  );
};

export const AnalysisTree = React.memo(InternalAnalysisTree);
