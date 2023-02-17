import * as React from 'react';
import { nanoid } from 'nanoid';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';
import { useAsync } from '@react-hookz/web';

import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Checkbox } from 'baseui/checkbox';
import { StatefulTooltip } from 'baseui/tooltip';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Select, SIZE as SELECT_SIZE } from 'baseui/select';
import { TableBuilder, TableBuilderColumn } from 'baseui/table-semantic';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { SaveIconOutline } from 'components/Icons/SaveIconOutline';

import {
  TABLE_BUILDER_OVERRIDES,
  useSelectableTableProps,
  useSortableTableProps,
  useTableState,
} from 'utils/hooks/useBaseTable';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';

import { EmptyInputOverrides, EmptySelectOverrides } from 'utils/style/form';
import type { IDataSlot } from '@recative/definitions';
import { server } from 'utils/rpc';

const cloudTableContainerStyles: StyleObject = {
  width: '1080px',
  maxWidth: '100vw',
  overflowX: 'auto',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const typeOptions = [
  { label: 'Boolean', id: 'boolean' },
  { label: 'Number', id: 'number' },
  { label: 'String', id: 'string' },
  { label: 'Complex', id: 'complex' },
];

const typeOptionMap: Record<string, string> = {};

typeOptions.forEach((item) => {
  typeOptionMap[item.id] = item.label;
});

const useDataSlotsData = () => {
  const [asyncState, asyncActions] = useAsync(() => server.listDataSlots(), []);
  const handleSubmit = React.useCallback(
    async (item: IDataSlot) => {
      await server.updateOrInsertDataSlots([item]);
      await asyncActions.execute();
    },
    [asyncActions]
  );

  return {
    dataSlots: asyncState?.result,
    fetchDataSlots: asyncActions.execute,
    handleSubmit,
  };
};

const useRowFormManager = () => {
  const [id, setId] = React.useState('');
  const [currentDataSlot, setCurrentDataSlot] =
    React.useState<IDataSlot | null>(null);

  const handleEditClick = React.useCallback((item: IDataSlot | null) => {
    setId(item?.id || '');
    setCurrentDataSlot(item);
  }, []);

  const handleAddDataSlotClick = React.useCallback(async () => {
    const newDataSlot: IDataSlot = {
      id: nanoid(),
      type: 'string',
      slug: '',
      notes: '',
      public: false,
      multipleRecord: false,
      createTime: Date.now(),
      updateTime: Date.now(),
    };

    setId(newDataSlot.id);
    setCurrentDataSlot(newDataSlot);
    await server.updateOrInsertDataSlots([newDataSlot]);
  }, []);

  return {
    id,
    currentDataSlot,
    handleEditClick,
    handleAddDataSlotClick,
  };
};

export const Cloud: React.FC = () => {
  const [css] = useStyletron();

  const { dataSlots, fetchDataSlots, handleSubmit } = useDataSlotsData();
  const { id, currentDataSlot, handleEditClick, handleAddDataSlotClick } =
    useRowFormManager();
  const tableState = useTableState(dataSlots || []);
  const tableBuilderProps = useSortableTableProps(tableState);
  const { headerCheckbox, RowCheckbox } = useSelectableTableProps(tableState);
  const [clonedDataSlot, valueChangeCallbacks] =
    useFormChangeCallbacks(currentDataSlot);
  const databaseLocked = useDatabaseLocked();

  const currentDataType = React.useMemo(() => {
    return typeOptions.find((x) => clonedDataSlot?.type === x.id);
  }, [clonedDataSlot]);

  React.useEffect(() => {
    void fetchDataSlots();
  }, [fetchDataSlots]);

  return (
    <PivotLayout
      footer={
        <>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<AddIconOutline width={20} />}
            onClick={async () => {
              await handleAddDataSlotClick();
              await fetchDataSlots();
            }}
            disabled={databaseLocked}
          >
            Add Slot
          </Button>
        </>
      }
    >
      <RecativeBlock className={css(cloudTableContainerStyles)}>
        <TableBuilder {...tableBuilderProps}>
          <TableBuilderColumn
            overrides={TABLE_BUILDER_OVERRIDES}
            header={headerCheckbox}
          >
            {RowCheckbox}
          </TableBuilderColumn>
          <TableBuilderColumn id="id" header="#">
            {(row: IDataSlot) => (
              <Input
                value={row.id.slice(0, 6)}
                disabled
                overrides={EmptyInputOverrides(100, true)}
                size={INPUT_SIZE.compact}
              />
            )}
          </TableBuilderColumn>
          <TableBuilderColumn id="type" header="Type" numeric sortable>
            {(row: IDataSlot) =>
              row.id !== currentDataSlot?.id ? (
                <>{typeOptionMap[row.type]}</>
              ) : (
                <Select
                  options={typeOptions}
                  value={currentDataType ? [currentDataType] : []}
                  size={SELECT_SIZE.compact}
                  overrides={EmptySelectOverrides(160)}
                  placeholder="Type"
                  onChange={({ value }) =>
                    valueChangeCallbacks.type?.(value[0]?.id?.toString() || '')
                  }
                />
              )
            }
          </TableBuilderColumn>
          <TableBuilderColumn id="slotId" header="Slot ID" numeric sortable>
            {(row: IDataSlot) =>
              row.id !== id ? (
                <Input
                  key={`view-${row.id}`}
                  value={row.slug}
                  disabled
                  overrides={EmptyInputOverrides(280)}
                  size={INPUT_SIZE.compact}
                />
              ) : (
                <Input
                  key={`edit-${row.id}`}
                  value={clonedDataSlot?.slug}
                  overrides={EmptyInputOverrides(280)}
                  onChange={(event) =>
                    valueChangeCallbacks.slug?.(event.currentTarget.value)
                  }
                  size={INPUT_SIZE.compact}
                />
              )
            }
          </TableBuilderColumn>
          <TableBuilderColumn
            id="multiple"
            header="Multiple"
            overrides={TABLE_BUILDER_OVERRIDES}
            numeric
            sortable
          >
            {(row: IDataSlot) =>
              row.id !== id ? (
                <Checkbox
                  key={`view-${row.id}`}
                  checked={row.multipleRecord}
                  disabled
                />
              ) : (
                <Checkbox
                  key={`edit-${row.id}`}
                  checked={clonedDataSlot?.multipleRecord || false}
                  onChange={(event) =>
                    valueChangeCallbacks.multipleRecord?.(
                      event.currentTarget.checked
                    )
                  }
                />
              )
            }
          </TableBuilderColumn>
          <TableBuilderColumn
            id="public"
            header="Public"
            overrides={TABLE_BUILDER_OVERRIDES}
            numeric
            sortable
          >
            {(row: IDataSlot) =>
              row.id !== id ? (
                <Checkbox
                  key={`view-${row.id}`}
                  checked={row.public}
                  disabled
                />
              ) : (
                <Checkbox
                  key={`edit-${row.id}`}
                  checked={clonedDataSlot?.public || false}
                  onChange={(event) =>
                    valueChangeCallbacks.public?.(event.currentTarget.checked)
                  }
                />
              )
            }
          </TableBuilderColumn>
          <TableBuilderColumn id="actions" header="" numeric>
            {(row: IDataSlot) =>
              row.id === id ? (
                <StatefulTooltip content="Save Config" returnFocus>
                  <Button
                    disabled={databaseLocked}
                    size={BUTTON_SIZE.compact}
                    kind={BUTTON_KIND.tertiary}
                    startEnhancer={<SaveIconOutline width={16} />}
                    onClick={async () => {
                      if (clonedDataSlot) await handleSubmit(clonedDataSlot);
                      handleEditClick(null);
                    }}
                  />
                </StatefulTooltip>
              ) : (
                <StatefulTooltip content="Edit Config" returnFocus>
                  <Button
                    disabled={databaseLocked}
                    size={BUTTON_SIZE.compact}
                    kind={BUTTON_KIND.tertiary}
                    startEnhancer={<EditIconOutline width={16} />}
                    onClick={() => handleEditClick(row)}
                  />
                </StatefulTooltip>
              )
            }
          </TableBuilderColumn>
        </TableBuilder>
      </RecativeBlock>
    </PivotLayout>
  );
};
