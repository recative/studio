import * as React from 'react';
import { useStyletron } from 'baseui';
import type { StyleObject } from 'styletron-react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ListItemLabel } from 'baseui/list';

import { ActPointIconOutline } from 'components/Icons/ActPointIconOutline';

import type { IActPoint } from '@recative/definitions';

const actPointContainerStyles: StyleObject = {
  width: 'fit-content',
  maxWidth: '168px',
  display: 'grid',
  gridTemplate: `" icon          firstLevelPath  separator     secondLevelPath"
                   / max-content  minmax(0, 1fr)  min-content  max-content`,
  alignItems: 'center',
};

export const ActPointItem: React.FC<IActPoint> = ({
  firstLevelPath,
  secondLevelPath,
}) => {
  const [css] = useStyletron();

  return (
    <RecativeBlock className={css(actPointContainerStyles)}>
      <RecativeBlock gridArea="icon" height="20px" lineHeight="20px">
        <ActPointIconOutline width={20} style={{ marginRight: '4px' }} />
      </RecativeBlock>
      <RecativeBlock gridArea="firstLevelPath" marginRight="4px">
        <ListItemLabel
          overrides={{
            LabelContent: {
              style: {
                textOverflow: 'ellipsis',
                overflow: 'clip',
                whiteSpace: 'nowrap',
              },
            },
          }}
        >
          {firstLevelPath}
        </ListItemLabel>
      </RecativeBlock>
      <RecativeBlock gridArea="separator" marginLeft="2px" marginRight="2px">
        <ListItemLabel> / </ListItemLabel>
      </RecativeBlock>
      <RecativeBlock gridArea="secondLevelPath">
        <ListItemLabel>{secondLevelPath}</ListItemLabel>
      </RecativeBlock>
    </RecativeBlock>
  );
};
