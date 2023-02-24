/* eslint-disable eqeqeq */
export interface ComparisonOperator {
  id: string;
  label: string;
  fn: (a: any, b: any) => boolean;
}

export const comparisonOperators: ComparisonOperator[] = [
  {
    id: 'weakEq',
    label: 'Weak Equal',
    fn: (a, b) => a == b,
  },
  {
    id: 'weakNeq',
    label: 'Weak Not Equal',
    fn: (a, b) => a != b,
  },
  {
    id: 'strongEq',
    label: 'Strong Equal',
    fn: (a, b) => a === b,
  },
  {
    id: 'strongNeq',
    label: 'Strong Not Equal',
    fn: (a, b) => a !== b,
  },
  {
    id: 'gt',
    label: 'Greater',
    fn: (a, b) => a > b,
  },
  {
    id: 'lt',
    label: 'Less',
    fn: (a, b) => a < b,
  },
  {
    id: 'gtEq',
    label: 'Greater or Equal',
    fn: (a, b) => a >= b,
  },
  {
    id: 'ltEq',
    label: 'Less or Equal',
    fn: (a, b) => a <= b,
  },
];
