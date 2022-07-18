import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { Block } from 'baseui/block';

interface IContentContainerProps {
  className?: string;
  width: 600 | 800 | 1000 | 1080 | 1200 | 1400;
  padding?: 48 | 64 | 128;
  children?: React.ReactNode;
}

export const ContentContainer: React.FC<IContentContainerProps> = ({
  className,
  width,
  padding,
  children,
}) => {
  const [css] = useStyletron();

  const containerStyles = React.useMemo<StyleObject>(
    () => ({
      width: `calc(100% - ${padding ?? 0}px * 2)`,
      maxWidth: `${width}px`,
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: `${padding}px`,
      paddingRight: `${padding}px`,
    }),
    [width, padding]
  );

  return (
    <Block className={cn(css(containerStyles), className)}>{children}</Block>
  );
};
