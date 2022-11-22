import * as React from 'react';
import { nanoid } from 'nanoid';

import type { PromiseValue } from 'type-fest';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { HeadingXXLarge } from 'baseui/typography';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';

import { AddIconOutline } from 'components/Icons/AddIconOutline';

import { server } from 'utils/rpc';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import {
  EditEpisodeModal,
  useEditEpisodeModal,
} from './components/EditEpisodeModal';
import { EpisodeList } from './components/EpisodeList';
import { EditAssetModal } from './components/EditAssetModal';

const useEpisodesData = () => {
  type QueryResult = PromiseValue<ReturnType<typeof server.listEpisodes>>;
  const [episodes, setEpisodes] = React.useState<QueryResult | null>(null);

  const fetchData = React.useCallback(async () => {
    const result = await server.listEpisodes();
    setEpisodes(result);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { episodes, fetchData };
};

export const InternalEpisode: React.FC = () => {
  const databaseLocked = useDatabaseLocked();
  const { episodes, fetchData } = useEpisodesData();
  const [, , openEditEpisodeModal] = useEditEpisodeModal();

  const handleAddEpisodeClick = React.useCallback(() => {
    openEditEpisodeModal({
      id: nanoid(),
      label: {},
      order: -1,
      largeCoverResourceId: '',
      createTime: Date.now(),
      updateTime: Date.now(),
    });
  }, [openEditEpisodeModal]);

  return (
    <PivotLayout
      footer={
        <>
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
          <HeadingXXLarge gridArea="title">Episode</HeadingXXLarge>
          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              {episodes && (
                <EpisodeList
                  episodes={episodes}
                  onRefreshEpisodeListRequest={fetchData}
                />
              )}
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <EditAssetModal onRefreshEpisodeListRequest={fetchData} />
      <EditEpisodeModal onRefreshEpisodeListRequest={fetchData} />
    </PivotLayout>
  );
};

export const Episode = React.memo(InternalEpisode);
