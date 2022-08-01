import * as React from 'react';
import { useStyletron } from 'baseui';

import { Block } from 'baseui/block';

import { EmptyIconOutline } from 'components/Icons/EmptyIconOutline';

const containerStyles = {
  paddingTop: '24px',
  paddingRight: '24px',
  paddingBottom: '24px',
  paddingLeft: '24px',
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
} as const;

const useStyleSheets = () => {
  const [css, theme] = useStyletron();

  const titleStyles = React.useMemo(
    () =>
      css({
        ...theme.typography.LabelSmall,
        paddingBlockStart: theme.sizing.scale650,
        paddingBlockEnd: theme.sizing.scale400,
      }),
    [
      css,
      theme.sizing.scale400,
      theme.sizing.scale650,
      theme.typography.LabelSmall,
    ]
  );

  const contentStyles = React.useMemo(
    () =>
      css({
        ...theme.typography.LabelXSmall,
        paddingBlockEnd: theme.sizing.scale650,
      }),
    [css, theme.sizing.scale650, theme.typography.LabelXSmall]
  );

  return { titleStyles, contentStyles };
};

export interface IEmptySpaceProps {
  title: string;
  content: string;
}

export const EmptySpace: React.FC<IEmptySpaceProps> = ({ title, content }) => {
  const [css, theme] = useStyletron();

  const { titleStyles, contentStyles } = useStyleSheets();

  return (
    <Block className={css(containerStyles)}>
      <EmptyIconOutline width={theme.sizing.scale900} />
      <Block className={titleStyles}>{title}</Block>
      <Block className={contentStyles}>{content}</Block>
    </Block>
  );
};
