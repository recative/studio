import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { StatefulTreeView } from 'baseui/tree-view';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

import { getLabelButton, getSimpleButtonLabel } from '../utils/getLabelButton';

const STATEFUL_TREE_OVERRIDE = {
  TreeLabel: { style: { paddingTop: 0, paddingBottom: 0 } },
};

const NO_OP = () => false;

export const InternalScriptletTree: React.FC = () => {
  const [extensions, extensionActions] = useAsync(
    server.getExtensionMetadata,
    null
  );

  React.useEffect(() => {
    extensionActions.execute();
  }, [extensionActions]);

  const treeData = React.useMemo(
    () =>
      extensions.result?.scriptlet.map((scriptlet) => ({
        id: scriptlet.id,
        label: getSimpleButtonLabel(scriptlet.label),
        isExpanded: true,
        children: scriptlet.scripts
          ?.filter((x) => x.type === 'resource')
          .map((x) => ({
            id: `${scriptlet.id}~~${x.id}`,
            label: getLabelButton(
              NO_OP,
              x.label,
              {
                extension: scriptlet.id,
                script: x.id,
              },
              (u) => console.log(u)
            ),
          })),
      })) ?? [],
    [extensions.result]
  );

  console.log(extensions);

  return (
    <RecativeBlock id="recative-scriptlet-tree" paddingTop="8px">
      <style>
        {`
            #recative-scriptlet-tree ul[role="group"] svg[title="Blank"] {
              display: none;
            }

            #recative-scriptlet-tree li[role="treeitem"]> div > div:nth-of-type(2) {
              width: 100%;
            }
        `}
      </style>
      {extensions.result ? (
        <StatefulTreeView
          overrides={STATEFUL_TREE_OVERRIDE}
          indentGuides
          data={treeData}
        />
      ) : null}
    </RecativeBlock>
  );
};

export const ScriptletTree = React.memo(InternalScriptletTree);
