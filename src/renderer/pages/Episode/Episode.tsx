import * as React from 'react';
import { nanoid } from 'nanoid';

import type { PromiseValue } from 'type-fest';

import { useSet } from '@react-hookz/web';

import type { IAsset, IEpisode } from '@recative/definitions';

import { Block } from 'baseui/block';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';

import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';
import { ArrowUpIconOutline } from 'components/Icons/ArrowUpIconOutline';
import { ArrowDownIconOutline } from 'components/Icons/ArrowDownIconOutline';

import { server } from 'utils/rpc';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { EpisodeUnit } from './components/EpisodeUnit';
import { EditEpisodeModal } from './components/EditEpisodeModal';
import { EditAssetModal } from './components/EditAssetModal';

interface EpisodeUnitCallbacks {
  onEditClick: () => void;
  onAddAssetClick: () => IAsset | Promise<IAsset>;
  onOpen: () => void;
  onClose: () => void;
}

const useToggleGroup = () => {
  const closedIndex = useSet<number | string>([]);

  const handleOpenGroup = (x: number | string) => {
    closedIndex.delete(x);
  };

  const handleCloseGroup = (x: number | string) => {
    closedIndex.add(x);
  };

  return {
    closedIndex,
    handleOpenGroup,
    handleCloseGroup,
  };
};

const NOTHING: Record<never, never> = {};

const useEditAssetModalProps = (onSubmit?: () => void) => {
  const [editAssetModalOpen, setEditAssetModalOpen] = React.useState(false);
  const [currentAsset, setCurrentAsset] = React.useState<
    IAsset | typeof NOTHING
  >(NOTHING);

  const handleCloseEditAssetModal = React.useCallback(() => {
    setEditAssetModalOpen(false);
  }, []);

  const handleEditAssetClick = React.useCallback((item: IAsset) => {
    setCurrentAsset(item);
    setEditAssetModalOpen(true);
  }, []);

  const handleEditAssetModalSubmit = React.useCallback(
    async (x: IAsset) => {
      await server.updateOrInsertAssets([x]);
      onSubmit?.();
      setEditAssetModalOpen(false);
    },
    [onSubmit]
  );

  return {
    currentAsset,
    editAssetModalOpen,
    handleCloseEditAssetModal,
    handleEditAssetClick,
    handleEditAssetModalSubmit,
  };
};

const useEditEpisodeModalProps = (onSubmit?: () => void) => {
  const [editEpisodeModalOpen, setEditEpisodeModalOpen] = React.useState(false);
  const [currentEpisode, setCurrentEpisode] = React.useState<IEpisode | null>(
    null
  );

  const handleCloseEditEpisodeModal = React.useCallback(() => {
    setEditEpisodeModalOpen(false);
  }, []);

  const handleEditEpisodeClick = React.useCallback((item: IEpisode) => {
    setCurrentEpisode(item);
    setEditEpisodeModalOpen(true);
  }, []);

  const handleAddEpisodeClick = React.useCallback(() => {
    setCurrentEpisode({
      id: nanoid(),
      label: {},
      order: -1,
      largeCoverResourceId: '',
      createTime: Date.now(),
      updateTime: Date.now(),
    });
    setEditEpisodeModalOpen(true);
  }, []);

  const handleSubmitEditEpisodeModal = React.useCallback(
    async (x: IEpisode) => {
      await server.updateOrInsertEpisodes([x]);
      onSubmit?.();
      setEditEpisodeModalOpen(false);
    },
    [onSubmit]
  );

  return {
    currentEpisode,
    editEpisodeModalOpen,
    handleCloseEditEpisodeModal,
    handleEditEpisodeClick,
    handleAddEpisodeClick,
    handleSubmitEditEpisodeModal,
  };
};

const useEpisodesData = () => {
  type QueryResult = PromiseValue<ReturnType<typeof server.listEpisodes>>;
  const [episodes, setEpisodes] = React.useState<QueryResult | null>(null);

  const fetchData = React.useCallback(async () => {
    const result = await server.listEpisodes();
    setEpisodes(result);
  }, []);

  const handleAddAssetClick = React.useCallback(
    async (episodeId: string) => {
      const asset = await server.addEmptyAsset(episodeId);
      fetchData();
      return asset;
    },
    [fetchData]
  );

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { episodes, fetchData, handleAddAssetClick };
};

