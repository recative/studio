import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useNavigate } from 'react-router';
import { useLocalStorage } from 'react-use';

import { JoinMode } from '@recative/studio-definitions';

import { FormControl } from 'baseui/form-control';
import { ParagraphSmall } from 'baseui/typography';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { ProgressSteps, Step } from 'baseui/progress-steps';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { Button, ButtonProps, KIND, SIZE } from 'baseui/button';
import { ToasterContainer, PLACEMENT, toaster } from 'baseui/toast';

import { Select } from 'components/Select/Select';
import { FileInput } from 'components/Input/FileInput';
import { StorageKey } from 'pages/User/components/StorageKey';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useLoginCredential } from 'utils/hooks/loginCredential';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForBaseUiSelectWithSingleValue,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { GuideFormLayout } from 'components/Layout/GuideFormLayout';
import { CardHeader } from 'components/Layout/CardHeader';

import { ExistedCredential } from './components/ExistedCredential';

const DEFAULT_FORM_DATA = {
  actServer: '',
  token: '',
  backupKey: '',
};

const SpacedButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      {...props}
      kind={KIND.secondary}
      size={SIZE.compact}
      overrides={{
        BaseButton: {
          style: ({ $theme }) => ({
            marginRight: $theme.sizing.scale400,
            marginTop: $theme.sizing.scale800,
          }),
        },
      }}
    />
  );
};

interface IStorage {
  key: string;
  id: string;
}

