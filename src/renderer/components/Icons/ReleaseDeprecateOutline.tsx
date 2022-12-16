import * as React from 'react';
import { SVGProps } from 'react';

export const ReleaseDeprecateOutline: React.FC<SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      stroke="currentColor"
      d="M7.942 20.376a2.238 2.238 0 0 1-1.591-.658L.972 14.34a2.254 2.254 0 0 1-.007-3.175L11.472.658c.425-.425.99-.659 1.59-.659h5.379a2.252 2.252 0 0 1 2.25 2.25v5.379c0 .601-.234 1.166-.659 1.59a.748.748 0 0 1-1.28-.53c0-.2.078-.389.22-.53a.754.754 0 0 0 .219-.53V2.249a.75.75 0 0 0-.75-.75h-5.378a.748.748 0 0 0-.531.219L2.038 12.213a.744.744 0 0 0-.224.536c0 .201.078.389.219.531l5.379 5.378a.744.744 0 0 0 .53.219.744.744 0 0 0 .53-.219.744.744 0 0 1 1.06 0 .744.744 0 0 1 0 1.06 2.229 2.229 0 0 1-1.59.658z"
    />
    <circle stroke="currentColor" cx={16.192} cy={4.499} r={1.125} />
    <path
      stroke="currentColor"
      d="M16.942 23.999c-3.722 0-6.75-3.028-6.75-6.75s3.028-6.75 6.75-6.75 6.75 3.028 6.75 6.75-3.028 6.75-6.75 6.75zm0-12c-2.895 0-5.25 2.355-5.25 5.25s2.355 5.25 5.25 5.25 5.25-2.355 5.25-5.25-2.356-5.25-5.25-5.25z"
    />
    <path
      stroke="currentColor"
      d="M19.192 20.248a.743.743 0 0 1-.53-.22l-1.72-1.72-1.72 1.72a.744.744 0 0 1-1.06 0 .752.752 0 0 1 0-1.061l1.72-1.72-1.72-1.72a.752.752 0 0 1 .53-1.281c.2 0 .389.078.53.22l1.72 1.72 1.72-1.72a.744.744 0 0 1 1.06 0 .752.752 0 0 1 0 1.061l-1.72 1.72 1.72 1.72a.752.752 0 0 1-.53 1.281z"
    />
  </svg>
);
