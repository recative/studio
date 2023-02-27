import * as React from 'react';

import { Card } from 'baseui/card';
import { LabelXSmall } from 'baseui/typography';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import {
  ComparisonEditor,
  ICompareTypedData,
} from 'components/ComparisonEditor/ComparisonEditor';
import { useEvent } from 'utils/hooks/useEvent';
import { IconButton } from 'components/Button/IconButton';
import { Button, KIND as BUTTON_KIND, KIND, SIZE } from 'baseui/button';
import { CloseIconOutline } from 'components/Icons/CloseIconOutline';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { nanoid } from 'nanoid';

export interface ISwitchUnit {
  id: string;
  operator: string;
  type: string;
  value: string;
}

export interface ISwitchEditorUnitProps {
  value: ISwitchUnit;
  onChange: (x: ISwitchUnit) => void;
  onRemove: (x: ISwitchUnit) => void;
}

const SwitchEditorUnit: React.FC<ISwitchEditorUnitProps> = React.memo(
  ({ value, onChange, onRemove }) => {
    const handleIdChange = useEvent(
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({ ...value, id: event.target.value });
      }
    );

    const handleEditorChange = useEvent((event: ICompareTypedData) => {
      onChange({ ...value, ...event });
    });

    const handleRemove = useEvent(() => {
      onRemove(value);
    });

    return (
      <RecativeBlock
        marginTop="8px"
        marginBottom="8px"
        marginLeft="8px"
        marginRight="8px"
      >
        <Card overrides={{ Contents: { style: { marginTop: 0 } } }}>
          <RecativeBlock
            textAlign="right"
            marginRight="-16px"
            marginBottom="-18px"
          >
            <IconButton
              kind={BUTTON_KIND.tertiary}
              startEnhancer={<CloseIconOutline width={12} />}
              onClick={handleRemove}
            />
          </RecativeBlock>
          <RecativeBlock>
            <LabelXSmall>
              <RecativeBlock fontWeight="bold" marginBottom="4px">
                Id
              </RecativeBlock>
            </LabelXSmall>
            <Input
              value={value.id}
              size={INPUT_SIZE.mini}
              onChange={handleIdChange}
            />
          </RecativeBlock>

          <RecativeBlock marginTop="12px" paddingBottom="12px">
            <LabelXSmall>
              <RecativeBlock fontWeight="bold" marginBottom="4px">
                Value
              </RecativeBlock>
            </LabelXSmall>
            <ComparisonEditor value={value} onChange={handleEditorChange} />
          </RecativeBlock>
        </Card>
      </RecativeBlock>
    );
  }
);

const DEFAULT_ITEM = {
  operator: 'strongEq',
  type: 'string',
  value: '',
};

export const SwitchEditor: React.FC = () => {
  const [value, setValue] = React.useState<ISwitchUnit[]>([]);

  const handleValueChange = React.useMemo(
    () =>
      value.map((_, index) => (v: ISwitchUnit) => {
        setValue((o) => {
          o[index] = { ...o[index], ...v };

          return [...o];
        });
      }),
    [value]
  );

  const handleAdd = useEvent(() => {
    setValue((x) => [...x, { id: nanoid(), ...DEFAULT_ITEM }]);
  });

  const handleRemove = useEvent((e) => {
    setValue((x) => x.filter((a) => a !== e));
  });

  return (
    <RecativeBlock>
      {value.map((x, index) => (
        <SwitchEditorUnit
          key={index}
          value={x}
          onChange={handleValueChange[index]}
          onRemove={handleRemove}
        />
      ))}
      <RecativeBlock textAlign="right" paddingRight="8px">
        <Button
          startEnhancer={<AddIconOutline width={12} />}
          kind={KIND.secondary}
          size={SIZE.mini}
          onClick={handleAdd}
        >
          Add Condition
        </Button>
      </RecativeBlock>
    </RecativeBlock>
  );
};
