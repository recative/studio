import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import { StyledTable, StyledHeadCell } from 'baseui/table-grid';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { IStorage } from 'rpc/query';

import { MetadataGroupTableUnit } from './MetadataGroupTableUnit';

const tableStyle = {
  overflowX: 'initial',
  overflowY: 'initial',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

export interface MetadataGroupTableProps {
  metadataGroup: Map<string, IStorage[]>;
  onRefreshEpisodeListRequest: () => void;
}

export const MetadataGroupTable: React.FC<MetadataGroupTableProps> = ({
  metadataGroup,
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

  const groupIds = React.useMemo(
    () => [...metadataGroup.keys()],
    [metadataGroup]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${groupIds?.length ?? 0 + 1}, min-content)`,
      }),
    [css, groupIds.length]
  );

  if (!metadataGroup) return null;

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

      {groupIds.filter(Boolean).map((groupId) => {
        const group = metadataGroup.get(groupId)!;

        const [seriesId, releaseId] = groupId.split(':::');

        return (
          <MetadataGroupTableUnit
            key={groupId}
            seriesId={seriesId}
            releaseId={releaseId}
            metadata={group}
            onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
          />
        );
      })}
      {!groupIds.filter(Boolean).length && (
        <RecativeBlock gridColumn="1 / 3">
          <EmptySpace
            title="No metadata"
            content="Publish your metadata or make a backup."
          />
        </RecativeBlock>
      )}
    </StyledTable>
  );
};
