import * as React from 'react';
import download from 'downloadjs';

import { HeadingXXLarge } from 'baseui/typography';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';

import { FileInput } from 'components/Input/FileInput';
import { PivotLayout } from 'components/Layout/PivotLayout';
import { RequiredMark } from 'components/Input/RequiredMark';
import { ContentContainer } from 'components/Layout/ContentContainer';

import { useReleaseData } from 'pages/Release/Release';

import { server } from 'utils/rpc';

export const MergeResourceDatabase: React.FC = () => {
  const { fetchReleaseData } = useReleaseData();
  const [fileAPath, setFileAPath] = React.useState(['']);
  const [fileBPath, setFileBPath] = React.useState(['']);
  const [merging, setMerging] = React.useState(false);

  React.useEffect(() => {
    fetchReleaseData();
  }, [fetchReleaseData]);

  const handleMerge = React.useCallback(async () => {
    setMerging(true);
    const result = await server.mergeResourceListFile(
      fileAPath[0],
      fileBPath[0]
    );
    setMerging(false);
    download(JSON.stringify(result), 'merged-resources.json');
  }, [fileAPath, fileBPath]);

  return (
    <PivotLayout>
      <ContentContainer width={1000} padding={48}>
        <HeadingXXLarge>Merge Resource Database</HeadingXXLarge>
        <FormControl
          label={
            <>
              File A
              <RequiredMark />
            </>
          }
        >
          <FileInput
            directory={false}
            onChange={setFileAPath}
            initialValue={fileAPath?.[0]}
          />
        </FormControl>
        <FormControl
          label={
            <>
              File B
              <RequiredMark />
            </>
          }
        >
          <FileInput
            directory={false}
            onChange={setFileBPath}
            initialValue={fileBPath?.[0]}
          />
        </FormControl>
        <RecativeBlock
          marginTop="48px"
          display="flex"
          justifyContent="flex-end"
        >
          <Button disabled={merging} onClick={handleMerge}>
            Merge
          </Button>
        </RecativeBlock>
      </ContentContainer>
    </PivotLayout>
  );
};
