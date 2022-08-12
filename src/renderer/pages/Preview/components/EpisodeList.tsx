import * as React from 'react';

import { useStyletron } from 'baseui';
import { useAsync } from '@react-hookz/web';

import { RecativeBlock } from 'components/Block/Block';
import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';
import type { ButtonOverrides } from 'baseui/button';

import { server } from 'utils/rpc';

export const useStyles = () => {
  const [css] = useStyletron();

  const actPointGroupStyles = React.useMemo(
    () =>
      css({
        paddingTop: '8px',
        fontWeight: 'bold',
      }),
    [css]
  );

  const itemOverrides: ButtonOverrides = React.useMemo(
    () => ({
      Root: {
        style: {
          marginTop: '2px',
          marginRight: '8px',
        },
      },
    }),
    []
  );

  return { actPointGroupStyles, itemOverrides };
};

interface IEpisodeItemProps {
  label: string;
  id: string;
  onItemSelected: (id: string) => void;
}

interface IEpisodeListProps {
  onItemSelected: (id: string) => void;
}

const EpisodeItem: React.VFC<IEpisodeItemProps> = ({
  label,
  id,
  onItemSelected,
}) => {
  const { itemOverrides } = useStyles();

  const handleItemClick = React.useCallback(() => {
    onItemSelected(id);
  }, [onItemSelected, id]);

  return (
    <Button
      size={BUTTON_SIZE.mini}
      kind={BUTTON_KIND.secondary}
      overrides={itemOverrides}
      onClick={handleItemClick}
    >
      {label}
    </Button>
  );
};

export const EpisodeList: React.VFC<IEpisodeListProps> = ({
  onItemSelected,
}) => {
  const [episodes, episodesAction] = useAsync(server.listEpisodes, []);

  React.useEffect(() => {
    episodesAction.execute();
  }, [episodesAction]);

  return (
    <RecativeBlock>
      {episodes.result?.map(({ episode }) => {
        return (
          <RecativeBlock key={episode.id} marginBottom="8px">
            <EpisodeItem
              id={episode.id}
              label={episode.label.en ?? ''}
              onItemSelected={onItemSelected}
            />
          </RecativeBlock>
        );
      })}
    </RecativeBlock>
  );
};
