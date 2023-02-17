import * as React from 'react';
import cn from 'classnames';

import type { IBundleRelease } from '@recative/definitions';

import { useStyletron } from 'baseui';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { YYYYMMDD } from 'utils/formatDate';
import { useReleaseData } from 'pages/Release/Release';

export interface IActionsProps {
  id: number;
  codeBuildId: number;
  mediaBuildId: number;
  type: 'media' | 'code' | 'bundle';
  notes: string;
}

export interface IReleaseList {
  type?: 'media' | 'code' | 'bundle';
  Actions?: React.FC<IActionsProps>;
}

const tableStyle = {
  overflowX: 'initial',
  overflowY: 'initial',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

const bodyStyle = {
  display: 'contents',
} as const;

const DEFAULT_ACTIONS = () => <></>;

export const ReleaseList: React.FC<IReleaseList> = ({
  type = 'bundle',
  Actions = DEFAULT_ACTIONS,
}) => {
  const [css, theme] = useStyletron();

  const { releaseData, fetchReleaseData } = useReleaseData();

  const cellStyle = React.useMemo(
    () =>
      css({
        height: '40px',
        borderBottomColor: theme.colors.borderTransparent || 'black',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        lineHeight: '40px !important',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      } as const),
    [css, theme.colors.borderTransparent]
  );

  React.useEffect(() => {
    void fetchReleaseData();
  }, [fetchReleaseData, type]);

  const gridHeaderStyle = React.useMemo(
    () =>
      css({
        height: '20px',
        textTransform: 'capitalize',
      }),
    [css]
  );
  const deprecatedStyle = React.useMemo(
    () =>
      css({
        textDecoration: 'line-through',
        opacity: 0.5,
      }),
    [css]
  );

  const releases = React.useMemo(
    () => releaseData?.[type].filter(Boolean) ?? [],
    [releaseData, type]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${releases.length ?? 0 + 1}, min-content)`,
      }),
    [css, releases.length]
  );

  if (!releaseData) return null;

  return (
    <StyledTable
      role="grid"
      className={cn(css(tableStyle), gridTemplateRowStyles)}
      $gridTemplateColumns={
        type === 'bundle'
          ? '120px 120px 120px auto max-content'
          : '120px 120px auto max-content'
      }
    >
      <RecativeBlock id="checker" className={css(headerStyle)} role="row">
        {type === 'bundle' ? (
          <>
            <StyledHeadCell className={gridHeaderStyle}>
              Bundle #
            </StyledHeadCell>
            <StyledHeadCell className={gridHeaderStyle}>Media #</StyledHeadCell>
            <StyledHeadCell className={gridHeaderStyle}>Code #</StyledHeadCell>
            <StyledHeadCell className={gridHeaderStyle}>Notes</StyledHeadCell>
          </>
        ) : (
          <>
            <StyledHeadCell className={gridHeaderStyle}>
              {type} #
            </StyledHeadCell>
            <StyledHeadCell className={gridHeaderStyle}>Notes</StyledHeadCell>
            <StyledHeadCell className={gridHeaderStyle}>Date</StyledHeadCell>
          </>
        )}
        <StyledHeadCell className={gridHeaderStyle} />
      </RecativeBlock>
      {releases.map((release) => {
        const contentStyle = cn(cellStyle, {
          [deprecatedStyle]: release.deprecated,
        });
        return (
          <RecativeBlock key={release.id} className={css(bodyStyle)} role="row">
            <StyledBodyCell className={contentStyle}>
              <RecativeBlock fontWeight={500}>{release.id}</RecativeBlock>
            </StyledBodyCell>
            {type === 'bundle' && (
              <>
                <StyledBodyCell className={contentStyle}>
                  {(release as IBundleRelease).mediaBuildId}
                </StyledBodyCell>
                <StyledBodyCell className={contentStyle}>
                  {(release as IBundleRelease).codeBuildId}
                </StyledBodyCell>
              </>
            )}
            <StyledBodyCell className={contentStyle}>
              {release.notes}
            </StyledBodyCell>
            {type !== 'bundle' && (
              <StyledBodyCell className={contentStyle}>
                {YYYYMMDD(release.commitTime)}
              </StyledBodyCell>
            )}
            {Actions && (
              <StyledBodyCell className={contentStyle}>
                {!release.deprecated && (
                  <Actions
                    id={release.id}
                    codeBuildId={(release as IBundleRelease).codeBuildId}
                    mediaBuildId={(release as IBundleRelease).mediaBuildId}
                    notes={release.notes}
                    type={type}
                  />
                )}
              </StyledBodyCell>
            )}
          </RecativeBlock>
        );
      })}
      {!releases.length && (
        <RecativeBlock gridColumn={type === 'bundle' ? '1 / 5' : '1 / 4'}>
          <EmptySpace
            title="No release"
            content="Create a new release with the release wizard."
          />
        </RecativeBlock>
      )}
    </StyledTable>
  );
};
