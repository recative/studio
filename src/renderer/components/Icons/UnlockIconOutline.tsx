import * as React from 'react';

export const UnlockIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        d="M36 18H12c-1.097 0-2 .903-2 2v20c0 1.097.903 2 2 2h24c1.097 0 2-.903 2-2V20c0-1.097-.903-2-2-2Z"
        style={{
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 3,
        }}
      />
      <path
        d="M27 29c0 1.646-1.354 3-3 3s-3-1.354-3-3 1.354-3 3-3 3 1.354 3 3Z"
        style={{
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 3,
        }}
      />
      <path
        d="M31.924 22.94v-8.479c0-4.652-3.612-8.479-8-8.479-4.389 0-8 3.827-8 8.479v3.179"
        style={{
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 3,
        }}
        transform="matrix(1 0 0 .94351 .076 -3.644)"
      />
      <path
        d="M24 32v2-2Z"
        style={{
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 3,
        }}
      />
    </svg>
  ));
