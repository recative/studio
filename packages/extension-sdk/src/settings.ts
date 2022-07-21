export interface ISetting {
  readonly key: string;
  value: string;
}

export interface IConfigUiStringField {
  id: string;
  type: 'string';
  label: string;
  required?: boolean;
}

export interface IConfigUiBooleanField {
  id: string;
  type: 'boolean';
  title: string;
  label: string;
  required?: boolean;
}

export interface IConfigUiGroupedBooleanField {
  id: string;
  type: 'groupedBoolean';
  label: string;
  ids: string[];
  labels: string[];
  required?: boolean;
}

export type IConfigUiField =
  | IConfigUiStringField
  | IConfigUiBooleanField
  | IConfigUiGroupedBooleanField;
