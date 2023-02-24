import * as React from 'react';

export const DtBoolIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path d="M7.266 11.129a.75.75 0 1 1 1.061-1.061L12 13.742l10.68-10.68a.75.75 0 0 1 1.06 1.061l-11.21 11.21a.749.749 0 0 1-1.06 0l-4.204-4.204ZM22.46 12a.75.75 0 0 1 1.5 0v8.407a3.57 3.57 0 0 1-3.553 3.553H3.593A3.57 3.57 0 0 1 .04 20.407V3.593A3.57 3.57 0 0 1 3.593.04h12.611a.75.75 0 0 1 0 1.5H3.593A2.063 2.063 0 0 0 1.54 3.593v16.814c0 1.126.927 2.053 2.053 2.053h16.814a2.063 2.063 0 0 0 2.053-2.053V12Z" />
    </svg>
  ));
