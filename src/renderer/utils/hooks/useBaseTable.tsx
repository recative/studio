import * as React from 'react';

import { Checkbox } from 'baseui/checkbox';
import type { TableBuilderProps } from 'baseui/table-semantic';

type ReactState<T> = [T, React.Dispatch<React.SetStateAction<T>>];

export const TABLE_BUILDER_OVERRIDES = {
  TableHeadCell: { style: { width: '1%' } },
  TableBodyCell: {
    style: {
      width: '1%',
      textAlign: 'center' as const,
      verticalAlign: 'center' as const,
    },
  },
};

interface TableItemCommonHeader {
  id: string;
}

type TableItem<R> = TableItemCommonHeader & R;

type SelectableTableItem<R> = TableItem<R> & {
  selected: boolean;
};

export const useTableState = <R, U extends TableItem<R>, T extends U[]>(
  data: T
) => {
  const [internalState, setInternalState] = React.useState<
    SelectableTableItem<R>[] | null
  >(null);

  React.useEffect(() => {
    setInternalState(data.map((x) => ({ ...x, selected: false })));
  }, [data]);

  return [internalState, setInternalState] as ReactState<
    SelectableTableItem<R>[] | null
  >;
};

export const useSortableTableProps = <
  R,
  U extends SelectableTableItem<R>,
  T extends U[]
>(
  dataState: ReactState<T | null>
): TableBuilderProps<U> => {
  const [data] = dataState;
  const [sortColumn, setSortColumn] = React.useState('');
  const [sortAsc, setSortAsc] = React.useState(true);

  const sortedData = React.useMemo(() => {
    return (
      data?.slice().sort((a, b) => {
        const left = sortAsc ? a : b;
        const right = sortAsc ? b : a;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leftValue = String((left as any)[sortColumn]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rightValue = String((right as any)[sortColumn]);
        return leftValue.localeCompare(rightValue, 'en', {
          numeric: true,
          sensitivity: 'base',
        });
      }) || []
    );
  }, [sortColumn, sortAsc, data]);

  const handleSort = React.useCallback(
    (id: string) => {
      if (id === sortColumn) {
        setSortAsc((asc) => !asc);
      } else {
        setSortColumn(id);
        setSortAsc(true);
      }
    },
    [setSortColumn, sortColumn]
  );

  const sortOrder: 'ASC' | 'DESC' = sortAsc ? 'ASC' : 'DESC';

  const tableBuilderProps = {
    data: sortedData,
    sortColumn,
    sortOrder,
    onSort: handleSort,
  };

  return tableBuilderProps;
};

export const useSelectableTableProps = <
  R,
  U extends SelectableTableItem<R>,
  T extends U[]
>(
  dataState: ReactState<T | null>
) => {
  const [data, setData] = dataState;

  const hasAny = Boolean(data?.length);
  const hasAll = hasAny && data?.every((x) => x.selected);
  const hasSome = hasAny && data?.some((x) => x.selected);

  const handleToggleAll = React.useCallback(() => {
    setData((prevData) => {
      return (prevData?.map((x) => ({
        ...x,
        selected: !hasAll,
      })) || []) as unknown as T;
    });
  }, [hasAll, setData]);

  const handleToggle = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, checked } = event.currentTarget as HTMLInputElement;

      setData((prevData) => {
        return (prevData?.map((x) => {
          const selected = String(x.id) === name ? checked : x.selected;
          return {
            ...x,
            selected,
          };
        }) || []) as unknown as T;
      });
    },
    [setData]
  );

  const headerCheckbox = (
    <Checkbox
      checked={hasAll}
      isIndeterminate={!hasAll && hasSome}
      onChange={handleToggleAll}
    />
  );

  const RowCheckbox = (row: U) => {
    const { id, selected } = row;
    return <Checkbox name={id} checked={selected} onChange={handleToggle} />;
  };

  return { headerCheckbox, RowCheckbox };
};
