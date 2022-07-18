import * as React from 'react';

export const MobileAppOutline: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M8.25 24a3.754 3.754 0 0 1-3.75-3.75V6.75a3.743 3.743 0 0 1 3-3.673V.75a.75.75 0 0 1 1.5 0V3h6.75a3.754 3.754 0 0 1 3.75 3.75v13.5A3.754 3.754 0 0 1 15.75 24h-7.5zM6 20.25a2.252 2.252 0 0 0 2.25 2.25h7.5A2.252 2.252 0 0 0 18 20.25V13.5H6v6.75zM18 12V6.75a2.252 2.252 0 0 0-2.25-2.25h-7.5A2.252 2.252 0 0 0 6 6.75V12h12z"
    />
    <circle fill="currentColor" cx={10.125} cy={15.75} r={1.125} />
    <circle fill="currentColor" cx={14.25} cy={15.75} r={1.125} />
    <circle fill="currentColor" cx={10.125} cy={19.5} r={1.125} />
    <circle fill="currentColor" cx={14.25} cy={19.5} r={1.125} />
  </svg>
);
