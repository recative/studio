import * as React from 'react';

export const DtNullIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path
        fill="currentColor"
        d="M1.76 2.82.251 1.312a.752.752 0 0 1 0-1.061.752.752 0 0 1 1.061 0L21.72 20.659l.053.049a.874.874 0 0 1 .051.055l1.925 1.925a.752.752 0 0 1 0 1.061.752.752 0 0 1-1.061 0l-1.509-1.509a3.245 3.245 0 0 1-1.7.482H4.521a3.259 3.259 0 0 1-3.243-3.243V4.521c0-.623.176-1.206.482-1.701Zm18.301 18.302L2.878 3.939c-.065.182-.1.378-.1.582v14.958c0 .956.787 1.743 1.743 1.743h14.958c.2 0 .397-.035.582-.1ZM7.014 2.778a.75.75 0 0 1 0-1.5h12.465a3.259 3.259 0 0 1 3.243 3.243v12.465a.75.75 0 0 1-1.5 0V4.521c0-.956-.787-1.743-1.743-1.743H7.014Z"
      />
    </svg>
  ));
