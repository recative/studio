import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { LabelSmall } from 'baseui/typography';

import { Pattern } from 'components/Pattern/Pattern';
import { GroupIcon } from 'components/Icons/GroupIcon';

export interface IResourceProps {
  id: string;
  isGroup: boolean;
  thumbnailSrc?: string | null;
  fileName: string;
}

const thumbnailStyle: StyleObject = {
  width: '160px',
  height: '120px',
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
  thumbnailSrc,
  fileName,
}) => {
  const [css] = useStyletron();

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
          {!thumbnailSrc && (
            <Pattern className={css(thumbnailStyle)} val={id} />
          )}
          {thumbnailSrc && (
            <img
              className={css(thumbnailStyle)}
              alt={`Thumbnail of ${fileName}`}
              src={thumbnailSrc}
              width={160}
              height={120}
              loading="lazy"
            />
          )}
          <LabelSmall className={css(labelStyles)}>
            {isGroup && (
              <GroupIcon
                height={14}
                style={{ marginRight: '4px', transform: 'translateY(1px)' }}
              />
            )}
            {fileName}
          </LabelSmall>
        </RecativeBlock>
      </RecativeBlock>
    </>
  );
};

export const Resource = React.memo(InternalResource);
Resource.whyDidYouRender = true;
