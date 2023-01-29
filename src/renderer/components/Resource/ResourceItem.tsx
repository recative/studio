import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';

import type { StyleObject } from 'styletron-react';

import { labelColorMap, tagIdMap, LabelType } from '@recative/definitions';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Tag, VARIANT } from 'baseui/tag';
import { ListItemLabel, LabelOverrides } from 'baseui/list';

import { ManagedResourceIcon } from 'components/Icons/ManagedResourceIcon';
import { Pattern } from '../Pattern/Pattern';

const listItemStyles: StyleObject = {
  maxWidth: '280px',
  display: 'flex',
  alignItems: 'center',
};

const thumbnailContainerStyles: StyleObject = {
  width: '60px',
  height: '40px',
  lineHeight: '0',
  overflow: 'hidden',
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
  managedBy?: string | null;
  variant?: ResourceItemVariant;
}

const InternalResourceItem: React.FC<IResourceItemProps> = ({
  id,
  thumbnailSrc,
  label,
  tags,
  managedBy,
  variant = ResourceItemVariant.Default,
}) => {
  const [css, theme] = useStyletron();

  const convertedTags = React.useMemo(() => {
    const tagsArr = typeof tags === 'string' ? [tags] : tags || [];
    return Array.from(tagsArr);
  }, [tags]);

  return (
    <RecativeBlock className={css(listItemStyles)}>
      <RecativeBlock className={css(thumbnailContainerStyles)}>
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
      </RecativeBlock>
      <RecativeBlock marginLeft="4px">
        <ListItemLabel overrides={listItemOverrides}>
          <RecativeBlock>
            {label}
            {managedBy && (
              <RecativeBlock
                marginLeft="4px"
                transform="translateY(2px)"
                display="inline-block"
                color={theme.colors.buttonDisabledText}
              >
                <ManagedResourceIcon height={14} width={14} />
              </RecativeBlock>
            )}
          </RecativeBlock>
        </ListItemLabel>
        {variant !== ResourceItemVariant.NoTags && (
          <RecativeBlock>
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
              convertedTags.filter(Boolean).map((tag) => {
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
          </RecativeBlock>
        )}
      </RecativeBlock>
    </RecativeBlock>
  );
};

export const ResourceItem = React.memo(InternalResourceItem);
