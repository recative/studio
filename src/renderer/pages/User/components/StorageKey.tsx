import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';

export interface IStorageKeyProps {
  key: string;
}

export const StorageKey: React.FC<IStorageKeyProps> = ({ key }) => {
  if (!key) {
    return <RecativeBlock>Invalid</RecativeBlock>;
  }

  if (key.startsWith(`@`) && key.endsWith('/db')) {
    const splitedKey = key.split('/');
    const dateKey = Number.parseFloat(splitedKey[1]);
    const date = new Date(dateKey);

    return (
      <RecativeBlock display="flex" marginTop="8px">
        <DatabaseIconOutline width={16} />
        <RecativeBlock marginLeft="8px">
          <RecativeBlock lineHeight="1em" fontSize="0.6em" marginBottom="4px">
            {splitedKey[0]}
          </RecativeBlock>
          <RecativeBlock lineHeight="1em">
            {date.toLocaleString()}
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
    );
  }

  return <RecativeBlock>{key}</RecativeBlock>;
};
