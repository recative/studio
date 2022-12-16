import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import { StyledTable, StyledHeadCell } from 'baseui/table-grid';

import type { PromiseValue } from 'type-fest';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { EpisodeListUnit } from './EpisodeListUnit';

const tableStyle = {
  overflowX: 'initial',
  overflowY: 'initial',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

export interface EpisodeListProps {
  episodes: PromiseValue<ReturnType<typeof server.listEpisodes>>;
  onRefreshEpisodeListRequest: () => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  onRefreshEpisodeListRequest,
}) => {
  const [css] = useStyletron();

  const gridTemplateHeaderStyles = React.useMemo(
    () =>
      css({
        height: '20px',
      }),
    [css]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${episodes?.length ?? 0 + 1}, min-content)`,
      }),
    [css, episodes?.length]
  );

  if (!episodes) return null;

  return (
    <StyledTable
      role="grid"
      className={cn(css(tableStyle), gridTemplateRowStyles)}
      $gridTemplateColumns="min-content auto"
    >
      <RecativeBlock id="checker" className={css(headerStyle)} role="row">
        <StyledHeadCell className={gridTemplateHeaderStyles}>
          Label
        </StyledHeadCell>
        <StyledHeadCell className={gridTemplateHeaderStyles} />
      </RecativeBlock>

      {episodes.filter(Boolean).map((episode) => (
        <EpisodeListUnit
          key={episode.id}
          episode={episode.episode}
          resources={episode.resources}
          assets={episode.assets}
          onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
        />
      ))}
      {!episodes.filter(Boolean).length && (
        <RecativeBlock gridColumn="1 / 3">
          <EmptySpace
            title="No episode"
            content="Create a new episode and config them here."
          />
        </RecativeBlock>
      )}
    </StyledTable>
  );
};
