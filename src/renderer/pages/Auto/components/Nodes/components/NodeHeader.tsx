import * as React from 'react';

import { LabelSmall } from 'baseui/typography';

import { COLOR_SCHEME } from 'components/Pattern/Pattern';
import { RecativeBlock } from 'components/Block/RecativeBlock';

interface NodeHeaderProps {
  colorId: number;
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export const NodeHeader: React.FC<NodeHeaderProps> = React.memo(
  ({ colorId, title, Icon }) => {
    const color = COLOR_SCHEME[colorId];

    return (
      <RecativeBlock
        userSelect="none"
        backgroundColor={`#${color[1]}`}
        marginTop="-16px"
        marginLeft="-16px"
        marginRight="-16px"
        paddingTop="8px"
        paddingLeft="10px"
        paddingRight="10px"
        paddingBottom="8px"
        display="flex"
        alignItems="center"
      >
        <RecativeBlock
          color="white"
          height="18px"
          lineHeight="18px"
          marginRight="6px"
        >
          <Icon height="18px" />
        </RecativeBlock>
        <LabelSmall color="white">
          <b>{title}</b>
        </LabelSmall>
      </RecativeBlock>
    );
  }
);
