import * as React from 'react';

export const FileIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M4.502.1H15.75a.75.75 0 0 1 .532.22l5 4.978a.75.75 0 0 1 .22.53v16.177a2.01 2.01 0 0 1-2.003 1.996H4.502a2.01 2.01 0 0 1-2.004-1.996V2.096A2.01 2.01 0 0 1 4.502.101Zm0 1.5a.5.5 0 0 0-.498.496v19.91a.5.5 0 0 0 .498.494H19.5a.5.5 0 0 0 .498-.495V6.14L15.439 1.6H4.502Z"
      />
      <path
        fill="currentColor"
        d="M16.426 17.06H7.574a.75.75 0 0 0 0 1.5h8.852a.75.75 0 0 0 0-1.5ZM7.574 14.627h8.852a.75.75 0 0 0 0-1.5H7.574a.75.75 0 0 0 0 1.5ZM7.574 10.694h8.852a.75.75 0 0 0 0-1.5H7.574a.75.75 0 0 0 0 1.5Z"
      />
    </svg>
  ));
