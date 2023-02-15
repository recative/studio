import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';

export interface IColumnConfig<K extends string> {
  id: K;
  order: number;
  width: string;
  content: React.ReactNode;
}

export type IData<K extends string> = {
  id: string;
} & {
  [key in K]: React.ReactNode;
};

export interface IGridTableProps<K extends string> {
  columns: IColumnConfig<K>[];
  data?: IData<K>[];
  emptyHeader: string;
  emptyContent: string;
  Actions?: React.FC<IData<K>>;
  renderers?: Partial<Record<K, React.FC<any>>>;
  loading?: boolean;
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

const headerCellStyle = {
  height: '20px',
  textTransform: 'capitalize',
} as const;

const bodyStyle = {
  display: 'contents',
} as const;

const DEFAULT_ACTIONS = () => <></>;

export interface IRendererProps {
  data: string | React.ReactNode;
}

const DEFAULT_RENDERERS: Record<string, React.FC<IRendererProps>> = {};

export const GridTable = <K extends string>({
  data,
  loading,
  columns,
  emptyHeader,
  emptyContent,
  renderers = DEFAULT_RENDERERS,
  Actions = DEFAULT_ACTIONS,
}: IGridTableProps<K>) => {
  const [css, theme] = useStyletron();

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

  const sortedColumns = React.useMemo(
    () => columns.sort((a, b) => a.order - b.order),
    [columns]
  );

  const gridTemplateColumns = React.useMemo(
    () => `${sortedColumns.map((x) => x.width).join(' ')} max-content`,
    [sortedColumns]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${data?.length ?? -1 + 1}, min-content)`,
      }),
    [css, data?.length]
  );

  return (
    <StyledTable
      role="grid"
      className={cn(css(tableStyle), gridTemplateRowStyles)}
      $gridTemplateColumns={gridTemplateColumns}
    >
      <RecativeBlock className={css(headerStyle)} role="row">
        {sortedColumns.map((x) => (
          <StyledHeadCell key={x.id} className={css(headerCellStyle)}>
            {x.content}
          </StyledHeadCell>
        ))}
        <StyledHeadCell className={css(headerCellStyle)} />
      </RecativeBlock>
      {data?.map((row) => {
        return (
          <RecativeBlock key={row.id} className={css(bodyStyle)} role="row">
            {sortedColumns.map((column) => {
              const Renderer = renderers[column.id] as React.FC<IRendererProps>;

              return (
                <StyledBodyCell
                  key={`${column.id}-${row.id}`}
                  className={cellStyle}
                >
                  {Renderer ? (
                    <Renderer data={row[column.id]} />
                  ) : (
                    row[column.id]
                  )}
                </StyledBodyCell>
              );
            })}

            <StyledBodyCell className={cellStyle}>
              <Actions {...row} />
            </StyledBodyCell>
          </RecativeBlock>
        );
      })}
      {!data?.length && !loading && (
        <RecativeBlock gridColumn={`1 / ${sortedColumns.length + 1}`}>
          <EmptySpace title={emptyHeader} content={emptyContent} />
        </RecativeBlock>
      )}
      {!data?.length && loading && (
        <RecativeBlock
          gridColumn={`1 / ${sortedColumns.length + 1}`}
          display="flex"
          justifyContent="center"
        >
          <Spinner $size={SPINNER_SIZE.medium} />
        </RecativeBlock>
      )}
    </StyledTable>
  );
};
