import * as React from 'react';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';
import { Block } from 'baseui/block';
import { LabelLarge, LabelXSmall } from 'baseui/typography';
import { StatefulTooltip } from 'baseui/tooltip';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { TableBuilder, TableBuilderColumn } from 'baseui/table-semantic';

import { SelectOption } from 'components/Input/AssetSelect';
import { getDisplayValue } from 'components/Input/I18Input';

import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { ArrowUpIconOutline } from 'components/Icons/ArrowUpIconOutline';
import { ArrowDownIconOutline } from 'components/Icons/ArrowDownIconOutline';
import { EditGroupIconOutline } from 'components/Icons/EditGroupIconOutline';

import { IconButtonOverrides } from 'styles/Button';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import {
  TABLE_BUILDER_OVERRIDES,
  useSelectableTableProps,
  useSortableTableProps,
  useTableState,
} from 'utils/hooks/useBaseTable';
import { EmptyInputOverrides } from 'utils/style/form';
import { ICON_BUTTON_OVERRIDES } from 'utils/style/button';
import {
  IActPoint,
  IAsset,
  IEpisode,
  IResourceItem,
} from '@recative/definitions';
import { Checkbox } from 'baseui/checkbox';

interface IEpisodeUnitProps {
  episode: IEpisode;
  assets: IAsset[];
  resources: Record<string, (IResourceItem | IActPoint)[]>;
  open: boolean;
  onEditEpisodeClick: (() => void) | undefined;
  onEditAssetClick: ((x: IAsset) => void) | undefined;
  onAddAssetClick: (() => IAsset | Promise<IAsset>) | undefined;
  onOpen: (() => void) | undefined;
  onClose: (() => void) | undefined;
  onCheckChange: (checkedIds: string[], episodeId: string) => void;
}

