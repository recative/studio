import * as React from 'react';

export const DtNumIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path
        fill="currentColor"
        d="M1.331 10.042a.752.752 0 0 1-1.061 0 .752.752 0 0 1 0-1.061l2.489-2.489a.75.75 0 0 1 1.28.531v9.954a.75.75 0 0 1-1.5 0V8.833l-1.208 1.209Zm6.936-2.269a.75.75 0 0 1 0-1.5H12c1.094 0 1.994.9 1.994 1.994v2.489c0 1.094-.9 1.994-1.994 1.994H9.511a.496.496 0 0 0-.494.494v2.489c0 .271.223.494.494.494h3.733a.75.75 0 0 1 0 1.5H9.511c-1.094 0-1.994-.9-1.994-1.994v-2.489c0-1.094.9-1.994 1.994-1.994H12a.496.496 0 0 0 .494-.494V8.267A.496.496 0 0 0 12 7.773H8.267ZM23.159 12c.487.476.79 1.139.79 1.867v1.244a2.629 2.629 0 0 1-2.616 2.616h-3.111a.75.75 0 0 1 0-1.5h3.111c.612 0 1.116-.504 1.116-1.116v-1.244c0-.613-.504-1.117-1.116-1.117h-1.867v-1.5h1.867c.612 0 1.116-.504 1.116-1.117V8.889c0-.612-.504-1.116-1.116-1.116h-3.111a.75.75 0 0 1 0-1.5h3.111a2.629 2.629 0 0 1 2.616 2.616v1.244c0 .728-.303 1.391-.79 1.867Z"
      />
    </svg>
  ));
