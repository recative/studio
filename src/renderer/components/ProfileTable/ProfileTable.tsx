import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';

import { Checkbox } from 'baseui/checkbox';
import { LabelSmall, LabelXSmall } from 'baseui/typography';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { useEvent } from 'utils/hooks/useEvent';

interface IWrappedCheckbox {
  checked: boolean;
  title: string;
  id: string;
  onChange: (checked: boolean, id: string) => void;
}

const WrappedCheckbox: React.FC<IWrappedCheckbox> = ({
  checked,
  title,
  id,
  onChange,
}) => {
  const handleChange = useEvent(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.checked, id);
    }
  );
  return <Checkbox title={title} checked={checked} onChange={handleChange} />;
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

export const ProfileTable: React.FC<IProfileTable> = React.memo(
  ({ profiles, height = '-webkit-fill-available', value, onChange }) => {
    const [css] = useStyletron();

    const heightStyle = React.useMemo(
      () => ({
        height,
      }),
      [height]
    );

    const profileIds = React.useMemo(() => {
      const result = new Set<string>();

      profiles?.forEach(({ id }) => result.add(id));

      return result;
    }, [profiles]);

    const gridTemplateRowStyles = React.useMemo(
      () =>
        css({
          gridTemplateRows: `repeat(${profiles?.length ?? 0 + 1}, min-content)`,
        }),
      [css, profiles?.length]
    );

    const handleSelectProfile = useEvent((checked: boolean, id: string) => {
      const result = value.filter((x) => profileIds.has(x));

      if (checked) {
        return onChange([...result, id]);
      }

      return onChange(result.filter((x) => x !== id));
    });

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
                <LabelXSmall whiteSpace="nowrap" paddingTop="4px">
                  {profile.label}
                </LabelXSmall>
              </StyledBodyCell>
              <StyledBodyCell className={css(contentUnitStyle)}>
                <LabelXSmall whiteSpace="nowrap" paddingTop="4px">
                  {profile.extensionId}
                </LabelXSmall>
              </StyledBodyCell>
            </RecativeBlock>
          ))}
        </StyledTable>
      </RecativeBlock>
    );
  }
);
