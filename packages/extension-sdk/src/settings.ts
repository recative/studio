export interface ISetting {
  readonly key: string;
  value: string;
}

export interface IConfigUiStringField {
  id: string;
  type: 'string';
  label: string;
}

export interface IConfigUiBooleanField {
  id: string;
  type: 'boolean';
  title: string;
  label: string;
}

export interface IConfigUiGroupedBooleanField {
  id: string;
  type: 'groupedBoolean';
  label: string;
  ids: string[];
  labels: string[];
}

export type IConfigUiField =
  | IConfigUiStringField
  | IConfigUiBooleanField
  | IConfigUiGroupedBooleanField;
