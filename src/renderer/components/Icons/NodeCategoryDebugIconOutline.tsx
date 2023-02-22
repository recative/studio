import * as React from 'react';

export const NodeCategoryDebugIconOutline: React.FC<
  React.SVGProps<SVGSVGElement>
> = React.memo((props) => {
  return (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path
        fill="currentColor"
        d="M.111 20.485a.75.75 0 0 0 .644 1.136h22.49a.749.749 0 0 0 .644-1.136L12.644 1.743a.75.75 0 0 0-1.287 0L.11 20.485Zm1.968-.364L12 3.587l9.92 16.534H2.08Z"
      />
    </svg>
  );
});
