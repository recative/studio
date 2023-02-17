import * as React from 'react';

export const WindowsIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M1.5 12.25h20.756v-1.5H1.5v1.5Z" />
      <path fill="currentColor" d="M11.25 20.503v-17h-1.5v17h1.5Z" />
      <path
        fill="currentColor"
        d="M1.394 3.758A.749.749 0 0 0 .75 4.5v15c0 .373.274.69.644.742l21 3a.75.75 0 0 0 .856-.742v-21a.75.75 0 0 0-.856-.742l-21 3ZM2.25 5.15l19.5-2.785v19.27L2.25 18.85V5.15Z"
      />
    </svg>
  ));
