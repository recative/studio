import * as React from 'react';
import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { Block } from 'baseui/block';
import { ListItem } from 'baseui/list';

import { YYYYMMDD } from 'utils/formatDate';

import type { ISimpleRelease } from 'utils/mock/release';

const releaseItemBodyStyles: StyleObject = {
  width: '100%',
  paddingTop: '12px',
  paddingBottom: '12px',
  fontSize: '14px',
  display: 'grid',
  gridTemplate: `"version date" min-content
                  "note note" auto
                  "empty committer" min-content
                  / 1fr 1fr`,
};

const labelStyles = {
  fontSize: '0.9em',
  opacity: 0.7,
};

export const ReleaseItem: React.FC<ISimpleRelease> = ({
  id,
  committer,
  commitTime,
  notes,
}) => {
  const [css] = useStyletron();

  return (
    <ListItem>
      <Block className={css(releaseItemBodyStyles)}>
        <Block {...labelStyles} gridArea="version">
          #{id}
        </Block>
        <Block {...labelStyles} gridArea="date" justifySelf="end">
          {YYYYMMDD(commitTime)}
        </Block>
        <Block {...labelStyles} gridArea="committer" justifySelf="end">
          {committer}
        </Block>
        <Block paddingTop="8px" paddingBottom="8px" gridArea="note">
          {notes}
        </Block>
      </Block>
    </ListItem>
  );
};
