import * as React from 'react';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { RecativeBlock } from 'components/Block/Block';
import { HeadingXXLarge, ParagraphLarge } from 'baseui/typography';

const mainTitleStyles: StyleObject = {
  marginTop: '0',
  marginBottom: '0',
};

const subtitleStyles: StyleObject = {
  marginTop: '8px',
};

export interface ITitleGroupProps {
  title: string;
  subtitle?: string;
}

export const TitleGroup: React.FC<ITitleGroupProps> = ({ title, subtitle }) => {
  const [css] = useStyletron();

  return (
    <RecativeBlock>
      <HeadingXXLarge className={css(mainTitleStyles)}>{title}</HeadingXXLarge>
      {subtitle && (
        <ParagraphLarge className={css(subtitleStyles)}>
          {subtitle}
        </ParagraphLarge>
      )}
    </RecativeBlock>
  );
};
