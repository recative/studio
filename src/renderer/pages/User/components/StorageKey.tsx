import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';
import { DatabaseIconCode } from 'components/Icons/DatabaseIconCode';
import { DatabaseIconMetadata } from 'components/Icons/DatabaseIconMetadata';

export interface IStorageKeyProps {
  key: string;
  id?: string;
  comment: string;
}

export const StorageKey: React.FC<IStorageKeyProps> = (props) => {
  const { key, id, comment } = props;

  const internalKey = key ?? id;

  if (!internalKey) {
    return <RecativeBlock>Invalid</RecativeBlock>;
  }

  const splitedKey = internalKey.split('/');

  if (internalKey.startsWith(`@`) && internalKey.endsWith('/db')) {
    const dateKey = Number.parseFloat(splitedKey[1]);

    return (
      <RecativeBlock display="flex" marginTop="8px">
        <DatabaseIconOutline width={16} />
        <RecativeBlock marginLeft="8px">
          <RecativeBlock lineHeight="1em" fontSize="0.6em" marginBottom="4px">
            {splitedKey[0]}
          </RecativeBlock>
          <RecativeBlock lineHeight="1em">
            {dateKey > 10000
              ? new Date(dateKey).toLocaleString()
              : `Release ${splitedKey[1]}`}
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
    );
  }

  if (
    internalKey.startsWith(`@`) &&
    internalKey.endsWith('/interfaceComponent')
  ) {
    return (
      <RecativeBlock display="flex" marginTop="8px">
        <DatabaseIconCode width={16} />
        <RecativeBlock marginLeft="8px">
          <RecativeBlock lineHeight="1em" fontSize="0.6em" marginBottom="4px">
            {splitedKey[0]}
          </RecativeBlock>
          <RecativeBlock lineHeight="1em">Interface Component</RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
    );
  }

  if (
    internalKey.startsWith(`@`) &&
    splitedKey.length === 3 &&
    (comment.startsWith('Client side metadata for ') ||
      comment.startsWith('Client side abstract for '))
  ) {
    const fileName = comment.replace('Client side metadata for ', '');

    return (
      <RecativeBlock display="flex" marginTop="8px">
        <DatabaseIconMetadata width={16} />
        <RecativeBlock marginLeft="8px">
          <RecativeBlock lineHeight="1em" fontSize="0.6em" marginBottom="4px">
            {splitedKey[0]}
          </RecativeBlock>
          <RecativeBlock lineHeight="1em">
            [{splitedKey[1]}]{' '}
            {fileName === 'undefined' ? splitedKey[2] : fileName}
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
    );
  }

  return <RecativeBlock>{internalKey}</RecativeBlock>;
};
