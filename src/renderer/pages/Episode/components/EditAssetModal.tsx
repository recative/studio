/* eslint-disable no-restricted-syntax */
import * as React from 'react';
import debug from 'debug';

import {
  Number,
  String,
  Boolean,
  Array as ArrayType,
  Record as RecordType,
  Unknown,
} from 'runtypes';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

import { useImmer } from 'use-immer';

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalButton,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { Input } from 'baseui/input';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { FormControl } from 'baseui/form-control';
import { KIND as BUTTON_KIND } from 'baseui/button';

import {
  ResourceSearchMode,
  ResourceSearchButton,
} from 'components/ResourceSearchModal/ResourceSearchModal';
import { TabTitle } from 'components/Layout/Pivot';

import {
  useInputUpdateImmerCallback,
  useAssetUpdateImmerCallback,
} from 'utils/hooks/useUpdateImmerCallback';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { TABS_OVERRIDES, PIVOT_TAB_OVERRIDES } from 'utils/style/tab';

import type { IAsset } from '@recative/definitions';

import { Checkbox } from 'baseui/checkbox';
import { neoTheme } from '../../Preview/utils/neoTheme';

const log = debug('renderer:edit-asset-modal');

const triggersTypeChecker = ArrayType(
  RecordType({
    from: Number,
    to: Number,
    id: String,
    managedStateExtensionId: String,
    spec: Unknown,
  }).Or(
    RecordType({
      time: Number,
      once: Boolean,
      id: String,
      managedStateExtensionId: String,
      spec: Unknown,
    })
  )
);

type Nothing = Record<never, never>;

export interface IEditAssetModalProps {
  asset: IAsset | Nothing;
  isOpen: boolean;
  onSubmit: (x: IAsset) => void;
  onClose: () => void;
}

export const EditAssetModal: React.VFC<IEditAssetModalProps> = ({
  asset,
  isOpen,
  onSubmit,
  onClose,
}) => {
  const databaseLocked = useDatabaseLocked();

  const [assetData, setAssetData] = useImmer(asset);
  const [activeKey, setActiveKey] = React.useState<React.Key>(1);

  React.useEffect(() => {
    if (isOpen) {
      setAssetData(() => asset);
    }
  }, [asset, isOpen, setAssetData]);

  const [valid, setValid] = React.useState(true);
  const handleSubmit = React.useCallback(() => {
    if ('id' in assetData) {
      onSubmit(assetData);
    }
  }, [assetData, onSubmit]);

  const handleCodeChange = React.useCallback(
    (value: string) => {
      setAssetData((draft) => {
        if (!('id' in draft)) return;

        try {
          const parsedValue = JSON.parse(value);
          if (triggersTypeChecker.check(parsedValue)) {
            draft.triggers = parsedValue;
          }

          setValid(true);
        } catch (e) {
          log('ERROR:', e);
          setValid(false);
        }
      });
    },
    [setAssetData]
  );

  const handleNotesChange = useInputUpdateImmerCallback(
    setAssetData,
    'notes',
    null
  );

  const handleOrderChange = useInputUpdateImmerCallback(
    setAssetData,
    'order',
    React.useCallback((value: string) => parseInt(value, 10), [])
  );

  const handleEarlyDestroyChange = useInputUpdateImmerCallback(
    setAssetData,
    'earlyDestroyOnSwitch',
    React.useCallback(
      (_: unknown, event: React.FormEvent<HTMLInputElement> | undefined) =>
        event?.currentTarget.checked,
      []
    )
  );

  const handlePreloadChange = useInputUpdateImmerCallback(
    setAssetData,
    'preloadDisabled',
    React.useCallback(
      (_: unknown, event: React.FormEvent<HTMLInputElement> | undefined) =>
        !event?.currentTarget.checked,
      []
    )
  );

  const [selectedAsset, handleSelectedAssetChange] =
    useAssetUpdateImmerCallback(assetData, setAssetData);

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Edit Asset</ModalHeader>

      <ModalBody>
        <Tabs
          overrides={TABS_OVERRIDES}
          activeKey={activeKey}
          onChange={({ activeKey: x }) => setActiveKey(x)}
        >
          <Tab
            title={<TabTitle>Metadata</TabTitle>}
            overrides={PIVOT_TAB_OVERRIDES}
          >
            <RecativeBlock marginTop="8px" />
            <FormControl label="Order" caption="Asset order of the asset.">
              <Input
                type="number"
                disabled={databaseLocked}
                value={'order' in assetData ? assetData.order : ''}
                onChange={handleOrderChange}
              />
            </FormControl>
            <FormControl
              label="Asset"
              caption="Selected asset resource, could be act point or video."
            >
              <ResourceSearchButton
                disabled={databaseLocked}
                type={ResourceSearchMode.Asset}
                value={selectedAsset}
                onChange={handleSelectedAssetChange}
              />
            </FormControl>
            <FormControl
              label="Early destroy"
              caption="Should this asset destroy earlier than setup of next asset"
            >
              <Checkbox
                disabled={databaseLocked}
                checked={
                  'earlyDestroyOnSwitch' in assetData
                    ? assetData.earlyDestroyOnSwitch
                    : false
                }
                onChange={handleEarlyDestroyChange}
              />
            </FormControl>
            <FormControl
              label="Preload"
              caption="Should this asset preloaded when last asset was playing"
            >
              <Checkbox
                disabled={databaseLocked}
                checked={
                  'preloadDisabled' in assetData
                    ? !assetData.preloadDisabled
                    : true
                }
                onChange={handlePreloadChange}
              />
            </FormControl>
            <FormControl
              label="Notes"
              caption="Some human readable notes for others."
            >
              <Input
                disabled={databaseLocked}
                value={'notes' in assetData ? assetData.notes : ''}
                onChange={handleNotesChange}
              />
            </FormControl>
          </Tab>

          <Tab
            title={<TabTitle>Triggers</TabTitle>}
            overrides={PIVOT_TAB_OVERRIDES}
          >
            {'id' in assetData && (
              <CodeMirror
                key={assetData.id}
                height="calc(80vh - 188px)"
                value={JSON.stringify(assetData.triggers || [], null, 2)}
                extensions={[json()]}
                theme={neoTheme}
                onChange={handleCodeChange}
              />
            )}
          </Tab>
        </Tabs>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Close
        </ModalButton>
        <ModalButton
          disabled={!valid}
          onClick={handleSubmit}
          kind={BUTTON_KIND.primary}
        >
          Submit
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
