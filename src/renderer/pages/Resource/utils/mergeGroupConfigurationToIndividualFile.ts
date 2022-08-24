import type { IResourceFile } from '@recative/definitions';

import { editableResourceGroupProps } from '../ResourceEditor';

import type { IEditableResource } from '../ResourceEditor';

export const mergeGroupConfigurationToIndividualFile = <
  T extends IEditableResource | IResourceFile
>(
  file: T,
  group: IEditableResource
) => {
  editableResourceGroupProps.forEach((key) => {
    if (key === 'dirty') {
      return;
    }

    if (key === 'extensionConfigurations') {
      const configurationKeys = Object.keys(group[key]);

      configurationKeys.forEach((configurationKey) => {
        file[key][configurationKey] = group[key][configurationKey];
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (file[key] as any) = group[key];
    }
  });

  return file;
};
