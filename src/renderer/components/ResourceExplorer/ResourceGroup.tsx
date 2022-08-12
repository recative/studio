import * as React from 'react';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { RecativeBlock } from 'components/Block/Block';
import { LabelLarge } from 'baseui/typography';

import { Resource } from './Resource';
import type { IResourceProps } from './Resource';

export interface IResourceGroupProps {
  id: string;
  title: string;
  items: IResourceProps[];
}

const contentContainerStyles: StyleObject = {
  display: 'flex',
  flexWrap: 'wrap',
  maxWidth: '100vw',
  userSelect: 'none',
};

export const ResourceGroup: React.FC<IResourceGroupProps> = ({
  id,
  title,
  items,
}) => {
  const [css] = useStyletron();

  return (
    <RecativeBlock id={id}>
      <RecativeBlock>
        <LabelLarge>{title}</LabelLarge>
      </RecativeBlock>

      <RecativeBlock className={css(contentContainerStyles)}>
        {items.map((item) => (
          <Resource
            isGroup={false}
            key={item.id}
            id={item.id}
            fileName={item.fileName}
            thumbnailSrc={item.thumbnailSrc}
          />
        ))}
      </RecativeBlock>
    </RecativeBlock>
  );
};
