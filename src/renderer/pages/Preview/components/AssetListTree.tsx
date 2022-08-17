import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';
import { atom, useAtom } from 'jotai';

import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';
import { StatefulTreeView } from 'baseui/tree-view';

import type { ButtonOverrides } from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

interface IAssetLabel {
  label: string;
  id: string;
}

export const PREVIEW_ITEM_ATOM = atom<string | null>(null);

const treeLabelContentContainerStyle = {
  whiteSpace: 'nowrap',
  overflow: 'clip',
  textOverflow: 'ellipsis',
} as const;

const useEpisodesData = () => {
  const [episodes, episodesActions] = useAsync(server.listEpisodes);

  React.useEffect(() => {
    episodesActions.execute();
  }, [episodesActions]);

  return episodes.result;
};

const getLabelButton = (label: IAssetLabel) =>
  function LabelButton() {
    const [css] = useStyletron();
    const [selectedLabel, setSelectedLabel] = useAtom(PREVIEW_ITEM_ATOM);

    const handleButtonClick = React.useCallback(() => {
      setSelectedLabel(label?.id);
    }, [setSelectedLabel]);

    const buttonOverride: ButtonOverrides = React.useMemo(
      () => ({
        BaseButton: {
          style: ({ $theme }) => ({
            width: '-webkit-fill-available',
            paddingTop: '4px',
            paddingBottom: '4px',
            fontWeight: label.id === selectedLabel ? `bold` : `normal`,
            fontSize: $theme.typography.LabelSmall,
            justifyContent: 'flex-start',
            ':hover': { background: 'transparent' },
          }),
        },
      }),
      [selectedLabel]
    );

    return (
      <RecativeBlock className={css(treeLabelContentContainerStyle)}>
        <Button
          size={BUTTON_SIZE.compact}
          kind={BUTTON_KIND.tertiary}
          onClick={handleButtonClick}
          overrides={buttonOverride}
        >
          {label.label}
        </Button>
      </RecativeBlock>
    );
  };

const useTreeStructures = () => {
  const episodes = useEpisodesData();

  return React.useMemo(
    () =>
      episodes
        ? episodes.map(({ episode, assets }) => ({
            id: episode.id,
            label: getLabelButton({
              label: episode.label.en,
              id: episode.id,
            }),
            isExpanded: false,

            children: assets.map((asset) => ({
              id: `as:${asset?.id}`,
              label: getLabelButton({
                label: asset?.id,
                id: asset?.id,
              }),
            })),
          }))
        : [],
    [episodes]
  );
};

export const AssetListTree = () => {
  const data = useTreeStructures();

  if (!data.length) {
    return null;
  }

  return <StatefulTreeView indentGuides data={data} />;
};
