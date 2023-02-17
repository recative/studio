import * as React from 'react';

export const MigrateTagIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="m9.213.74-7.777 9.527a.749.749 0 0 0 .58 1.224h4.285C7 20.3 14.445 23.97 21.983 23.97a.75.75 0 0 0 .423-1.37S16.1 18.32 15.31 11.49h4.176a.75.75 0 0 0 .581-1.223L12.291.74a1.999 1.999 0 0 0-3.078 0Zm1.157.957a.498.498 0 0 1 .765 0l6.772 8.294h-3.411a.75.75 0 0 0-.749.788c.275 5.43 3.789 9.515 6.01 11.572-6.145-.66-11.725-4.146-12-11.638a.75.75 0 0 0-.749-.722h-3.41l6.772-8.294Z"
      />
    </svg>
  ));
