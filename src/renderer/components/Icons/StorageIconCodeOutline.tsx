import * as React from 'react';

export const StorageIconCodeOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        transform="translate(-4)"
        d="M19.315 16.637a.75.75 0 1 1-1.061-1.061l2.254-2.254-2.254-2.254a.75.75 0 1 1 1.061-1.061l2.784 2.785a.749.749 0 0 1 0 1.06l-2.784 2.785Zm-6.63-6.63a.75.75 0 1 1 1.061 1.061l-2.254 2.254 2.254 2.254a.75.75 0 1 1-1.061 1.061l-2.784-2.785a.749.749 0 0 1 0-1.06l2.784-2.785Z"
      />
      <path
        fill="currentColor"
        fillRule="nonzero"
        transform="translate(-4)"
        d="M23.462 23.937c1.094 0 1.994-.9 1.994-1.994V5.775a.747.747 0 0 0-.22-.53L20.263.27a.747.747 0 0 0-.53-.22H8.537c-1.094 0-1.994.9-1.994 1.994v19.9c0 1.093.9 1.993 1.994 1.993h14.925Zm0-1.5H8.538a.498.498 0 0 1-.494-.494v-19.9c0-.27.223-.493.494-.493H19.42l4.536 4.536v15.857a.498.498 0 0 1-.494.494Z"
      />
    </svg>
  ));
