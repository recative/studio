import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { StatefulTreeView } from 'baseui/tree-view';

import { toaster } from 'baseui/toast';

import type { ScriptExecutionMode } from '@recative/extension-sdk';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { useTerminalModal } from 'components/Terminal/TerminalModal';

import { useEvent } from 'utils/hooks/useEvent';
import { server } from 'utils/rpc';

import {
  ConfirmExecuteScriptModal,
  useConfirmExecuteScriptModal,
} from './ConfirmExecuteScriptModal';

import { getSelectedId } from '../utils/getSelectedId';
import { getLabelButton, getSimpleButtonLabel } from '../utils/getLabelButton';

const STATEFUL_TREE_OVERRIDE = {
  TreeLabel: { style: { paddingTop: 0, paddingBottom: 0 } },
};

const NO_OP = () => false;

export interface IScriptletDescription {
  extension: string;
  script: string;
  executeMode: ScriptExecutionMode;
  confirmBeforeExecute: boolean;
}

export interface IScriptletTreeProps {
  onRefreshResourceListRequest: () => void;
}

export const InternalScriptletTree: React.FC<IScriptletTreeProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [, , openTerminalModal] = useTerminalModal();
  const [, , openConfirmExecuteScriptModal] = useConfirmExecuteScriptModal();
  const [extensions, extensionActions] = useAsync(
    server.getExtensionMetadata,
    null
  );

  React.useEffect(() => {
    void extensionActions.execute();
  }, [extensionActions]);

  const handleButtonClick = useEvent(async (x: IScriptletDescription) => {
    const selectedId = getSelectedId();

    const confirmed = x.confirmBeforeExecute
      ? await openConfirmExecuteScriptModal({
          extension: x.extension,
          id: x.script,
          payload: getSelectedId(),
        })
      : true;

    const openTerminalPromise =
      x.executeMode === 'terminal' ? openTerminalModal('scriptlet') : null;

    if (confirmed) {
      const executeResult = await server.executeScriptlet(
        x.extension,
        x.script,
        selectedId
      );

      await openTerminalPromise;

      if (executeResult?.ok) {
        toaster.info(executeResult.message);
      } else {
        toaster.negative(executeResult?.message ?? 'Script not executed');
      }

      onRefreshResourceListRequest();
    }
  });

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
                ...x,
              },
              handleButtonClick
            ),
          })),
      })) ?? [],
    [extensions.result?.scriptlet, handleButtonClick]
  );

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
      <ConfirmExecuteScriptModal />
    </RecativeBlock>
  );
};

export const ScriptletTree = React.memo(InternalScriptletTree);
