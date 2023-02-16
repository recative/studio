import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';

import type { StyleObject } from 'styletron-standard';

import { Broken } from 'components/Pattern/Broken';
import { Pattern } from 'components/Pattern/Pattern';

import { useEvent } from 'utils/hooks/useEvent';
import { floatDownAnimationStyle } from 'styles/animation';

export enum ThumbnailSize {
  Medium = 'medium',
  Large = 'large',
  Small = 'small',
}

export interface IThumbnailProps {
  className?: string;
  imageClassName?: string;
  patternClassName?: string;
  brokenClassName?: string;
  noAnimation?: boolean;
  id: string;
  src?: string | null;
  label: string;
  size?: ThumbnailSize;
}

const SIZES: Record<ThumbnailSize, [number, number]> = {
  [ThumbnailSize.Medium]: [60, 40],
  [ThumbnailSize.Large]: [160, 120],
  [ThumbnailSize.Small]: [40, 20],
};

const imageStyle: StyleObject = {
  opacity: 0,
  transform: 'translateY(5%)',
  objectFit: 'cover',
};

const mediumStyle: StyleObject = {
  width: `${SIZES.medium[0]}px`,
  height: `${SIZES.medium[1]}px`,
};

const largeStyle: StyleObject = {
  width: `${SIZES.large[0]}px`,
  height: `${SIZES.large[1]}px`,
};

const smallStyle: StyleObject = {
  width: `${SIZES.small[0]}px`,
  height: `${SIZES.small[1]}px`,
};

const noAnimationStyle: StyleObject = {
  opacity: 1,
  transform: 'translateY(0)',
};

export const Thumbnail: React.FC<IThumbnailProps> = React.memo(
  ({
    className,
    imageClassName,
    patternClassName,
    brokenClassName,
    id,
    label,
    src,
    size = ThumbnailSize.Medium,
    noAnimation,
  }) => {
    const [css] = useStyletron();
    const [broken, setBroken] = React.useState(false);
    const [loaded, setLoaded] = React.useState(false);

    const handleImageLoadingError = useEvent(() => {
      setBroken(true);
    });

    const handleImageLoaded = useEvent(() => {
      if (!noAnimation) setLoaded(true);
    });

    if (broken) {
      return (
        <Broken
          className={cn(className, brokenClassName, {
            [css(floatDownAnimationStyle)]: !noAnimation,
          })}
          width={SIZES[size][0]}
          height={SIZES[size][1]}
          val={id}
        />
      );
    }

    if (src) {
      return (
        <img
          className={cn(
            css(imageStyle),
            {
              [css(largeStyle)]: size === 'large',
              [css(smallStyle)]: size === 'small',
              [css(mediumStyle)]: size === 'medium',
              [css(floatDownAnimationStyle)]: loaded && !noAnimation,
              [css(noAnimationStyle)]: noAnimation,
            },
            className,
            imageClassName
          )}
          src={src}
          alt={`Thumbnail of ${label}`}
          onError={handleImageLoadingError}
          onLoad={handleImageLoaded}
          loading="lazy"
        />
      );
    }

    return (
      <Pattern
        className={cn(className, patternClassName, {
          [css(floatDownAnimationStyle)]: !noAnimation,
        })}
        width={SIZES[size][0]}
        height={SIZES[size][1]}
        val={id}
      />
    );
  }
);
