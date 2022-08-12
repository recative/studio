import * as React from 'react';

import { colors } from 'baseui/tokens';

import { useStyletron } from 'styletron-react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Banner } from 'baseui/banner';
import { ParagraphSmall } from 'baseui/typography';

export interface IHintProps {
  Artwork?: React.FC<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

const bannerOverride = {
  Root: {
    style: {
      marginLeft: 0,
      marginRight: 0,
    },
  },
  MessageContent: {
    style: {
      paddingTop: '8px',
      paddingBottom: '8px',
    },
  },
} as const;

const contentStyles = {
  color: colors.blue700,
  marginBlockStart: '0.4em',
  marginBlockEnd: '0.4em',
  fontSize: '0.85em',
  fontWeight: 500,
  lineHeight: '1.4em',
} as const;

const iconStyles = {
  color: colors.blue700,
};

export const Hint: React.FC<IHintProps> = ({ Artwork, children }) => {
  const [css] = useStyletron();

  const artwork = React.useMemo(
    () =>
      Artwork
        ? {
            icon: () => <Artwork className={css(iconStyles)} width={24} />,
          }
        : undefined,
    [Artwork, css]
  );

  return (
    <Banner overrides={bannerOverride} artwork={artwork}>
      <RecativeBlock className={css(contentStyles)}>{children}</RecativeBlock>
    </Banner>
  );
};

export interface IHintParagraphProps {
  children: React.ReactNode;
}

export const HintParagraph: React.FC<IHintParagraphProps> = ({ children }) => {
  const [css] = useStyletron();

  return (
    <ParagraphSmall className={css(contentStyles)}>{children}</ParagraphSmall>
  );
};
