import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';
import { StorageIconCodeOutline } from 'components/Icons/StorageIconCodeOutline';
import { StorageIconMetadataOutline } from 'components/Icons/StorageIconMetadataOutline';

import { parseStorageKey, StorageType } from '../utils/parseStorageKey';

export interface IStorageKeyProps {
  storageKey?: string;
  id?: string;
  comment?: string;
}

interface IComplexRowProps {
  title: string;
  value: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const ComplexRow: React.FC<IComplexRowProps> = ({ title, value, Icon }) => {
  return (
    <RecativeBlock display="flex" marginTop="8px">
      <Icon width={16} />
      <RecativeBlock marginLeft="8px">
        <RecativeBlock lineHeight="1em" fontSize="0.6em" marginBottom="4px">
          {title}
        </RecativeBlock>
        <RecativeBlock lineHeight="1em">{value}</RecativeBlock>
      </RecativeBlock>
    </RecativeBlock>
  );
};

const InternalStorageKey: React.FC<IStorageKeyProps> = (props) => {
  const { storageKey: key, id, comment } = props;

  const parsedKey = React.useMemo(
    () => parseStorageKey(key ?? id, comment),
    [key, id, comment]
  );

  if (parsedKey.type === StorageType.Invalid) {
    return <RecativeBlock>Invalid</RecativeBlock>;
  }

  if (parsedKey.type === StorageType.Database) {
    return (
      <ComplexRow
        Icon={DatabaseIconOutline}
        title={parsedKey.seriesId}
        value={parsedKey.title}
      />
    );
  }

  if (parsedKey.type === StorageType.Code) {
    return (
      <ComplexRow
        Icon={StorageIconCodeOutline}
        title={parsedKey.seriesId}
        value={parsedKey.title}
      />
    );
  }

  if (parsedKey.type === StorageType.Metadata) {
    return (
      <ComplexRow
        Icon={StorageIconMetadataOutline}
        title={parsedKey.seriesId}
        value={`${parsedKey.title}`}
      />
    );
  }

  return <RecativeBlock>{parsedKey.title}</RecativeBlock>;
};

export const StorageKey = React.memo(InternalStorageKey);
