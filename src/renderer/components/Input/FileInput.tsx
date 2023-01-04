import * as React from 'react';
import type Electron from 'electron';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';

import { server } from 'utils/rpc';

import { OpenIcon } from 'components/Icons/OpenIcon';

interface IFileSelectProps {
  directory?: boolean;
  multiple?: boolean;
  initialValue?: string;
  isCompact?: boolean;
  kind?: typeof BUTTON_KIND[keyof typeof BUTTON_KIND];
  hideIcon?: boolean;
  hideInput?: boolean;
  onChange: (paths: string[]) => void;
  children?: React.ReactNode;
}

const bodyStyles: StyleObject = {
  display: 'flex',
};

const useButtonClickCallback = (
  multiple: boolean,
  directory: boolean,
  initialValue?: string,
  onChange?: IFileSelectProps['onChange']
) => {
  const [paths, setPaths] = React.useState<string[]>([]);
  const [displayPath, setDisplayPath] = React.useState<string>(
    initialValue || ''
  );

  const handleButtonClick = React.useCallback(async () => {
    const properties: Electron.OpenDialogOptions['properties'] = [];

    properties.push(directory ? 'openDirectory' : ('openFile' as const));
    if (multiple) {
      properties.push('multiSelections');
    }

    const result = await server.openFilePicker({
      properties,
    });

    if (result.canceled) return;
    setPaths(result.filePaths);
    setDisplayPath(result.filePaths.join(', '));
    onChange?.(result.filePaths);
  }, [multiple, directory, onChange]);

  return [paths, displayPath, handleButtonClick] as const;
};

export const FileInput: React.FC<IFileSelectProps> = ({
  kind = BUTTON_KIND.secondary,
  multiple = false,
  directory = false,
  isCompact,
  hideIcon,
  hideInput,
  onChange,
  initialValue,
  children,
}) => {
  const [css] = useStyletron();
  const [, displayPath, handleButtonClick] = useButtonClickCallback(
    multiple,
    directory,
    initialValue,
    onChange
  );

  return (
    <RecativeBlock className={css(bodyStyles)}>
      {!hideInput && (
        <Input
          value={displayPath}
          size={isCompact ? INPUT_SIZE.compact : undefined}
          disabled
        />
      )}
      <Button
        kind={kind}
        size={isCompact ? BUTTON_SIZE.compact : undefined}
        startEnhancer={hideIcon ? undefined : <OpenIcon width={20} />}
        onClick={handleButtonClick}
      >
        {children || 'Select'}
      </Button>
    </RecativeBlock>
  );
};
