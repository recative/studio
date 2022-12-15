import * as React from 'react';
import cn from 'classnames';

import { useEvent } from 'utils/hooks/useEvent';
import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'baseui';

import {
  ROLE,
  Modal,
  ModalBody,
  ModalHeader,
  ModalButton,
  SIZE as MODAL_SIZE,
} from 'baseui/modal';
import { FormControl } from 'baseui/form-control';
import { Radio, RadioGroup } from 'baseui/radio';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { LabelSmall, ParagraphSmall } from 'baseui/typography';
import { KIND as BUTTON_KIND, SIZE as BUTTON_SIZE } from 'baseui/button';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { Toggle } from 'components/Toggle/Toggle';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ReleaseWizard } from 'components/Illustrations/ReleaseWizard';
import { ArrowDownIconOutline } from 'components/Icons/ArrowDownIconOutline';

import { useSelectedProfile } from 'pages/Bundle/components/CreateBundleModal';

import { ModalManager } from 'utils/hooks/useModalManager';

import { server } from 'utils/rpc';
import { ReleaseSelect } from './ReleaseSelect';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
  useOnChangeEventWrapperForCheckboxType,
} from 'utils/hooks/useFormChangeCallbacks';
import { ISimpleRelease } from '@recative/definitions';
import { useTerminalModal } from 'components/Terminal/TerminalModal';

export const useReleaseWizardModal = ModalManager<void, null>(null);

interface IWrappedCheckbox {
  checked: boolean;
  title: string;
  id: string;
  onChange: (checked: boolean, id: string) => void;
}

const WrappedCheckbox: React.FC<IWrappedCheckbox> = ({
  checked,
  title,
  id,
  onChange,
}) => {
  const handleChange = useEvent(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.checked, id);
    }
  );
  return <Checkbox title={title} checked={checked} onChange={handleChange} />;
};

