import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';

import type { StyleObject } from 'styletron-standard';

import { Broken } from 'components/Pattern/Broken';
import { Pattern } from 'components/Pattern/Pattern';

import { useEvent } from 'utils/hooks/useEvent';

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

const thumbnailStyles: StyleObject = {
  width: `${SIZES.medium[0]}px`,
  height: `${SIZES.medium[1]}px`,
  objectFit: 'cover',
};

const largeStyle: StyleObject = {
  width: `${SIZES.large[0]}px`,
  height: `${SIZES.large[1]}px`,
};

const smallStyle: StyleObject = {
  width: `${SIZES.small[0]}px`,
  height: `${SIZES.small[1]}px`,
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
  }) => {
    const [css] = useStyletron();
    const [broken, setBroken] = React.useState(false);

    const handleImageLoadingError = useEvent(() => {
      setBroken(true);
    });

    if (broken) {
      return (
        <Broken
          className={cn(className, brokenClassName)}
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
            css(thumbnailStyles),
            {
              [css(largeStyle)]: size === 'large',
              [css(smallStyle)]: size === 'small',
            },
            className,
            imageClassName
          )}
          src={src || ''}
          alt={`Thumbnail of ${label}`}
          onError={handleImageLoadingError}
          loading="lazy"
        />
      );
    }

    return (
      <Pattern
        className={cn(className, patternClassName)}
        width={SIZES[size][0]}
        height={SIZES[size][1]}
        val={id}
      />
    );
  }
);
