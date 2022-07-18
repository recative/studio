import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';

import { NewIcon } from 'components/Icons/NewIcon';

import { FileInput } from 'components/Input/FileInput';
import { CardHeader } from 'components/Layout/CardHeader';
import { RequiredMark } from 'components/Input/RequiredMark';
import { GuideFormLayout } from 'components/Layout/GuideFormLayout';

export const NewResource: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GuideFormLayout
      title={<CardHeader>New Resource Source</CardHeader>}
      footer={
        <>
          <Button
            startEnhancer={<NewIcon width={20} />}
            onClick={() => navigate('/resource', { replace: true })}
          >
            Create
          </Button>
        </>
      }
    >
      <FormControl
        label={
          <>
            Media Workspace Path
            <RequiredMark />
          </>
        }
        caption="All binaries and configuration files will be stored in this directory."
      >
        <FileInput directory onChange={console.log} />
      </FormControl>

      <FormControl
        label="Code Repository Path"
        caption="The source code of the interaction program will be stored in this directory."
      >
        <FileInput directory onChange={console.log} />
      </FormControl>
    </GuideFormLayout>
  );
};
