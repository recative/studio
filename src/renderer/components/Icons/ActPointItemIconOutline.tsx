import * as React from 'react';

export const ActPointItemIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  (props) => {
    return (
      <svg viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M19.5 15c-.827 0-1.5-.673-1.5-1.5v-3h-3c-.827 0-1.5-.673-1.5-1.5V1.5C13.5.673 14.173 0 15 0h3c.827 0 1.5.673 1.5 1.5v3h3C23.327 4.5 24 5.173 24 6v7.5c0 .827-.673 1.5-1.5 1.5H19.5zM15 9h3c.827 0 1.5.673 1.5 1.5v3h3V6h-3C18.673 6 18 5.327 18 4.5v-3h-3V9zM1.5 24C.673 24 0 23.327 0 22.5v-12C0 9.673.673 9 1.5 9h3C5.327 9 6 9.673 6 10.5v3h7.5c.827 0 1.5.673 1.5 1.5v3h3c.827 0 1.5.673 1.5 1.5v3c0 .827-.673 1.5-1.5 1.5H1.5zM18 22.5v-3h-3c-.827 0-1.5-.673-1.5-1.5v-3H6v3h3c.827 0 1.5.673 1.5 1.5v3H18zM1.5 22.5H9v-3H6c-.827 0-1.5-.673-1.5-1.5v-7.5h-3V22.5z"
        />
      </svg>
    );
  };
