import * as React from 'react';
import { SVGProps } from 'react';

export const EmptyIconOutline = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M2 0C.903 0 0 .903 0 2v20c0 1.097.903 2 2 2h20c1.097 0 2-.903 2-2V2c0-1.097-.903-2-2-2H2Zm0 1.5h20c.274 0 .5.226.5.5v20c0 .274-.226.5-.5.5H2a.502.502 0 0 1-.5-.5V2c0-.274.226-.5.5-.5Zm3.75 16.25h12.5a.75.75 0 0 0 0-1.5H5.75a.75.75 0 0 0 0 1.5Zm0-5h10a.75.75 0 0 0 0-1.5h-10a.75.75 0 0 0 0 1.5Zm0-5h12.5a.75.75 0 0 0 0-1.5H5.75a.75.75 0 0 0 0 1.5Z"
    />
  </svg>
);
