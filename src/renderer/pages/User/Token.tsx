import * as React from 'react';

import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';
import { ContentContainer } from 'components/Layout/ContentContainer';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { TokenList, ITokenListActionProps } from './components/TokenList';
import { AddTokenModal, useAddTokenModal } from './components/AddTokenModal';
import {
  ConfirmRemoveTokenModal,
  useConfirmRemoveTokenModal,
} from './components/ConfirmRemoveTokenModal';

const Actions: React.FC<ITokenListActionProps> = ({ id }) => {
  const [, , openConfirmRemoveTokenModal] = useConfirmRemoveTokenModal();
  const handleTrashIconClick = useEvent(() => {
    return openConfirmRemoveTokenModal(id);
  });

  return (
    <RecativeBlock>
      <SmallIconButton title="Remove Token">
        <TrashIconOutline width={16} onClick={handleTrashIconClick} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

const InternalToken: React.FC = () => {
  const [key, setKey] = React.useState(0);

  const [, , openAddTokenModal] = useAddTokenModal();

  const [, selectedToken] = useConfirmRemoveTokenModal();

  const databaseLocked = useDatabaseLocked();

  const refreshTable = useEvent(() => {
    setKey(Math.random());
  });

  const handleRemoveTokenModalSubmit = useEvent(async () => {
    if (selectedToken) {
      await server.deleteToken(selectedToken);
      refreshTable();
    }
  });

  return (
    <PivotLayout
      footer={
        <Button
          startEnhancer={<AddIconOutline width={20} />}
          kind={BUTTON_KIND.tertiary}
          disabled={databaseLocked}
          onClick={openAddTokenModal}
        >
          Add Token
        </Button>
      }
    >
      <ContentContainer width={1000} limitedHeight>
        <RecativeBlock
          paddingLeft="20px"
          paddingRight="20px"
          display="grid"
          gridTemplate={`
            "title" min-content
            "content" auto
          `}
          maxHeight="calc(100% - 24px)"
          height="-webkit-fill-available"
          paddingBottom="24px"
          overflow="clip"
        >
          <HeadingXXLarge>Token</HeadingXXLarge>

          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              <TokenList key={key} Actions={Actions} />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <AddTokenModal onDataRefreshRequest={refreshTable} />
      <ConfirmRemoveTokenModal
        onSubmit={handleRemoveTokenModalSubmit}
        onCancel={null}
      />
    </PivotLayout>
  );
};

export const Token = React.memo(InternalToken);
