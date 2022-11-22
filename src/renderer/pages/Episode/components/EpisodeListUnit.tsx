import * as React from 'react';

import { useStyletron } from 'baseui';

import { StyledBodyCell } from 'baseui/table-grid';

import type {
  IAsset,
  IEpisode,
  IActPoint,
  IResourceItem,
} from '@recative/definitions';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ArrowUpIconOutline } from 'components/Icons/ArrowUpIconOutline';
import { ArrowDownIconOutline } from 'components/Icons/ArrowDownIconOutline';

import { useEvent } from 'utils/hooks/useEvent';

import { AssetTable } from './AssetTable';
import { EpisodeListActions } from './EpisodeListActions';

const bodyStyle = {
  display: 'contents',
} as const;

interface IEpisodeListUnitProps {
  episode: IEpisode;
  assets: IAsset[];
  resources: Record<string, (IResourceItem | IActPoint)[]>;
  onRefreshEpisodeListRequest: () => void;
}

export const EpisodeListUnit: React.FC<IEpisodeListUnitProps> = ({
  episode,
  assets,
  resources,
  onRefreshEpisodeListRequest,
}) => {
  const [css, theme] = useStyletron();
  const [expanded, setExpanded] = React.useState(false);

  const open = useEvent(() => setExpanded(true));
  const close = useEvent(() => setExpanded(false));

  const cellStyle = React.useMemo(
    () =>
      ({
        height: '40px',
        borderTopColor: theme.colors.borderTransparent || 'black',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        lineHeight: '40px !important',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      } as const),
    [theme]
  );

  return (
    <RecativeBlock key={episode.id} className={css(bodyStyle)} role="row">
      <StyledBodyCell className={css(cellStyle)}>
        {expanded ? (
          <SmallIconButton title="Close" onClick={close}>
            <ArrowDownIconOutline width={12} />
          </SmallIconButton>
        ) : (
          <SmallIconButton title="Expand" onClick={open}>
            <ArrowUpIconOutline width={12} />
          </SmallIconButton>
        )}
        {episode.label.en ?? 'Unknown Episode'}
      </StyledBodyCell>
      <StyledBodyCell className={css(cellStyle)}>{episode.id}</StyledBodyCell>
      <StyledBodyCell className={css(cellStyle)}>
        <EpisodeListActions
          episode={episode}
          onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
        />
      </StyledBodyCell>
      {expanded && (
        <AssetTable
          assets={assets}
          resources={resources}
          onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
        />
      )}
    </RecativeBlock>
  );
};
