import * as React from 'react';

export const RawBundleOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.28 7s2.87-.23 4.08.57A3.54 3.54 0 0 0 20 8"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m13.28 7 .51-2.82A1 1 0 0 0 12.8 3H9.2a1 1 0 0 0-1 1.18L8.72 7ZM11 21a14.43 14.43 0 0 0 4.19-.57A4 4 0 0 0 18 16.61h0a6.87 6.87 0 0 0-.72-3l-3-6a1 1 0 0 0-.9-.55H8.62a1 1 0 0 0-.9.55l-3 6a6.87 6.87 0 0 0-.72 3h0a4 4 0 0 0 2.81 3.82A14.43 14.43 0 0 0 11 21Z"
        data-name="primary"
      />
    </svg>
  ));
