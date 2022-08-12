import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';

import { Block } from 'baseui/block';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { useReleaseData } from 'pages/Release/Release';

export interface IActionsProps {
  id: number;
  codeBuildId: number;
  mediaBuildId: number;
  notes: string;
}

export interface IReleaseList {
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

export const ReleaseList: React.FC<IReleaseList> = ({ Actions }) => {
  const [css, theme] = useStyletron();

  const { releaseData, fetchReleaseData } = useReleaseData();

  const cellStyle = React.useMemo(
    () =>
      ({
        height: '40px',
        borderBottomColor: theme.colors.borderTransparent || 'black',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        lineHeight: '40px !important',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      } as const),
    [theme]
  );

  React.useEffect(() => {
    fetchReleaseData();
  }, [fetchReleaseData]);

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${
          releaseData?.bundle.length ?? 0 + 1
        }, min-content)`,
      }),
    [css, releaseData?.bundle.length]
  );

  if (!releaseData) return null;

  return (
    <StyledTable
      role="grid"
      className={cn(css(tableStyle), gridTemplateRowStyles)}
      $gridTemplateColumns={
        Actions
          ? '120px 120px 120px auto max-content'
          : '120px 120px 120px auto'
      }
    >
      <Block id="checker" className={css(headerStyle)} role="row">
        <StyledHeadCell>Bundle #</StyledHeadCell>
        <StyledHeadCell>Media #</StyledHeadCell>
        <StyledHeadCell>Code #</StyledHeadCell>
        <StyledHeadCell>Notes</StyledHeadCell>
        {Actions && <StyledHeadCell />}
      </Block>
      {releaseData.bundle.map((release) => (
        <Block key={release.id} className={css(bodyStyle)} role="row">
          <StyledBodyCell className={css(cellStyle)}>
            {release.id}
          </StyledBodyCell>
          <StyledBodyCell className={css(cellStyle)}>
            {release.mediaBuildId}
          </StyledBodyCell>
          <StyledBodyCell className={css(cellStyle)}>
            {release.codeBuildId}
          </StyledBodyCell>
          <StyledBodyCell className={css(cellStyle)}>
            {release.notes}
          </StyledBodyCell>
          {Actions && (
            <StyledBodyCell className={css(cellStyle)}>
              <Actions
                id={release.id}
                codeBuildId={release.codeBuildId}
                mediaBuildId={release.mediaBuildId}
                notes={release.notes}
              />
            </StyledBodyCell>
          )}
        </Block>
      ))}
    </StyledTable>
  );
};