export const ReleaseWizardModal = () => {
  const [css, theme] = useStyletron();
  const [isOpen, , , onClose] = useReleaseWizardModal();
  const [, , openTerminal] = useTerminalModal();

  const [step, setStep] = React.useState(0);

  const lastConfig = React.useMemo(
    () => ({
      notes: localStorage.getItem('@recative/release-wizard/notes') ?? '',
      mediaRelease: undefined as ISimpleRelease | undefined,
      codeRelease: undefined as ISimpleRelease | undefined,
      mediaReleaseOption: 'new',
      codeReleaseOption: 'new',
      publishMediaRelease:
        localStorage.getItem('@recative/release-wizard/publishMediaRelease') ===
        'yes',
      publishCodeRelease:
        localStorage.getItem('@recative/release-wizard/publishCodeRelease') ===
        'yes',
    }),
    []
  );

  const [clonedConfig, valueChangeCallbacks, ,] =
    useFormChangeCallbacks(lastConfig);

  React.useEffect(() => {
    localStorage.setItem('@recative/release-wizard/notes', clonedConfig.notes);
    localStorage.setItem(
      '@recative/release-wizard/publishMediaRelease',
      clonedConfig.publishMediaRelease ? 'yes' : 'no'
    );
    localStorage.setItem(
      '@recative/release-wizard/publishCodeRelease',
      clonedConfig.publishCodeRelease ? 'yes' : 'no'
    );
  }, [clonedConfig]);

  const handleNotesChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.notes
  );
  const handleMediaReleaseChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.mediaReleaseOption
  );
  const handleCodeReleaseChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.codeReleaseOption
  );
  const handlePublishMediaChange = useOnChangeEventWrapperForCheckboxType(
    valueChangeCallbacks.publishMediaRelease
  );
  const handlePublishCodeChange = useOnChangeEventWrapperForCheckboxType(
    valueChangeCallbacks.publishCodeRelease
  );

  const nextStepAvailable = React.useMemo(() => {
    if (step === 0) return !!clonedConfig.notes;
    if (step === 1) {
      if (clonedConfig.mediaReleaseOption === 'new') {
        return true;
      }

      if (
        clonedConfig.mediaReleaseOption === 'old' &&
        clonedConfig.mediaRelease
      ) {
        return true;
      }

      return false;
    }

    if (step === 2) {
      if (clonedConfig.codeReleaseOption === 'new') {
        return true;
      }

      if (
        clonedConfig.codeReleaseOption === 'old' &&
        clonedConfig.codeRelease
      ) {
        return true;
      }

      return false;
    }

    if (step === 3) return true;
    if (step === 4) return true;

    return false;
  }, [step, clonedConfig]);

  const nextStep = useEvent(() => {
    setStep((x) => x + 1);
  });

  const previousStep = useEvent(() => {
    setStep((x) => x - 1);
  });

  const handleStart = useEvent(() => {
    onClose();
    openTerminal('releaseWizard');
    server.releaseWizard({
      notes: clonedConfig.notes,
      mediaReleaseId:
        clonedConfig.mediaReleaseOption === 'new'
          ? undefined
          : clonedConfig.mediaRelease?.id ?? undefined,
      codeReleaseId:
        clonedConfig.codeReleaseOption === 'new'
          ? undefined
          : clonedConfig.codeRelease?.id ?? undefined,
      profileIds: [...selectedProfiles],
      publishCodeRelease: clonedConfig.publishCodeRelease,
      publishMediaRelease: clonedConfig.publishMediaRelease,
    });
  });

  const [profiles, profilesActions] = useAsync(server.listBundleProfile);

  React.useEffect(() => {
    profilesActions.execute();
  }, [profilesActions, profilesActions.execute]);

  const [selectedProfiles, handleSelectProfile] = useSelectedProfile();

  const additionalTableStyle = React.useMemo(
    () =>
      css({
        height: 'min-content !important',
      }),
    [css]
  );

  const headerStyle = React.useMemo(
    () =>
      css({
        top: '300px',
        display: 'contents',
        position: 'sticky',
      }),
    [css]
  );

  const unitStyle = React.useMemo(
    () =>
      css({
        paddingTop: '8px !important',
        paddingBottom: '8px !important',
        paddingLeft: '12px !important',
        paddingRight: '12px !important',
        display: 'flex',
        alignItems: 'center',
      }),
    [css]
  );

  const contentUnitStyle = React.useMemo(
    () =>
      css({
        paddingTop: '6px !important',
        paddingBottom: '6px !important',
        paddingLeft: '12px !important',
        paddingRight: '12px !important',
        lineHeight: '1em',
        whiteSpace: 'nowrap',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }),
    [css]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${
          profiles.result?.length ?? 0 + 1
        }, min-content)`,
      }),
    [css, profiles.result?.length]
  );

  return (
    <Modal
      animate
      autoFocus
      isOpen={isOpen}
      closeable={false}
      onClose={onClose}
      role={ROLE.dialog}
      size={MODAL_SIZE.auto}
    >
      <RecativeBlock display="flex" minWidth="600px">
        <RecativeBlock lineHeight={0}>
          <ReleaseWizard width={200} />
        </RecativeBlock>
        <RecativeBlock width="400px">
          {step === 0 && (
            <>
              <ModalHeader>Release Wizard</ModalHeader>
              <ModalBody>
                <ParagraphSmall>
                  The release wizard will lead you through a series of steps to
                  allow you to create a new application release.
                </ParagraphSmall>
                <RecativeBlock paddingTop="4px">
                  <FormControl
                    label="Release Name"
                    caption="A human-readable note to the release, this is only for
                developers, would not be used anywhere."
                  >
                    <Input
                      value={clonedConfig.notes}
                      size={INPUT_SIZE.mini}
                      onChange={handleNotesChange}
                    />
                  </FormControl>
                </RecativeBlock>
              </ModalBody>
            </>
          )}
          {step === 1 && (
            <>
              <ModalHeader>Media Release</ModalHeader>
              <ModalBody>
                <ParagraphSmall>
                  Either build a new resource bundle from scratch, or re-use an
                  existing bundle that has previously been developed.
                </ParagraphSmall>
                <RecativeBlock paddingTop="4px">
                  <RadioGroup
                    value={clonedConfig.mediaReleaseOption}
                    onChange={handleMediaReleaseChange}
                  >
                    <Radio value="new">
                      <LabelSmall>Create a new bundle</LabelSmall>
                    </Radio>
                    <Radio value="old">
                      <LabelSmall>Use existed bundle</LabelSmall>
                    </Radio>
                  </RadioGroup>
                  {clonedConfig.mediaReleaseOption === 'old' && (
                    <RecativeBlock paddingLeft="32px">
                      <FormControl label="Reused Release">
                        <ReleaseSelect
                          size={SELECT_SIZE.mini}
                          placeholder="Select Media bundle"
                          type="media"
                          value={clonedConfig.mediaRelease}
                          onChange={valueChangeCallbacks.mediaRelease}
                        />
                      </FormControl>
                    </RecativeBlock>
                  )}
                </RecativeBlock>
              </ModalBody>
            </>
          )}
          {step === 2 && (
            <>
              <ModalHeader>Code Release</ModalHeader>
              <ModalBody>
                <ParagraphSmall>
                  Either build a new code bundle from scratch, or re-use an
                  existing bundle that has previously been developed.
                </ParagraphSmall>
                <RecativeBlock paddingTop="4px">
                  <RadioGroup
                    value={clonedConfig.codeReleaseOption}
                    onChange={handleCodeReleaseChange}
                  >
                    <Radio value="new">
                      <LabelSmall>Create a new bundle</LabelSmall>
                    </Radio>
                    <Radio value="old">
                      <LabelSmall>Use existed bundle</LabelSmall>
                    </Radio>
                  </RadioGroup>
                  {clonedConfig.codeReleaseOption === 'old' && (
                    <RecativeBlock paddingLeft="32px">
                      <FormControl label="Reused Release">
                        <ReleaseSelect
                          size={SELECT_SIZE.mini}
                          placeholder="Select Code bundle"
                          type="code"
                          value={clonedConfig.codeRelease}
                          onChange={valueChangeCallbacks.codeRelease}
                        />
                      </FormControl>
                    </RecativeBlock>
                  )}
                </RecativeBlock>
              </ModalBody>
            </>
          )}
          {step === 3 && (
            <>
              <ModalHeader>Publish Release</ModalHeader>
              <ModalBody>
                <ParagraphSmall>
                  This will make these resources available online and accessible
                  to the users.
                </ParagraphSmall>
                <RecativeBlock paddingTop="4px">
                  <Toggle
                    checked={clonedConfig.publishMediaRelease}
                    onChange={handlePublishMediaChange}
                    labelPlacement={LABEL_PLACEMENT.right}
                  >
                    <LabelSmall>Publish generated media bundle</LabelSmall>
                  </Toggle>
                  <RecativeBlock padding="8px"></RecativeBlock>
                  <Toggle
                    checked={clonedConfig.publishCodeRelease}
                    onChange={handlePublishCodeChange}
                    labelPlacement={LABEL_PLACEMENT.right}
                  >
                    <LabelSmall>Publish generated code bundle</LabelSmall>
                  </Toggle>
                </RecativeBlock>
              </ModalBody>
            </>
          )}
          {step === 4 && (
            <>
              <ModalHeader>Bundling</ModalHeader>
              <ModalBody>
                <ParagraphSmall>
                  Create bundles for this release that are tailored to different
                  platforms, such as Web, Windows, macOS, Android, and iOS.
                </ParagraphSmall>
                <RecativeBlock paddingTop="4px">
                  <StyledTable
                    role="grid"
                    className={cn(additionalTableStyle, gridTemplateRowStyles)}
                    $gridTemplateColumns="min-content min-content auto"
                  >
                    <RecativeBlock
                      id="checker"
                      className={headerStyle}
                      role="row"
                    >
                      <StyledHeadCell
                        className={unitStyle}
                        $sticky={true}
                      ></StyledHeadCell>
                      <StyledHeadCell className={unitStyle} $sticky={false}>
                        <LabelSmall>Profile</LabelSmall>
                      </StyledHeadCell>
                      <StyledHeadCell className={unitStyle} $sticky={false}>
                        <LabelSmall>Extension #</LabelSmall>
                      </StyledHeadCell>
                    </RecativeBlock>

                    {profiles.result?.filter(Boolean).map((profile) => (
                      <RecativeBlock
                        key={profile.id}
                        display="contents"
                        role="row"
                      >
                        <StyledBodyCell className={contentUnitStyle}>
                          <RecativeBlock
                            transform="scale(0.75)"
                            data-profile-id={profile.id}
                          >
                            <WrappedCheckbox
                              id={profile.id}
                              title={profile.label}
                              checked={selectedProfiles.has(profile.id)}
                              onChange={handleSelectProfile}
                            />
                          </RecativeBlock>
                        </StyledBodyCell>
                        <StyledBodyCell className={contentUnitStyle}>
                          <LabelSmall>{profile.label}</LabelSmall>
                        </StyledBodyCell>
                        <StyledBodyCell className={contentUnitStyle}>
                          <LabelSmall>{profile.bundleExtensionId}</LabelSmall>
                        </StyledBodyCell>
                      </RecativeBlock>
                    ))}
                  </StyledTable>
                </RecativeBlock>
              </ModalBody>
            </>
          )}
          {step === 5 && (
            <>
              <ModalHeader>Getting Started</ModalHeader>
              <ModalBody>
                <ParagraphSmall>
                  By clicking the "Start" button, we will start processing the
                  tasks you have selected. This process may take some time, so
                  please be patient and wait while it is completed.
                </ParagraphSmall>
              </ModalBody>
            </>
          )}
        </RecativeBlock>
      </RecativeBlock>
      <RecativeBlock
        display="flex"
        justifyContent="flex-end"
        padding="12px"
        borderTop={`1px solid ${theme.borders.border100.borderColor}`}
      >
        <ModalButton
          kind={BUTTON_KIND.tertiary}
          size={BUTTON_SIZE.compact}
          onClick={onClose}
        >
          Cancel
        </ModalButton>

        {step !== 0 && (
          <ModalButton
            kind={BUTTON_KIND.tertiary}
            size={BUTTON_SIZE.compact}
            onClick={previousStep}
          >
            <RecativeBlock transform="rotate(90deg)">
              <ArrowDownIconOutline width="12px" />
            </RecativeBlock>
            <RecativeBlock marginLeft="6px">Back</RecativeBlock>
          </ModalButton>
        )}
        {step !== 5 && (
          <ModalButton
            kind={BUTTON_KIND.tertiary}
            size={BUTTON_SIZE.compact}
            onClick={nextStep}
            disabled={!nextStepAvailable}
          >
            <RecativeBlock marginRight="6px">Next</RecativeBlock>
            <RecativeBlock transform="rotate(-90deg)">
              <ArrowDownIconOutline width="12px" />
            </RecativeBlock>
          </ModalButton>
        )}
        {step === 5 && (
          <ModalButton
            kind={BUTTON_KIND.tertiary}
            size={BUTTON_SIZE.compact}
            onClick={handleStart}
          >
            Start
          </ModalButton>
        )}
      </RecativeBlock>
    </Modal>
  );
};
