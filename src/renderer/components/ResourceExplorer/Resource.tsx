import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { Block } from 'baseui/block';
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
      <Block
        className={cn('explorer-item', css(resourceItemStyles))}
        data-resource-id={id}
      >
        <Block
          className="explorer-item-content"
          display="flex"
          flexDirection="column"
        >
          {!thumbnailSrc && (
            <Pattern className={css(thumbnailStyle)} val={id} />
          )}
          {thumbnailSrc && (
            <div
              className={css(thumbnailStyle)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                backgroundImage: `url(${thumbnailSrc})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
              }}
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
        </Block>
      </Block>
    </>
  );
};

export const Resource = React.memo(InternalResource);
Resource.whyDidYouRender = true;
