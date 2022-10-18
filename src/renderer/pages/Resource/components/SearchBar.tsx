import * as React from 'react';
import { atom, useAtom } from 'jotai';

import { Search } from 'baseui/icon';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { RecativeBlock } from 'components/Block/RecativeBlock';

export const SEARCH_TERM_ATOM = atom('');

const INPUT_OVERRIDE = {
  Root: { style: { paddingRight: 0, borderRadius: 0 } },
};

export const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useAtom(SEARCH_TERM_ATOM);

  const handleSearchInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSearchTerm(event.target.value);
    },
    [setSearchTerm]
  );

  return (
    <RecativeBlock
      paddingTop="6px"
      paddingLeft="4px"
      paddingRight="4px"
      paddingBottom="4px"
    >
      <Input
        size={INPUT_SIZE.mini}
        endEnhancer={<Search size="18px" />}
        overrides={INPUT_OVERRIDE}
        placeholder="Search"
        value={searchTerm}
        onChange={handleSearchInputChange}
      />
    </RecativeBlock>
  );
};
