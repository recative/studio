import * as React from 'React';
import { useStyletron } from 'baseui';

import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ArrowUpIconOutline } from 'components/Icons/ArrowUpIconOutline';

const rotatedExpandIcon = {
  transform: 'rotate(90deg)',
  transition: 'transform 300ms',
};

const notRotatedExpandIcon = {
  transform: 'rotate(180deg)',
  transition: 'transform 300ms',
};

export interface IExpandedButtonProps {
  expanded: boolean;
  onClick: () => void;
}

export const ExpandButton: React.FC<IExpandedButtonProps> = ({
  expanded,
  onClick,
}) => {
  const [css] = useStyletron();

  return (
    <SmallIconButton title={expanded ? 'Expand' : 'Close'} onClick={onClick}>
      <ArrowUpIconOutline
        width={12}
        className={
          expanded ? css(notRotatedExpandIcon) : css(rotatedExpandIcon)
        }
      />
    </SmallIconButton>
  );
};
