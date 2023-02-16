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

import { useEvent } from 'utils/hooks/useEvent';

import { AssetTable } from './AssetTable';
import { EpisodeListActions } from './EpisodeListActions';
import { Id } from './Id';

const bodyStyle = {
  display: 'contents',
} as const;

const rotatedExpandIcon = {
  transform: 'rotate(90deg)',
  transition: 'transform 300ms',
};

const notRotatedExpandIcon = {
  transform: 'rotate(180deg)',
  transition: 'transform 300ms',
};

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
      css({
        height: '40px',
        borderTopColor: theme.colors.borderTransparent || 'black',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        backgroundColor: expanded
          ? theme.colors.backgroundSecondary
          : theme.colors.backgroundPrimary,
        lineHeight: '40px !important',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      } as const),
    [
      css,
      expanded,
      theme.colors.backgroundPrimary,
      theme.colors.backgroundSecondary,
      theme.colors.borderTransparent,
    ]
  );

  return (
    <RecativeBlock key={episode.id} className={css(bodyStyle)} role="row">
      <StyledBodyCell className={cellStyle}>
        <RecativeBlock display="flex">
          <SmallIconButton
            title={expanded ? 'Expand' : 'Close'}
            onClick={expanded ? close : open}
          >
            <ArrowUpIconOutline
              width={12}
              className={
                expanded ? css(notRotatedExpandIcon) : css(rotatedExpandIcon)
              }
            />
          </SmallIconButton>
          <RecativeBlock marginRight="4px">
            {episode.label.en ?? 'Unknown Episode'}
          </RecativeBlock>
          <Id id={episode.id} shrink={6} />
        </RecativeBlock>
      </StyledBodyCell>
      <StyledBodyCell className={cellStyle}>
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
