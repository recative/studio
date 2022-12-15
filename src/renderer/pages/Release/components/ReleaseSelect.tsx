import * as React from 'react';

import { ISimpleRelease } from '@recative/definitions';

import { SIZE } from 'baseui/select';
import { LabelSmall, LabelXSmall } from 'baseui/typography';

import { Select } from 'components/Select/Select';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import type { GetOptionLabel, GetValueLabel } from 'components/Select/Select';

import { useEvent } from 'utils/hooks/useEvent';
import { useAsync } from '@react-hookz/web';
import { server } from 'utils/rpc';

export const useSearchRelease = (type: 'media' | 'code') => {
  const [state, actions] = useAsync(async (query: string) => {
    return server.searchRelease(query, type);
  });

  const handleInputChange = useEvent(
    (event?: React.FormEvent<HTMLInputElement>) => {
      actions.execute(event?.currentTarget.value || '');
    }
  );

  React.useEffect(() => {
    actions.execute('');
  }, []);

  const queryResult = state.result || [];
  const loading = state.status === 'loading';

  return [queryResult, loading, handleInputChange] as const;
};

interface IReleaseSelectProps {
  disabled?: boolean;
  value?: ISimpleRelease;
  placeholder?: string;
  type: 'code' | 'media';
  size?: typeof SIZE[keyof typeof SIZE];
  onChange?: (x: ISimpleRelease) => void;
}

const getValueLabel: GetValueLabel<ISimpleRelease> = ({ option }) => {
  return (
    <RecativeBlock display="flex" transform="translateY(1px)">
      <LabelSmall color="contentTertiary" marginRight="6px">
        #{option?.id}
      </LabelSmall>
      <LabelSmall>{option?.notes}</LabelSmall>
    </RecativeBlock>
  );
};

const getOptionLabel: GetOptionLabel<ISimpleRelease> = ({ option }) => {
  return (
    <RecativeBlock>
      <LabelXSmall color="contentTertiary">#{option?.id}</LabelXSmall>
      <LabelSmall>
        <b>{option?.notes}</b>
      </LabelSmall>
    </RecativeBlock>
  );
};

const InternalReleaseSelect: React.FC<IReleaseSelectProps> = ({
  disabled,
  value,
  placeholder,
  type,
  size,
  onChange,
}) => {
  const selectedRelease = React.useMemo(() => (value ? [value] : []), [value]);
  const handleChange = useEvent((x: { value: readonly ISimpleRelease[] }) =>
    onChange?.(x.value[0])
  );

  const [options, loading, handleInputChange] = useSearchRelease(type);

  return (
    <Select<ISimpleRelease>
      size={size}
      disabled={disabled}
      options={options}
      value={selectedRelease}
      placeholder={placeholder}
      isLoading={loading}
      OptionLabel={getOptionLabel}
      ValueLabel={getValueLabel}
      onChange={handleChange}
      onInputChange={handleInputChange}
    />
  );
};

export const ReleaseSelect = React.memo(InternalReleaseSelect);
