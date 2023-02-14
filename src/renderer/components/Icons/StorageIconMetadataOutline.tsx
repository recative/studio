import * as React from 'react';

export const StorageIconMetadataOutline: React.FC<
  React.SVGProps<SVGSVGElement>
> = React.memo((props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      transform="translate(-4)"
      d="M19.786 14.018 14.2 17.74a.749.749 0 0 1-1.166-.623V9.67a.75.75 0 0 1 1.166-.624l5.585 3.723a.75.75 0 0 1 0 1.248Zm-1.768-.624-3.483-2.322v4.644l3.483-2.322Z"
    />
    <path
      fill="currentColor"
      fillRule="nonzero"
      transform="translate(-4)"
      d="M23.462 23.937c1.094 0 1.994-.9 1.994-1.994V5.775a.747.747 0 0 0-.22-.53L20.263.27a.747.747 0 0 0-.53-.22H8.537c-1.094 0-1.994.9-1.994 1.994v19.9c0 1.093.9 1.993 1.994 1.993h14.925Zm0-1.5H8.538a.498.498 0 0 1-.494-.494v-19.9c0-.27.223-.493.494-.493H19.42l4.536 4.536v15.857a.498.498 0 0 1-.494.494Z"
    />
  </svg>
));
