import * as React from 'react';
import { SVGProps } from 'react';

export const CloseIconOutline = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M23.25 23.999a.743.743 0 0 1-.53-.22L12 13.06 1.28 23.779a.744.744 0 0 1-1.06 0 .752.752 0 0 1 0-1.061l10.72-10.72L.22 1.279C.078 1.138 0 .949 0 .749S.078.36.22.219c.141-.142.33-.22.53-.22s.389.078.53.22L12 10.938 22.72.218a.744.744 0 0 1 1.06 0 .747.747 0 0 1 0 1.061l-10.72 10.72 10.72 10.72a.752.752 0 0 1 0 1.061.746.746 0 0 1-.53.219z"
    />
  </svg>
);
