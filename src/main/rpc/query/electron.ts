import { dialog } from 'electron';

import type Electron from 'electron';

export const openFilePicker = (options: Electron.OpenDialogOptions) => {
  return dialog.showOpenDialog(options);
};
