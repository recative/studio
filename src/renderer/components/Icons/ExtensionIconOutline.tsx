import * as React from 'react';

export const ExtensionIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path
        fill="currentColor"
        d="M2.222 4.972H5.89a.307.307 0 0 0 .305-.305V3.444A3.377 3.377 0 0 1 9.556.084a3.377 3.377 0 0 1 3.36 3.36v1.223c0 .167.139.305.306.305h3.667a2.15 2.15 0 0 1 2.139 2.14v3.666c0 .167.138.305.305.305h1.223a3.377 3.377 0 0 1 3.36 3.361 3.377 3.377 0 0 1-3.36 3.362h-1.223a.307.307 0 0 0-.305.305v3.667a2.15 2.15 0 0 1-2.14 2.139h-3.666a2.15 2.15 0 0 1-2.139-2.14v-1.221c0-.839-.689-1.528-1.527-1.528-.839 0-1.528.69-1.528 1.528v1.222a2.15 2.15 0 0 1-2.14 2.139H2.223a2.15 2.15 0 0 1-2.139-2.14v-3.666a2.15 2.15 0 0 1 2.14-2.139h1.221c.839 0 1.528-.69 1.528-1.528 0-.838-.69-1.527-1.528-1.527H2.222a2.15 2.15 0 0 1-2.139-2.14V7.112a2.15 2.15 0 0 1 2.14-2.139Zm0 1.834a.307.307 0 0 0-.305.305v3.667c0 .167.138.305.305.305h1.222a3.377 3.377 0 0 1 3.362 3.361 3.377 3.377 0 0 1-3.362 3.362H2.222a.307.307 0 0 0-.305.305v3.667c0 .167.138.305.305.305H5.89a.307.307 0 0 0 .305-.305v-1.222a3.377 3.377 0 0 1 3.362-3.362 3.377 3.377 0 0 1 3.36 3.362v1.222c0 .167.139.305.306.305h3.667a.307.307 0 0 0 .305-.305V18.11a2.15 2.15 0 0 1 2.14-2.139h1.222c.838 0 1.527-.69 1.527-1.528 0-.838-.689-1.527-1.527-1.527h-1.223a2.15 2.15 0 0 1-2.139-2.14V7.112a.307.307 0 0 0-.305-.305h-3.667a2.15 2.15 0 0 1-2.139-2.14V3.445c0-.838-.689-1.527-1.527-1.527-.839 0-1.528.689-1.528 1.527v1.223a2.15 2.15 0 0 1-2.14 2.139H2.223Z"
      />
    </svg>
  ));
