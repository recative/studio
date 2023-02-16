import * as React from 'react';

import { useStyletron } from 'baseui';

import { StyledBodyCell } from 'baseui/table-grid';

import { ExpandButton } from 'components/ExpandButton/ExpandButton';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';

import type { IStorage } from 'rpc/query';

import { MetadataTable } from './MetadataTable';

const bodyStyle = {
  display: 'contents',
} as const;

interface IMetadataGroupTableUnitProps {
  metadata: IStorage[];
  seriesId: string;
  releaseId: string;
  onRefreshEpisodeListRequest: () => void;
}

export const MetadataGroupTableUnit: React.FC<IMetadataGroupTableUnitProps> = ({
  metadata,
  seriesId,
  releaseId,
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
    <RecativeBlock
      key={`${seriesId}:::${releaseId}`}
      className={css(bodyStyle)}
      role="row"
    >
      <StyledBodyCell className={cellStyle}>
        <RecativeBlock display="flex">
          <ExpandButton expanded={expanded} onClick={expanded ? close : open} />
          <RecativeBlock marginRight="4px" display="flex">
            <RecativeBlock>{releaseId}</RecativeBlock>
            <RecativeBlock
              marginLeft="8px"
              fontFamily={theme.typography.MonoDisplayMedium.fontFamily}
              fontWeight={500}
              opacity={0.25}
            >
              {seriesId}
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </StyledBodyCell>
      <StyledBodyCell className={cellStyle}></StyledBodyCell>
      {expanded && (
        <MetadataTable
          storages={metadata}
          onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
        />
      )}
    </RecativeBlock>
  );
};
