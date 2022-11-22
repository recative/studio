import * as React from 'react';

import { useStyletron } from 'baseui';
import { StyledBodyCell } from 'baseui/table-grid';

import { IAsset, IActPoint, IResourceItem } from '@recative/definitions';

import { SelectOption } from 'components/Input/AssetSelect';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';

import { Id } from './Id';
import { AssetTableActions } from './AssetTableActions';
import { ConfirmRemoveAssetModal } from './ConfirmRemoveAssetModal';

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
      css({
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
    [theme, css]
  );

  const handleRemoveAsset = useEvent(async () => {
    await server.removeAssets([asset.id]);
    onRefreshEpisodeListRequest();
  });

  return (
    <RecativeBlock key={asset.id} className={css(bodyStyle)} role="row">
      <StyledBodyCell className={cellStyle}>
        <RecativeBlock marginRight="4px">{asset.order}</RecativeBlock>
        <Id id={asset.id} shrink={6} />
      </StyledBodyCell>
      <StyledBodyCell className={cellStyle}>
        <SelectOption option={resources[asset.contentId]?.[0]} />
      </StyledBodyCell>
      <StyledBodyCell className={cellStyle}>
        <AssetTableActions asset={asset} />
      </StyledBodyCell>

      <ConfirmRemoveAssetModal onSubmit={handleRemoveAsset} onCancel={null} />
    </RecativeBlock>
  );
};
