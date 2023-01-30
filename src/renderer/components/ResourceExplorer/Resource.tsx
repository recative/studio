import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import type { StyleObject } from 'styletron-react';

import { LabelSmall } from 'baseui/typography';

import { GroupIcon } from 'components/Icons/GroupIcon';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ManagedResourceIcon } from 'components/Icons/ManagedResourceIcon';
import { Thumbnail, ThumbnailSize } from 'components/Thumbnail/Thumbnail';

export interface IResourceProps {
  id: string;
  isGroup: boolean;
  isManaged: boolean;
  thumbnailSrc?: string | null;
  fileName: string;
}

const thumbnailStyle: StyleObject = {
  minHeight: '120px',
  display: 'block',
  pointerEvents: 'none',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  objectFit: 'contain',
};

const resourceItemStyles: StyleObject = {
  width: '160px',
  margin: '8px',
  transition: 'transform 300ms',
};

const labelStyles: StyleObject = {
  marginTop: '8px',
  marginBottom: '8px',
  marginLeft: '4px',
  marginRight: '4px',
  lineHeight: '1.55em',
  textAlign: 'center',
  wordBreak: 'break-all',
  wordWrap: 'break-word',
};

export const InternalResource: React.FC<IResourceProps> = ({
  id,
  isGroup,
  isManaged,
  thumbnailSrc,
  fileName,
}) => {
  const [css, theme] = useStyletron();

  return (
    <>
      <RecativeBlock
        className={cn('explorer-item', css(resourceItemStyles))}
        data-resource-id={id}
      >
        <RecativeBlock
          className="explorer-item-content"
          display="flex"
          flexDirection="column"
        >
          <Thumbnail
            id={id}
            imageClassName={css(thumbnailStyle)}
            size={ThumbnailSize.Large}
            src={thumbnailSrc}
            label={fileName}
          />
          <LabelSmall className={css(labelStyles)}>
            {fileName}
            {isGroup && (
              <RecativeBlock
                marginLeft="4px"
                transform="translateY(2px)"
                display="inline-block"
                color={theme.colors.buttonDisabledText}
              >
                <GroupIcon height={14} />
              </RecativeBlock>
            )}
            {isManaged && (
              <RecativeBlock
                marginLeft="4px"
                transform="translateY(2px)"
                display="inline-block"
                color={theme.colors.buttonDisabledText}
              >
                <ManagedResourceIcon height={14} />
              </RecativeBlock>
            )}
          </LabelSmall>
        </RecativeBlock>
      </RecativeBlock>
    </>
  );
};

export const Resource = React.memo(InternalResource);
Resource.whyDidYouRender = true;
