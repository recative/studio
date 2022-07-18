import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';

import type { StyleObject } from 'styletron-react';

import { labelColorMap, tagIdMap, LabelType } from '@recative/definitions';

import { Block } from 'baseui/block';
import { Tag, VARIANT } from 'baseui/tag';
import { ListItemLabel, LabelOverrides } from 'baseui/list';

import { Pattern } from '../Pattern/Pattern';

const listItemStyles: StyleObject = {
  maxWidth: '280px',
  display: 'flex',
  alignItems: 'center',
};

const thumbnailContainerStyles: StyleObject = {
  lineHeight: '0',
};

const thumbnailStyles: StyleObject = {
  width: '60px',
  height: '40px',
  objectFit: 'cover',
};

const thumbnailNoVariantStyles: StyleObject = {
  width: '40px',
  height: '20px',
};

const tagOverrides = {
  Root: {
    style: {
      height: '20px',
      paddingLeft: '4px',
      paddingRight: '4px',
      paddingTop: '0',
      paddingBottom: '0',
      marginTop: '2px',
      marginBottom: '2px',
      marginLeft: '2px',
      marginRight: '2px',
      borderRadius: '0',
    },
  },
  Text: {
    style: {
      fontSize: '10px',
      lineHeight: '12px',
    },
  },
};

const listItemOverrides: LabelOverrides = {
  LabelContent: {
    style: {
      maxWidth: '200px',
      fontSize: '14px',
      wordWrap: 'break-word',
    },
  },
};

export enum ResourceItemVariant {
  Default,
  NoTags,
}

export interface IResourceItemProps {
  id: string;
  thumbnailSrc?: string | null;
  label: string;
  tags?: Set<string> | string[] | string;
  variant?: ResourceItemVariant;
}

const InternalResourceItem: React.FC<IResourceItemProps> = ({
  id,
  thumbnailSrc,
  label,
  tags,
  variant = ResourceItemVariant.Default,
}) => {
  const [css] = useStyletron();

  const convertedTags = React.useMemo(() => {
    const tagsArr = typeof tags === 'string' ? [tags] : tags || [];
    return Array.from(tagsArr);
  }, [tags]);

  return (
    <Block className={css(listItemStyles)}>
      <Block className={css(thumbnailContainerStyles)}>
        {thumbnailSrc ? (
          <img
            className={cn(css(thumbnailStyles), {
              [css(thumbnailNoVariantStyles)]:
                variant === ResourceItemVariant.NoTags,
            })}
            src={thumbnailSrc || ''}
            alt={`Thumbnail of ${label}`}
          />
        ) : (
          <Pattern width={60} height={40} val={id} />
        )}
      </Block>
      <Block marginLeft="4px">
        <ListItemLabel overrides={listItemOverrides}>{label}</ListItemLabel>
        {variant !== ResourceItemVariant.NoTags && (
          <Block>
            {!!convertedTags.length || (
              <Tag
                closeable={false}
                variant={VARIANT.outlined}
                kind="neutral"
                overrides={tagOverrides}
              >
                Empty
              </Tag>
            )}

            {!!convertedTags.length &&
              convertedTags.map((tag) => {
                const splitedTag = tag.split(':');
                const tagType =
                  (splitedTag[0] as LabelType) || LabelType.Custom;
                const tagValue = splitedTag[1];

                return (
                  <Tag
                    key={tag}
                    closeable={false}
                    variant={VARIANT.outlined}
                    kind={labelColorMap[tagType]}
                    overrides={tagOverrides}
                  >
                    {tagIdMap[tag]?.label || tagValue}
                  </Tag>
                );
              })}
          </Block>
        )}
      </Block>
    </Block>
  );
};

export const ResourceItem = React.memo(InternalResourceItem);