const seriesGroupStyles: StyleObject = {
  width: '1080px',
  maxWidth: '100vw',
  overflowX: 'auto',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const titleBarStyles: StyleObject = {
  width: '100%',
  maxWidth: '1080px',
  marginTop: '48px',
  marginLeft: 'auto',
  marginRight: 'auto',
  display: 'flex',
  justifyContent: 'space-between',
};

const titleContainerStyles: StyleObject = {
  display: 'flex',
  alignItems: 'center',
};

const titleStyles: StyleObject = {
  marginLeft: '8px',
};

const actionBarStyles: StyleObject = {
  width: '100%',
  maxWidth: '1080px',
  marginLeft: 'auto',
  marginRight: 'auto',
  display: 'flex',
  justifyContent: 'flex-end',
};

export const InternalEpisodeUnit: React.FC<IEpisodeUnitProps> = ({
  episode,
  assets,
  resources,
  open,
  onEditAssetClick,
  onEditEpisodeClick,
  onAddAssetClick,
  onOpen,
  onClose,
  onCheckChange,
}) => {
  const [css] = useStyletron();

  const tableState = useTableState(assets);
  const tableBuilderProps = useSortableTableProps(tableState);
  const { headerCheckbox, RowCheckbox } = useSelectableTableProps(tableState);
  const [table] = tableState;

  const handleAddAssetClick = React.useCallback(async () => {
    if (!onAddAssetClick) return;
    const nextAsset = await onAddAssetClick();
    onEditAssetClick?.(nextAsset);
  }, [onAddAssetClick, onEditAssetClick]);

  const databaseLocked = useDatabaseLocked();

  const selected = React.useMemo(
    () => table?.filter((x) => x.selected).map((x) => x.id) || [],
    [table]
  );

  React.useEffect(() => {
    onCheckChange(selected, episode.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, episode.id]);

  return (
    <>
      <Block className={css(titleBarStyles)}>
        <Block className={css(titleContainerStyles)}>
          <StatefulTooltip content={open ? 'Close' : 'Expand'} returnFocus>
            <Button
              startEnhancer={
                open ? (
                  <ArrowDownIconOutline width={20} />
                ) : (
                  <ArrowUpIconOutline width={20} />
                )
              }
              onClick={open ? onClose : onOpen}
              kind={BUTTON_KIND.tertiary}
              overrides={IconButtonOverrides}
            />
          </StatefulTooltip>
          <LabelLarge className={css(titleStyles)}>
            {getDisplayValue(episode.label)}
          </LabelLarge>
          <LabelXSmall marginLeft="16px">{episode.id}</LabelXSmall>
        </Block>
        <StatefulTooltip content="Edit Episode" returnFocus>
          <Button
            startEnhancer={<EditGroupIconOutline width={20} />}
            kind={BUTTON_KIND.tertiary}
            overrides={IconButtonOverrides}
            onClick={onEditEpisodeClick}
          />
        </StatefulTooltip>
      </Block>

      {open && (
        <>
          <Block className={css(seriesGroupStyles)}>
            <TableBuilder {...tableBuilderProps}>
              <TableBuilderColumn
                overrides={TABLE_BUILDER_OVERRIDES}
                header={headerCheckbox}
              >
                {RowCheckbox}
              </TableBuilderColumn>
              <TableBuilderColumn id="id" header="#">
                {(row: IAsset) => (
                  <Block
                    onClick={() =>
                      globalThis.navigator.clipboard.writeText(row.id)
                    }
                  >
                    <Input
                      value={row.id.slice(0, 6)}
                      disabled
                      overrides={EmptyInputOverrides(100, true)}
                      size={INPUT_SIZE.compact}
                    />
                  </Block>
                )}
              </TableBuilderColumn>
              <TableBuilderColumn id="order" header="Order" sortable>
                {(row: IAsset) => (
                  <Input
                    key={`view-${row.id}`}
                    type="number"
                    value={row.order}
                    disabled
                    overrides={EmptyInputOverrides(72)}
                    size={INPUT_SIZE.compact}
                  />
                )}
              </TableBuilderColumn>
              <TableBuilderColumn
                id="assetId"
                header="Asset"
                numeric
                sortable
                overrides={{ TableBodyCell: { style: { textAlign: 'left' } } }}
              >
                {(row: IAsset) => (
                  <Block
                    width="140px"
                    paddingTop="6px"
                    paddingRight="14px"
                    paddingBottom="6px"
                    paddingLeft="14px"
                  >
                    <SelectOption option={resources[row.contentId]?.[0]} />
                  </Block>
                )}
              </TableBuilderColumn>
              <TableBuilderColumn id="notes" header="Notes" numeric sortable>
                {(row: IAsset) => (
                  <Input
                    key={`view-${row.id}`}
                    value={row.notes}
                    disabled
                    overrides={EmptyInputOverrides(120)}
                    size={INPUT_SIZE.compact}
                  />
                )}
              </TableBuilderColumn>
              <TableBuilderColumn id="early-destroy" header="Early Destroy">
                {(row: IAsset) => (
                  <Checkbox checked={row.earlyDestroyOnSwitch} disabled />
                )}
              </TableBuilderColumn>
              <TableBuilderColumn id="preload" header="Preload">
                {(row: IAsset) => (
                  <Checkbox checked={!row.preloadDisabled} disabled />
                )}
              </TableBuilderColumn>
              <TableBuilderColumn id="actions" header="" numeric>
                {(row: IAsset) => (
                  <StatefulTooltip content="Edit Asset" returnFocus>
                    <Button
                      disabled={databaseLocked}
                      size={BUTTON_SIZE.compact}
                      kind={BUTTON_KIND.tertiary}
                      overrides={ICON_BUTTON_OVERRIDES}
                      startEnhancer={<EditIconOutline width={16} />}
                      onClick={() => onEditAssetClick?.(row)}
                    />
                  </StatefulTooltip>
                )}
              </TableBuilderColumn>
            </TableBuilder>
          </Block>
          <Block className={css(actionBarStyles)}>
            <Button
              disabled={databaseLocked}
              kind={BUTTON_KIND.tertiary}
              startEnhancer={<AddIconOutline width={20} />}
              onClick={handleAddAssetClick}
            >
              Add Asset
            </Button>
          </Block>
        </>
      )}
    </>
  );
};

export const EpisodeUnit = React.memo(InternalEpisodeUnit);
