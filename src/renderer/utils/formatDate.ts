import tinyDate from 'tinydate';

const YYYYMMDDFormatter = tinyDate('{YYYY}/{MM}/{DD}');

export const YYYYMMDD = (x: number) => YYYYMMDDFormatter(new Date(x));
