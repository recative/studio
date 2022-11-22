import * as React from 'react';

import { useStyletron } from 'baseui';
import { StyledBodyCell } from 'baseui/table-grid';

import { IAsset, IActPoint, IResourceItem } from '@recative/definitions';

import { SelectOption } from 'components/Input/AssetSelect';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';

import { ConfirmRemoveAssetModal } from './ConfirmRemoveAssetModal';
import { AssetTableActions } from './AssetTableActions';

const bodyStyle = {
  display: 'contents',
} as const;

export interface IAssetTableUnitProps {
  asset: IAsset;
  resources: Record<string, (IResourceItem | IActPoint)[]>;
  onRefreshEpisodeListRequest: () => void;
}

export const AssetTableUnit: React.FC<IAssetTableUnitProps> = ({
  asset,
  resources,
  onRefreshEpisodeListRequest,
}) => {
  const [css, theme] = useStyletron();

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
        display: 'flex',
      } as const),
    [theme]
  );

  const handleRemoveAsset = useEvent(async () => {
    await server.removeAssets([asset.id]);
    onRefreshEpisodeListRequest();
  });

  return (
    <RecativeBlock key={asset.id} className={css(bodyStyle)} role="row">
      <StyledBodyCell className={css(cellStyle)}>
        {asset.id.slice(0, 6)}
      </StyledBodyCell>
      <StyledBodyCell className={css(cellStyle)}>{asset.order}</StyledBodyCell>
      <StyledBodyCell className={css(cellStyle)}>
        <SelectOption option={resources[asset.contentId]?.[0]} />
      </StyledBodyCell>
      <StyledBodyCell className={css(cellStyle)}>
        <AssetTableActions asset={asset} />
      </StyledBodyCell>

      <ConfirmRemoveAssetModal onSubmit={handleRemoveAsset} onCancel={null} />
    </RecativeBlock>
  );
};
