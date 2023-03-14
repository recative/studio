import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';

import { Checkbox } from 'baseui/checkbox';
import { LabelSmall, LabelXSmall } from 'baseui/typography';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';

export type OnChange = (checked: boolean, id: string) => void;

export const useOnChangeCallback = (
  id: string,
  checked: boolean,
  onChange: OnChange
) => {
  const handleChange = useEvent(() => {
    onChange(!checked, id);
  });

  return handleChange;
};
interface IWrappedCheckbox {
  checked: boolean;
  title: string;
  id: string;
  onChange: OnChange;
}

const WrappedCheckbox: React.FC<IWrappedCheckbox> = ({
  checked,
  title,
  id,
  onChange,
}) => {
  const handleChange = useOnChangeCallback(id, checked, onChange);
  return <Checkbox title={title} checked={checked} onChange={handleChange} />;
};

export interface ITableCell {
  checked: boolean;
  id: string;
  onChange: (checked: boolean, id: string) => void;
}

const TableCell: React.FC<React.PropsWithChildren<ITableCell>> = ({
  checked,
  id,
  onChange,
  children,
}) => {
  const handleChange = useOnChangeCallback(id, checked, onChange);

  return (
    <RecativeBlock onClick={handleChange} cursor="pointer">
      <LabelXSmall whiteSpace="nowrap" paddingTop="4px" paddingBottom="4px">
        {children}
      </LabelXSmall>
    </RecativeBlock>
  );
};

const tableStyle = {
  top: '300px',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

const unitStyle = {
  paddingTop: '8px !important',
  paddingBottom: '8px !important',
  paddingLeft: '12px !important',
  paddingRight: '12px !important',
  display: 'flex',
  alignItems: 'center',
} as const;

const contentUnitStyle = {
  height: 'min-content',
  paddingTop: '6px !important',
  paddingBottom: '6px !important',
  paddingLeft: '12px !important',
  paddingRight: '12px !important',
  lineHeight: '1em',
  whiteSpace: 'nowrap',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
} as const;

export interface IProfileTable {
  profiles?: { id: string; label: string; extensionId: string }[];
  height?: string;
  value: string[];
  onChange: (x: string[]) => void;
}

export const useProfileChangeCallback = (
  candidates: string[],
  value: string[],
  onChange: (x: string[]) => void
) => {
  const candidateSet = React.useMemo(() => new Set(candidates), [candidates]);

  const handleSelectProfile = useEvent((checked: boolean, id: string) => {
    const result = value.filter((x) => candidateSet.has(x));

    if (checked) {
      return onChange([...result, id]);
    }

    return onChange(result.filter((x) => x !== id));
  });

  return handleSelectProfile;
};

export const ProfileTable: React.FC<IProfileTable> = React.memo(
  ({ profiles, height = '-webkit-fill-available', value, onChange }) => {
    const [css] = useStyletron();

    const heightStyle = React.useMemo(
      () => ({
        height,
      }),
      [height]
    );

    const profileIds = React.useMemo(
      () => profiles?.map((x) => x.id) ?? [],
      [profiles]
    );

    const gridTemplateRowStyles = React.useMemo(
      () =>
        css({
          gridTemplateRows: `repeat(${profiles?.length ?? 0 + 1}, min-content)`,
        }),
      [css, profiles?.length]
    );

    const handleSelectProfile = useProfileChangeCallback(
      profileIds,
      value,
      onChange
    );

    return (
      <RecativeBlock>
        <StyledTable
          role="grid"
          className={cn(
            css(tableStyle),
            css(heightStyle),
            gridTemplateRowStyles
          )}
          $gridTemplateColumns="max-content min-content auto"
          $gridTemplateRows="min-content"
        >
          <RecativeBlock id="checker" className={css(headerStyle)} role="row">
            <StyledHeadCell className={css(unitStyle)} $sticky></StyledHeadCell>
            <StyledHeadCell className={css(unitStyle)} $sticky>
              <LabelSmall>Profile</LabelSmall>
            </StyledHeadCell>
            <StyledHeadCell className={css(unitStyle)} $sticky>
              <LabelSmall>Extension #</LabelSmall>
            </StyledHeadCell>
          </RecativeBlock>

          {profiles?.filter(Boolean).map((profile) => (
            <RecativeBlock key={profile.id} display="contents" role="row">
              <StyledBodyCell className={css(contentUnitStyle)}>
                <RecativeBlock
                  transform="scale(0.75)"
                  data-profile-id={profile.id}
                >
                  <WrappedCheckbox
                    id={profile.id}
                    title={profile.label}
                    checked={value.includes(profile.id)}
                    onChange={handleSelectProfile}
                  />
                </RecativeBlock>
              </StyledBodyCell>
              <StyledBodyCell className={css(contentUnitStyle)}>
                <TableCell
                  id={profile.id}
                  checked={value.includes(profile.id)}
                  onChange={handleSelectProfile}
                >
                  {profile.label}
                </TableCell>
              </StyledBodyCell>
              <StyledBodyCell className={css(contentUnitStyle)}>
                <TableCell
                  id={profile.id}
                  checked={value.includes(profile.id)}
                  onChange={handleSelectProfile}
                >
                  {profile.extensionId}
                </TableCell>
              </StyledBodyCell>
            </RecativeBlock>
          ))}
        </StyledTable>
      </RecativeBlock>
    );
  }
);
