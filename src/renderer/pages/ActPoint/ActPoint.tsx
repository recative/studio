import * as React from 'react';

import { useAtom } from 'jotai';
import { useStyletron } from 'styletron-react';
import { useAsync } from '@react-hookz/web';

import type { StyleObject } from 'styletron-react';

import { StatefulTooltip } from 'baseui/tooltip';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { RecativeBlock } from 'components/Block/Block';
import { HeadingXXLarge, LabelLarge } from 'baseui/typography';

import type { ButtonOverrides } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { ActPointItemIconOutline } from 'components/Icons/ActPointItemIconOutline';
import { SyncIconOutline } from 'components/Icons/SyncIconOutline';

import { IActPoint } from '@recative/definitions';
import { server } from 'utils/rpc';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

import { EditActPointModal } from './components/EditActPointModal';

const CONTENT_CONTAINER_STYLES: StyleObject = {
  display: 'flex',
  flexWrap: 'wrap',
  maxWidth: '100vw',
  userSelect: 'none',
};

const GROUP_TITLE_STYLES: StyleObject = {
  marginTop: '24px',
  marginBottom: '8px',
  marginLeft: '4px',
  marginRight: '4px',
};

const BUTTON_OVERRIDES: ButtonOverrides = {
  Root: {
    style: {
      marginLeft: '4px',
      marginRight: '4px',
      marginTop: '4px',
      marginBottom: '4px',
    },
  },
};

const useEditModalProps = (onSubmit?: () => void) => {
  const [editActPointModalOpen, setEditActPointModalOpen] =
    React.useState(false);
  const [currentActPoint, setCurrentActPoint] =
    React.useState<IActPoint | null>(null);

  const handleCloseEditModal = React.useCallback(() => {
    setEditActPointModalOpen(false);
  }, []);

  const handleEditClick = React.useCallback((item: IActPoint) => {
    setCurrentActPoint(item);
    setEditActPointModalOpen(true);
  }, []);

  const handleSubmitEditModal = React.useCallback(
    async (x: IActPoint) => {
      await server.updateOrInsertActPoint([x]);
      onSubmit?.();
      setEditActPointModalOpen(false);
    },
    [onSubmit]
  );

  return {
    currentActPoint,
    editActPointModalOpen,
    handleCloseEditModal,
    handleEditClick,
    handleSubmitEditModal,
  };
};

export interface IActPointItemProps extends IActPoint {
  onClick: (x: IActPoint) => void;
}

const ActPointItem: React.FC<IActPointItemProps> = ({
  onClick,
  ...actPoint
}) => {
  const handleItemClick = React.useCallback(() => {
    onClick(actPoint);
  }, [onClick, actPoint]);

  return (
    <StatefulTooltip content={actPoint.fullPath}>
      <Button
        kind={BUTTON_KIND.secondary}
        startEnhancer={<ActPointItemIconOutline width={20} />}
        overrides={BUTTON_OVERRIDES}
        onClick={handleItemClick}
      >
        {actPoint.label}
      </Button>
    </StatefulTooltip>
  );
};

export interface IActPointGroupProps {
  id: string;
  title: string;
  items: IActPoint[];
  path?: string;
  onItemClick: (x: IActPoint) => void;
}

const ActPointGroup: React.FC<IActPointGroupProps> = ({
  id,
  title,
  items,
  onItemClick,
}) => {
  const [css] = useStyletron();

  return (
    <RecativeBlock id={id}>
      <RecativeBlock className={css(GROUP_TITLE_STYLES)}>
        <LabelLarge>{title}</LabelLarge>
      </RecativeBlock>

      <RecativeBlock className={css(CONTENT_CONTAINER_STYLES)}>
        {items.map((item) => (
          <ActPointItem key={item.id} onClick={onItemClick} {...item} />
        ))}
      </RecativeBlock>
    </RecativeBlock>
  );
};

export const useActPoints = () => {
  const [actPoints, actPointsActions] = useAsync(async () => {
    return server.listActPoints();
  });

  React.useEffect(() => {
    actPointsActions.execute();
  }, [actPointsActions]);

  const refreshActPointList = actPointsActions.execute;

  return { actPoints, refreshActPointList };
};

export const ActPoint: React.FC = () => {
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const { actPoints, refreshActPointList } = useActPoints();

  const handleSyncClick = React.useCallback(async () => {
    if (!workspaceConfiguration) return;

    await server.syncActPoints(workspaceConfiguration);
    refreshActPointList();
  }, [workspaceConfiguration, refreshActPointList]);

  const {
    currentActPoint,
    editActPointModalOpen,
    handleCloseEditModal,
    handleEditClick,
    handleSubmitEditModal,
  } = useEditModalProps(refreshActPointList);

  return (
    <PivotLayout
      footer={
        <>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<SyncIconOutline width={20} />}
            onClick={handleSyncClick}
          >
            Sync
          </Button>
        </>
      }
    >
      <ContentContainer width={1000}>
        <HeadingXXLarge>Act Point</HeadingXXLarge>
        {actPoints.result &&
          Object.entries(actPoints.result).map(([groupId, items]) => {
            return (
              <ActPointGroup
                key={groupId}
                id={groupId}
                title={groupId}
                items={items}
                onItemClick={handleEditClick}
              />
            );
          })}
      </ContentContainer>
      <EditActPointModal
        key={currentActPoint?.id ?? ''}
        actPoint={currentActPoint}
        isOpen={editActPointModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleSubmitEditModal}
      />
    </PivotLayout>
  );
};
