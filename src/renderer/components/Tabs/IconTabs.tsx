import * as React from 'react';

import { Tab, Tabs } from 'baseui/tabs-motion';
import type { onChange as OnTabChange } from 'baseui/tabs-motion';

import { TABS_OVERRIDES, ICON_TAB_OVERRIDES } from 'utils/style/tab';
import { useEvent } from 'utils/hooks/useEvent';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { floatUpAnimationStyle } from 'styles/animation';
import { useStyletron } from 'baseui';

interface ITabConfig {
  id: string;
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  Content?: React.FC;
  content?: React.ReactNode;
}

interface ITabsProps {
  initialActiveKey?: string;
  config: ITabConfig[];
}

export const IconTabs: React.FC<ITabsProps> = ({
  initialActiveKey,
  config,
}) => {
  const [css] = useStyletron();
  const [activeKey, setActiveKey] = React.useState<React.Key>(
    initialActiveKey ?? ''
  );

  const handleTabsChange: OnTabChange = useEvent(({ activeKey: x }) =>
    setActiveKey(x)
  );

  const Artworks = React.useMemo(
    () => config.map((x) => () => <x.Icon width={16} />),
    [config]
  );

  return (
    <Tabs
      overrides={TABS_OVERRIDES}
      activeKey={activeKey}
      onChange={handleTabsChange}
    >
      {config.map(({ id, title, Content, content }, i) => (
        <Tab
          key={id}
          title={title}
          artwork={Artworks[i]}
          overrides={ICON_TAB_OVERRIDES}
        >
          <RecativeBlock className={css(floatUpAnimationStyle)}>
            {Content ? <Content /> : content}
          </RecativeBlock>
        </Tab>
      ))}
    </Tabs>
  );
};
