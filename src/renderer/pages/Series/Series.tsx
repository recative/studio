import * as React from 'react';
import { nanoid } from 'nanoid';

import { useAsync } from '@react-hookz/web';

import { RecativeBlock } from 'components/Block/Block';
import { Button } from 'baseui/button';
import { HeadingXXLarge, LabelLarge, LabelXSmall } from 'baseui/typography';
import { FormControl } from 'baseui/form-control';
import { toaster, ToasterContainer } from 'baseui/toast';

import { I18Input } from 'components/Input/I18Input';
import { I18Selector } from 'components/Input/I18Selector';
import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { I18FormControl, isFinished } from 'components/Input/I18FormControl';
import {
  ResourceSearchMode,
  ResourceSearchButton,
} from 'components/ResourceSearchModal/ResourceSearchModal';

import type { Option } from 'components/Input/AssetSelect';

import { server } from 'utils/rpc';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';
import { ISeriesMetadata } from '@recative/definitions';

const getEmptySeriesMetadata = (): ISeriesMetadata => {
  return {
    id: nanoid(),
    title: {},
    description: {},
    loadingCoverForCatalogPageResourceId: '',
    loadingCoverForMainContentsResourceId: '',
  };
};

const useMetadata = () => {
  const [asyncState, asyncActions] = useAsync(async () => {
    const data = await server.getSeriesMetadata();
    return data;
  });

  const { metadata, resources } = asyncState?.result || {};

  const [
    currentLoadingCoverForCatalogPageResource,
    setCurrentLoadingCoverForCatalogPageResource,
  ] = React.useState<Option | null>(null);
  const [
    currentLoadingCoverForMainContentsResource,
    setCurrentLoadingCoverForMainContentsResource,
  ] = React.useState<Option | null>(null);

  React.useEffect(() => {
    if (!resources || !metadata) return;

    setCurrentLoadingCoverForCatalogPageResource(
      resources[metadata.loadingCoverForCatalogPageResourceId]?.[0] ?? null
    );

    setCurrentLoadingCoverForMainContentsResource(
      resources[metadata.loadingCoverForMainContentsResourceId]?.[0] ?? null
    );
  }, [resources, metadata]);

  const handleSubmit = React.useCallback(
    async (nextMetadata: ISeriesMetadata) => {
      await server.updateOrInsertMetadata(nextMetadata);
      await asyncActions.execute();
    },
    [asyncActions]
  );

  return {
    metadata: asyncState?.result,
    fetchMetadata: asyncActions.execute,
    handleSubmit,
    currentLoadingCoverForCatalogPageResource,
    setCurrentLoadingCoverForCatalogPageResource,
    currentLoadingCoverForMainContentsResource,
    setCurrentLoadingCoverForMainContentsResource,
  };
};

export const Series: React.FC = () => {
  const {
    metadata,
    fetchMetadata,
    handleSubmit,
    currentLoadingCoverForCatalogPageResource,
    setCurrentLoadingCoverForCatalogPageResource,
    currentLoadingCoverForMainContentsResource,
    setCurrentLoadingCoverForMainContentsResource,
  } = useMetadata();
  const emptyMetadata = React.useMemo(() => getEmptySeriesMetadata(), []);
  const [clonedMetadata, valueChangeFactory] = useFormChangeCallbacks(
    metadata?.metadata || emptyMetadata
  );
  const databaseLocked = useDatabaseLocked();

  React.useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return (
    <PivotLayout>
      <ContentContainer width={1000}>
        <ToasterContainer autoHideDuration={3000} />
        <RecativeBlock
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <HeadingXXLarge>
            Series<LabelXSmall>{clonedMetadata?.id}</LabelXSmall>
          </HeadingXXLarge>
          <I18Selector />
        </RecativeBlock>
        <LabelLarge>Metadata</LabelLarge>
        <I18FormControl
          label="Show Title"
          finished={isFinished(clonedMetadata?.title)}
          caption="An internal name used to distinguish the different series, which will not be displayed on the website."
        >
          <I18Input
            disabled={databaseLocked}
            value={clonedMetadata?.title}
            onChange={(event) => valueChangeFactory?.title(event)}
          />
        </I18FormControl>
        <I18FormControl
          label="Show Description"
          finished={isFinished(clonedMetadata?.description)}
          caption="You can provide some notes for the program to facilitate this fluid collaboration with the platform operations."
        >
          <I18Input
            disabled={databaseLocked}
            value={clonedMetadata?.description}
            onChange={(event) => valueChangeFactory.description?.(event)}
          />
        </I18FormControl>
        <LabelLarge>Graphical Assets</LabelLarge>
        <RecativeBlock>
          <FormControl
            label="16:9 Loading Cover for Catalog Page"
            caption="When resources are not loaded, this video will be displayed to remind the user that the content is loading."
          >
            <ResourceSearchButton
              disabled={databaseLocked}
              type={ResourceSearchMode.Texture}
              value={currentLoadingCoverForCatalogPageResource}
              onChange={(item) => {
                valueChangeFactory.loadingCoverForCatalogPageResourceId?.(
                  item.id || ''
                );
                setCurrentLoadingCoverForCatalogPageResource(item);
              }}
            />
          </FormControl>
          <FormControl
            label="16:9 Loading Cover for Main Contents"
            caption="Ditto."
          >
            <ResourceSearchButton
              disabled={databaseLocked}
              value={currentLoadingCoverForMainContentsResource}
              type={ResourceSearchMode.Texture}
              onChange={(item) => {
                valueChangeFactory.loadingCoverForMainContentsResourceId?.(
                  item.id || ''
                );
                setCurrentLoadingCoverForMainContentsResource(item);
              }}
            />
          </FormControl>
        </RecativeBlock>
        <RecativeBlock display="flex" justifyContent="flex-end">
          <Button
            disabled={databaseLocked}
            onClick={async () => {
              if (clonedMetadata) await handleSubmit(clonedMetadata);
              await fetchMetadata();
              toaster.info('Series detail has been updated', {
                overrides: { InnerContainer: { style: { width: '100%' } } },
              });
            }}
          >
            Update
          </Button>
        </RecativeBlock>
      </ContentContainer>
    </PivotLayout>
  );
};
