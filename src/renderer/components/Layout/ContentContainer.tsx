import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { RecativeBlock } from 'components/Block/Block';

interface IContentContainerProps {
  className?: string;
  width: 600 | 800 | 1000 | 1080 | 1200 | 1400;
  limitedHeight?: boolean;
  padding?: 48 | 64 | 128;
  children?: React.ReactNode;
}

export const ContentContainer: React.FC<IContentContainerProps> = ({
  className,
  width,
  limitedHeight,
  padding,
  children,
}) => {
  const [css] = useStyletron();

  const containerStyles = React.useMemo<StyleObject>(
    () => ({
      width: `calc(100% - ${padding ?? 0}px * 2)`,
      height: limitedHeight ? '100%' : 'auto',
      maxWidth: `${width}px`,
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: `${padding}px`,
      paddingRight: `${padding}px`,
    }),
    [width, padding, limitedHeight]
  );

  return (
    <RecativeBlock className={cn(css(containerStyles), className)}>
      {children}
    </RecativeBlock>
  );
};