export const InternalEpisode: React.FC = () => {
  const { closedIndex, handleOpenGroup, handleCloseGroup } = useToggleGroup();
  const { episodes, fetchData, handleAddAssetClick } = useEpisodesData();
  const {
    currentEpisode,
    editEpisodeModalOpen,
    handleCloseEditEpisodeModal,
    handleEditEpisodeClick,
    handleAddEpisodeClick,
    handleSubmitEditEpisodeModal,
  } = useEditEpisodeModalProps(fetchData);

  const {
    currentAsset,
    editAssetModalOpen,
    handleCloseEditAssetModal,
    handleEditAssetClick,
    handleEditAssetModalSubmit,
  } = useEditAssetModalProps(fetchData);

  const databaseLocked = useDatabaseLocked();
  const [checkedAsset, setCheckedAsset] = React.useState<
    Record<string, string[]>
  >({});

  const handleCheckChange = React.useCallback(
    (selectedIds: string[], episodeId: string) => {
      setCheckedAsset({
        ...checkedAsset,
        [episodeId]: selectedIds,
      });
    },
    [checkedAsset]
  );

  const episodeHandlers = React.useMemo(() => {
    const result = new Map<IEpisode, EpisodeUnitCallbacks>();

    episodes?.forEach(({ episode }) => {
      result.set(episode, {
        onEditClick: () => handleEditEpisodeClick(episode),
        onAddAssetClick: () => {
          return handleAddAssetClick(episode.id);
        },
        onOpen: () => handleOpenGroup(episode.id),
        onClose: () => handleCloseGroup(episode.id),
      });
    });

    return result;
  }, [
    episodes,
    handleAddAssetClick,
    handleCloseGroup,
    handleEditEpisodeClick,
    handleOpenGroup,
  ]);

  return (
    <PivotLayout
      footer={
        <>
          <Button
            disabled={databaseLocked}
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<TrashIconOutline width={20} />}
            onClick={async () => {
              await server.removeAssets(
                Object.values(checkedAsset).reduce((a, b) => [...a, ...b], [])
              );
              await fetchData();
            }}
          >
            Delete
          </Button>
          <Button
            disabled={databaseLocked}
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<ArrowUpIconOutline width={20} />}
          >
            Expand All
          </Button>
          <Button
            disabled={databaseLocked}
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<ArrowDownIconOutline width={20} />}
          >
            Close All
          </Button>
          <Button
            disabled={databaseLocked}
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<AddIconOutline width={20} />}
            onClick={handleAddEpisodeClick}
          >
            Add Episode
          </Button>
        </>
      }
    >
      <ContentContainer width={1080}>
        <HeadingXXLarge>Episode</HeadingXXLarge>
      </ContentContainer>
      {episodes?.map(({ episode, assets, resources }) => (
        <Block key={episode.id}>
          <EpisodeUnit
            episode={episode}
            assets={assets}
            resources={resources}
            open={!closedIndex.has(episode.id)}
            onEditEpisodeClick={episodeHandlers.get(episode)?.onEditClick}
            onEditAssetClick={handleEditAssetClick}
            onAddAssetClick={episodeHandlers.get(episode)?.onAddAssetClick}
            onOpen={episodeHandlers.get(episode)?.onOpen}
            onClose={episodeHandlers.get(episode)?.onClose}
            onCheckChange={handleCheckChange}
          />
        </Block>
      ))}
      <EditEpisodeModal
        episode={currentEpisode}
        isOpen={editEpisodeModalOpen}
        onClose={handleCloseEditEpisodeModal}
        onSubmit={handleSubmitEditEpisodeModal}
      />
      <EditAssetModal
        asset={currentAsset}
        isOpen={editAssetModalOpen}
        onSubmit={handleEditAssetModalSubmit}
        onClose={handleCloseEditAssetModal}
      />
    </PivotLayout>
  );
};

export const Episode = React.memo(InternalEpisode);
