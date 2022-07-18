export interface IEditStringOperation {
  operationId: string;
  field: string;
  value: string;
  isJson: boolean;
}

export interface IEditBooleanOperation {
  operationId: string;
  field: string;
  value: boolean;
}

export interface IEditNumberOperation {
  operationId: string;
  field: string;
  value: number;
}

export interface IEditArrayOperation {
  operationId: string;
  field: string;
  seekFor: 'eq' | 'contains' | 'startsWith' | 'endsWith';
  where: string;
  operation: 'add' | 'remove' | 'edit';
  value: string;
  isJson: boolean;
}

export interface IEditRecordOperation {
  operationId: string;
  field: string;
  seekFor: 'keyEq' | 'valEq' | 'valContains' | 'valStartsWith' | 'valEndsWith';
  where: string;
  operation: 'add' | 'remove' | 'edit';
  key: string;
  value: string;
  isJson: boolean;
}

export type IEditOperation =
  | IEditStringOperation
  | IEditArrayOperation
  | IEditBooleanOperation
  | IEditNumberOperation
  | IEditRecordOperation;
