import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import { StyledTable, StyledHeadCell } from 'baseui/table-grid';

import { IAsset, IActPoint, IResourceItem } from '@recative/definitions';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { AssetTableUnit } from './AssetTableUnit';

const tableStyle = {
  overflowX: 'initial',
  overflowY: 'initial',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

interface IAssetsProps {
  assets: IAsset[];
  resources: Record<string, (IResourceItem | IActPoint)[]>;
  onRefreshEpisodeListRequest: () => void;
}

export const AssetTable: React.FC<IAssetsProps> = ({
  assets,
  resources,
  onRefreshEpisodeListRequest,
}) => {
  const [css] = useStyletron();

  const additionalTableStyle = React.useMemo(
    () =>
      css({
        height: 'min-content !important',
        marginLeft: '20px',
        marginRight: '20px',
        marginBottom: '20px',
      }),
    [css]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridColumn: 'span 3',
        gridTemplateRows: `repeat(${assets?.length ?? 0 + 1}, min-content)`,
      }),
    [css, assets?.length]
  );

  return (
    <StyledTable
      role="grid"
      className={cn(
        css(tableStyle),
        additionalTableStyle,
        gridTemplateRowStyles
      )}
      $gridTemplateColumns="80px 100px 200px auto"
    >
      <RecativeBlock id="checker" className={css(headerStyle)} role="row">
        <StyledHeadCell $sticky={false}>#</StyledHeadCell>
        <StyledHeadCell $sticky={false}>Order</StyledHeadCell>
        <StyledHeadCell $sticky={false}>Asset</StyledHeadCell>
        <StyledHeadCell $sticky={false} />
      </RecativeBlock>

      {assets.filter(Boolean).map((asset) => (
        <AssetTableUnit
          asset={asset}
          resources={resources}
          onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
        />
      ))}
    </StyledTable>
  );
};
