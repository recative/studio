import { PostProcessedResourceItemForUpload } from '@recative/extension-sdk';

export const analysisPostProcessedRecords = (
  resourceProcessed: PostProcessedResourceItemForUpload[]
) => {
  const postProcessCombination = new Map<string, number>();

  resourceProcessed.forEach((x) => {
    const key = x.postProcessRecord.operations
      .map((operation) => {
        const splited = operation.extensionId.split('/');
        const shorten = splited[splited.length - 1];

        return shorten;
      })
      .sort()
      .join(', ');

    const previousValue = postProcessCombination.get(key) ?? 0;

    postProcessCombination.set(key, previousValue + 1);
  });

  return postProcessCombination;
};
