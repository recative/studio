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
  const [css, theme] = useStyletron();

  const additionalTableStyle = React.useMemo(
    () =>
      css({
        height: 'min-content !important',
      }),
    [css]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${assets?.length ?? 0 + 1}, min-content)`,
      }),
    [css, assets?.length]
  );

  return (
    <RecativeBlock
      paddingLeft="20px"
      paddingRight="20px"
      paddingBottom="20px"
      gridColumn="span 2"
      background={theme.colors.backgroundSecondary}
    >
      <StyledTable
        role="grid"
        className={cn(
          css(tableStyle),
          additionalTableStyle,
          gridTemplateRowStyles
        )}
        $gridTemplateColumns="min-content 200px auto"
      >
        <RecativeBlock id="checker" className={css(headerStyle)} role="row">
          <StyledHeadCell $sticky={false}>#</StyledHeadCell>
          <StyledHeadCell $sticky={false}>Asset</StyledHeadCell>
          <StyledHeadCell $sticky={false} />
        </RecativeBlock>

        {assets.filter(Boolean).map((asset) => (
          <AssetTableUnit
            key={asset.id}
            asset={asset}
            resources={resources}
            onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
          />
        ))}
      </StyledTable>
    </RecativeBlock>
  );
};