export const Recover: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = React.useState(0);

  const previousStep = useEvent(() => setCurrent((x) => x - 1));
  const nextStep = useEvent(() => setCurrent((x) => x + 1));

  const [mediaWorkspacePath, setMediaWorkspacePath] = useLocalStorage<string[]>(
    'sync:last-media-workspace-path',
    []
  );
  const [codeRepositoryPath, setCodeRepositoryPath] = useLocalStorage<string[]>(
    'sync:last-code-repository-path',
    []
  );

  const [recoverValue, valueChangeCallbacks] =
    useFormChangeCallbacks(DEFAULT_FORM_DATA);

  const handleActServerChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.actServer
  );
  const handleTokenChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.token
  );
  const handleSelectChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.backupKey
    );

  const selectedRelease = React.useMemo(
    () => (recoverValue.backupKey ? [recoverValue.backupKey] : []),
    [recoverValue.backupKey]
  );

  const [lastCredential, getLoginCredential] = useLoginCredential();

  React.useEffect(() => {
    if (lastCredential) {
      valueChangeCallbacks.actServer(lastCredential.host);
      valueChangeCallbacks.token(lastCredential.token);
    }
  }, [lastCredential, valueChangeCallbacks]);

  const [firstStepTask, firstStepAction] = useAsync(async () => {
    if (lastCredential?.tokenHash) {
      nextStep();
      return;
    }

    try {
      await server.userLogin(recoverValue.token, recoverValue.actServer);
      await getLoginCredential();
      nextStep();
    } catch (error) {
      toaster.negative(
        `Failed to login: ${
          error instanceof Error ? error.message : 'Unknown Error'
        }`,
        {
          overrides: { InnerContainer: { style: { width: '100%' } } },
        }
      );
    }
  });

  const [storageList, storageListActions] = useAsync(async () => {
    const storages = await server.getStorages();

    return storages
      .filter((x) => x.key.endsWith('/db'))
      .map((x) => ({ ...x, id: x.key }));
  });

  React.useEffect(() => {
    if (lastCredential?.tokenHash) {
      storageListActions.execute();
    }
  }, [lastCredential?.tokenHash, storageListActions]);

  const [gettingStarted, gettingStartedAction] = useAsync(async () => {
    if (
      !mediaWorkspacePath ||
      !mediaWorkspacePath[0] ||
      !codeRepositoryPath ||
      !codeRepositoryPath[0] ||
      !recoverValue?.backupKey
    ) {
      toaster.negative(
        `The information you provided is not complete, unable to download the data.`
      );
      return;
    }

    await server.setupWorkspace(mediaWorkspacePath[0], codeRepositoryPath[0]);
    server.recoverBackup(recoverValue.backupKey, JoinMode.replaceOld);
    navigate('/downloading-backup');
  });

  const getLabel = useEvent(({ option }: any) => (
    <RecativeBlock marginTop="-4px" marginBottom="4px">
      <StorageKey {...option} />
    </RecativeBlock>
  ));

  return (
    <GuideFormLayout
      title={<CardHeader>Download Resource Source</CardHeader>}
      footer={<></>}
    >
      <RecativeBlock
        maxWidth="640px"
        margin="0 auto"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <ToasterContainer
          autoHideDuration={3000}
          placement={PLACEMENT.bottomRight}
        />
        <ProgressSteps current={current}>
          <Step title="Access Credential">
            {lastCredential?.tokenHash ? (
              <ExistedCredential />
            ) : (
              <RecativeBlock>
                <FormControl
                  label="Act Server"
                  caption="An authentication server instance deployed by your team, or a public server."
                >
                  <Input
                    size={INPUT_SIZE.compact}
                    value={recoverValue.actServer}
                    onChange={handleActServerChange}
                    disabled={firstStepTask.status === 'loading'}
                  />
                </FormControl>
                <FormControl
                  label="Token"
                  caption="A Token provided by the manager of your team, which should have content deployment permissions."
                >
                  <Input
                    type="password"
                    size={INPUT_SIZE.compact}
                    value={recoverValue.token}
                    onChange={handleTokenChange}
                    disabled={firstStepTask.status === 'loading'}
                  />
                </FormControl>
              </RecativeBlock>
            )}

            <SpacedButton disabled>Previous</SpacedButton>
            <SpacedButton
              onClick={firstStepAction.execute}
              disabled={firstStepTask.status === 'loading'}
            >
              Next
            </SpacedButton>
          </Step>
          <Step title="Add Code Path">
            <FormControl
              label={<>Media Workspace Path</>}
              caption="All binaries and configuration files will be stored in this directory."
            >
              <FileInput
                directory
                isCompact
                onChange={setMediaWorkspacePath}
                initialValue={mediaWorkspacePath?.[0]}
              />
            </FormControl>

            <FormControl
              label="Code Repository Path"
              caption="The source code of the interaction program will be stored in this directory."
            >
              <FileInput
                directory
                isCompact
                onChange={setCodeRepositoryPath}
                initialValue={codeRepositoryPath?.[0]}
              />
            </FormControl>

            <SpacedButton onClick={previousStep}>Previous</SpacedButton>
            <SpacedButton onClick={nextStep}>Next</SpacedButton>
          </Step>
          <Step title="Select Backup">
            <Select<IStorage>
              options={storageList.result}
              labelKey="key"
              valueKey="key"
              placeholder="Choose a backup"
              maxDropdownHeight="300px"
              OptionLabel={getLabel}
              size={SELECT_SIZE.compact}
              value={selectedRelease}
              onChange={handleSelectChange}
            />
            <SpacedButton onClick={previousStep}>Previous</SpacedButton>
            <SpacedButton onClick={nextStep}>Next</SpacedButton>
          </Step>
          <Step title="Getting started">
            <ParagraphSmall>
              By clicking the start button, Recative Studio will download the
              database backup and all related resource to your hard disk. Please
              be aware that this process may take some time, so please be
              patient while the recovery is being completed.
            </ParagraphSmall>
            <SpacedButton
              disabled={gettingStarted.status === 'loading'}
              onClick={previousStep}
            >
              Previous
            </SpacedButton>
            <SpacedButton
              disabled={gettingStarted.status === 'loading'}
              onClick={gettingStartedAction.execute}
            >
              Start
            </SpacedButton>
          </Step>
        </ProgressSteps>
      </RecativeBlock>
    </GuideFormLayout>
  );
};
