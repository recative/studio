import * as React from 'react';

import {
  ROLE,
  SIZE,
  Modal,
  ModalBody,
  ModalHeader,
  ModalButton,
  ModalFooter,
} from 'baseui/modal';
import { KIND as BUTTON_KIND } from 'baseui/button';

import { ModalManager } from 'utils/hooks/useModalManager';
import { StarTrail } from 'components/StarTrail/StarTrail';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { RecativeLogo } from 'components/RecativeLogo/RecativeLogo';
import { LabelSmall, ParagraphXSmall } from 'baseui/typography';

export interface IModalManagerPayload {
  extension: string;
  id: string;
  payload: unknown;
}

export const useAboutModal = ModalManager<unknown, null>(null);

export const AboutModal: React.FC = () => {
  const [isOpen, , , onClose] = useAboutModal();

  return (
    <Modal
      animate
      autoFocus
      isOpen={isOpen}
      closeable={false}
      onClose={onClose}
      role={ROLE.dialog}
      size={SIZE.default}
    >
      <RecativeBlock
        top={0}
        left={0}
        width="100%"
        height="100%"
        position="absolute"
        pointerEvents="none"
        overflow="hidden"
      >
        <RecativeBlock transform="translate(-50%, -50%)">
          <RecativeBlock transform="translate(44px, 54px)">
            <StarTrail />
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
      <RecativeBlock position="relative" zIndex={1}>
        <ModalHeader>
          <RecativeLogo height="2em" />
        </ModalHeader>
        <ModalBody>
          <LabelSmall>Reactive Studio</LabelSmall>
          <ParagraphXSmall>
            © 2023 Reactive System and its affiliates. All rights reserved.
          </ParagraphXSmall>
          <RecativeBlock marginTop="1em"></RecativeBlock>
          <ParagraphXSmall>
            The Reactive System and its user interface are subject to legal
            protection through established intellectual property laws across
            numerous nations.
          </ParagraphXSmall>
          <RecativeBlock marginTop="2em"></RecativeBlock>
          <ParagraphXSmall>
            This product is licensed under the GNU General Public License (GPL)
            version 3 or later. You are free to use, modify, and distribute this
            software under the terms of the GPL license.
          </ParagraphXSmall>
          <ParagraphXSmall>
            A copy of the GNU General Public License is included with this
            software. If you did not receive a copy, please visit
            http://www.gnu.org/licenses/.
          </ParagraphXSmall>
        </ModalBody>
        <ModalFooter>
          <ModalButton kind={BUTTON_KIND.primary} onClick={onClose}>
            OK
          </ModalButton>
        </ModalFooter>
      </RecativeBlock>
    </Modal>
  );
};
