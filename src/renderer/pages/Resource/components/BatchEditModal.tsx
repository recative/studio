import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

import { nanoid } from 'nanoid';

import { useStyletron } from 'baseui';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { ListItem } from 'baseui/list';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { KIND as BUTTON_KIND } from 'baseui/button';

import { Add } from 'components/Illustrations/Add';
import { IconButton } from 'components/Button/IconButton';
import { AddIconOutline } from 'components/Icons/AddIconOutline';

import { server } from 'utils/rpc';
import { ModalManager } from 'utils/hooks/useModalManager';

import { BatchEditOperation } from './BatchEditOperation';
import { IEditOperation } from '../../../../utils/BatchEditTypes';

export interface IBatchEditModalProps {
  onRefreshResourceListRequest: () => void;
}

const UL_STYLE = {
  width: '100%',
  paddingLeft: 0,
  paddingRight: 0,
};

const LI_OVERRIDES = {
  Root: { style: { width: '100%' } },
};

export const useBatchEditModal = ModalManager<string[], null>(null);

export const BatchEditModal: React.FC<IBatchEditModalProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [isOpen, selectedId, , onClose] = useBatchEditModal();

  const handleBatchEditModalSubmit = useEvent(async (x: IEditOperation[]) => {
    if (!selectedId) return;
    await server.batchUpdateResource(selectedId, x);
    onClose();
    onRefreshResourceListRequest();
  });

  const [css] = useStyletron();
  // const databaseLocked = useDatabaseLocked();
  const databaseLocked = false;
  const [operations, setOperations] = React.useState<IEditOperation[]>([]);

  const handleAddOperation = useEvent(() => {
    setOperations((prev) => [
      ...prev,
      {
        operationId: nanoid(),
        field: '',
        seekFor: '',
        where: '',
        operation: '',
        value: '',
        isJson: false,
      },
    ]);
  });

  const handleRemoveOperation = useEvent((operationId: string) => {
    setOperations((prev) => prev.filter((x) => x.operationId !== operationId));
  });

  const handleEditOperation = useEvent(
    (
      id: string,
      operation: IEditOperation | ((value: IEditOperation) => IEditOperation)
    ) => {
      const previousOperation = operations.find((x) => x.operationId === id);

      if (!previousOperation) {
        return null;
      }

      const trueOperation =
        typeof operation === 'function'
          ? operation(previousOperation)
          : operation;

      setOperations((prev) => {
        return prev.map((x) => (x.operationId === id ? trueOperation : x));
      });

      return null;
    }
  );

  const handleSubmit = useEvent(() => {
    return handleBatchEditModalSubmit(operations);
  });

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>
        <RecativeBlock display="flex" justifyContent="space-between">
          <RecativeBlock>Batch Edit</RecativeBlock>
          <RecativeBlock>
            <IconButton
              disabled={databaseLocked}
              kind={BUTTON_KIND.tertiary}
              startEnhancer={<AddIconOutline width={20} />}
              onClick={handleAddOperation}
            />
          </RecativeBlock>
        </RecativeBlock>
      </ModalHeader>
      <ModalBody>
        <ul className={css(UL_STYLE)}>
          {!operations.length && (
            <RecativeBlock
              marginLeft="auto"
              marginRight="auto"
              paddingTop="60px"
              paddingBottom="60px"
              display="flex"
              justifyContent="center"
            >
              <Add width="320px" />
            </RecativeBlock>
          )}
          {!!operations.length &&
            operations.map((operation) => (
              <ListItem key={operation.operationId} overrides={LI_OVERRIDES}>
                <BatchEditOperation
                  value={operation}
                  onChange={handleEditOperation}
                  onRemove={handleRemoveOperation}
                />
              </ListItem>
            ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleSubmit}>Confirm</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
