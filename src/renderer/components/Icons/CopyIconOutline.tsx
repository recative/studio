import * as React from 'react';

export const CopyIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path d="M5.65 18.35H3.6A3.568 3.568 0 0 1 .05 14.8V3.6A3.568 3.568 0 0 1 3.6.05h11.2a3.568 3.568 0 0 1 3.55 3.55v2.05h2.05a3.568 3.568 0 0 1 3.55 3.55v11.2a3.568 3.568 0 0 1-3.55 3.55H9.2a3.568 3.568 0 0 1-3.55-3.55v-2.05Zm11.2-12.7V3.6a2.06 2.06 0 0 0-2.05-2.05H3.6A2.06 2.06 0 0 0 1.55 3.6v11.2a2.06 2.06 0 0 0 2.05 2.05h2.05V9.2A3.568 3.568 0 0 1 9.2 5.65h7.65ZM7.15 9.2v11.2a2.06 2.06 0 0 0 2.05 2.05h11.2a2.06 2.06 0 0 0 2.05-2.05V9.2a2.06 2.06 0 0 0-2.05-2.05H9.2A2.06 2.06 0 0 0 7.15 9.2Z" />
    </svg>
  ));
