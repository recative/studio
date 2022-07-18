import * as React from 'react';
import { useStyletron } from 'baseui';
import type { StyleObject } from 'styletron-react';

import { Block } from 'baseui/block';
import { ListItemLabel } from 'baseui/list';

import { ActPointIconOutline } from 'components/Icons/ActPointIconOutline';

import type { IActPoint } from '@recative/definitions';

const actPointContainerStyles: StyleObject = {
  width: 'fit-content',
  maxWidth: '168px',
  display: 'grid',
  gridTemplate: `" icon          firstLevelPath  separator     secondLevelPath"
                   / max-content  minmax(0, 1fr)  min-content  max-content`,
};

export const ActPointItem: React.FC<IActPoint> = ({
  firstLevelPath,
  secondLevelPath,
}) => {
  const [css] = useStyletron();

  return (
    <Block className={css(actPointContainerStyles)}>
      <Block gridArea="icon">
        <ActPointIconOutline width={20} style={{ marginRight: '4px' }} />
      </Block>
      <Block gridArea="firstLevelPath" marginRight="4px">
        <ListItemLabel
          overrides={{
            LabelContent: {
              style: {
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              },
            },
          }}
        >
          {firstLevelPath}
        </ListItemLabel>
      </Block>
      <Block gridArea="separator" marginLeft="2px" marginRight="2px">
        <ListItemLabel> / </ListItemLabel>
      </Block>
      <Block gridArea="secondLevelPath">
        <ListItemLabel>{secondLevelPath}</ListItemLabel>
      </Block>
    </Block>
  );
};
