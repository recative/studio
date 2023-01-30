import * as React from 'react';
import { h32 } from 'xxhashjs';

import { useStyletron } from 'baseui';

import type { StyleObject } from 'styletron-standard';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { BrokenThumbnailIconOutline } from 'components/Icons/BrokenThumbnailIconOutline';

import { COLOR_SCHEME, COLOR_SCHEME_COUNT } from './Pattern';

interface IPatternProps {
  className?: string;
  width?: number;
  height?: number;
  val: string;
}

const svgStyle: StyleObject = {
  top: '50%',
  left: '50%',
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
};

export const Broken: React.FC<IPatternProps> = React.memo(
  ({ className, width, height, val }) => {
    const [css] = useStyletron();

    const [bColor, pColor] = React.useMemo(() => {
      const hash = h32(val, 0);
      const hashForColor = hash.toString(COLOR_SCHEME_COUNT);
      const backgroundColor = COLOR_SCHEME[hashForColor[0]][4];
      const patternColor = COLOR_SCHEME[hashForColor[0]][2];

      return [backgroundColor, patternColor] as const;
    }, [val]);

    return (
      <RecativeBlock
        className={className}
        minWidth={`${width}px` ?? '50px'}
        minHeight={`${height}px` ?? '50px'}
        backgroundColor={`#${bColor}`}
        color={`#${pColor}`}
        display="inline-block"
        position="relative"
      >
        <BrokenThumbnailIconOutline className={css(svgStyle)} height="25%" />
      </RecativeBlock>
    );
  }
);
