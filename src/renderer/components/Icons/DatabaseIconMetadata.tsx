import * as React from 'react';
import { SVGProps } from 'react';

export const DatabaseIconMetadata = React.memo(
  (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M14.976 1.481H1.981c-.274 0-.5.226-.5.5v19.993c0 .274.226.499.5.499h6.248a.75.75 0 0 1 0 1.5H1.981c-1.097 0-2-.902-2-1.999V1.981c0-1.097.903-2 2-2h13.745a.75.75 0 0 1 .53.22L18.755 2.7a.75.75 0 0 1 .22.53v9.997a.75.75 0 0 1-1.5 0V3.98h-1.749a.75.75 0 0 1-.75-.75V1.481ZM5.729 13.977a.75.75 0 0 1 0-1.5h7.498a.75.75 0 0 1 0 1.5H5.729Zm0-4.998a.75.75 0 0 1 0-1.5h7.498a.75.75 0 0 1 0 1.5H5.729Zm15.766 11.844-4 3a.75.75 0 0 1-1.2-.6v-6a.75.75 0 0 1 1.2-.6l4 3a.753.753 0 0 1 0 1.2Zm-1.7-.6-2-1.5v3l2-1.5Z"
      />
    </svg>
  )
);
