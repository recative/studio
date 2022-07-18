import * as React from 'react';

export const ResourceServerStartOutline: React.FC<
  React.SVGProps<SVGSVGElement>
> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle fill="currentColor" cx="5.25" cy="5.25" r="1.13" />
      <path
        fill="currentColor"
        d="M10.5 6a.75.75 0 0 1 0-1.5h6.75a.75.75 0 0 1 0 1.5Z"
      />
      <circle fill="currentColor" cx="5.25" cy="14.25" r="1.13" />
      <path
        fill="currentColor"
        d="M5.25 19.5a5.25 5.25 0 0 1-2.7-9.75A5.25 5.25 0 0 1 5.25 0h12a5.25 5.25 0 0 1 3.56 9.11.74.74 0 0 1-.51.2.75.75 0 0 1-.51-1.31 3.75 3.75 0 0 0-2.54-6.5h-12a3.75 3.75 0 0 0 0 7.5h6.69a.75.75 0 0 1 0 1.5H5.25a3.75 3.75 0 0 0 0 7.5h3a.75.75 0 0 1 0 1.5Z"
      />
      <path
        fill="currentColor"
        d="M15.25 23.52a2.13 2.13 0 0 1-1-.25 2.16 2.16 0 0 1-1.14-1.9v-8.24a2.15 2.15 0 0 1 3.35-1.79l6.13 4.13a2.14 2.14 0 0 1 0 3.56l-6.13 4.13a2.16 2.16 0 0 1-1.21.36Zm0-11a.76.76 0 0 0-.32.07.66.66 0 0 0-.34.58v8.24a.66.66 0 0 0 .34.58.65.65 0 0 0 .67 0l6.14-4.12a.66.66 0 0 0 0-1.08l-6.14-4.12a.57.57 0 0 0-.34-.19Z"
      />
    </svg>
  );
};
