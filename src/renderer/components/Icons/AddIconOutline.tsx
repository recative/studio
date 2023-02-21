import * as React from 'react';

export const AddIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => {
    return (
      <svg viewBox="0 0 24 24" {...props}>
        <path
          fill="currentColor"
          d="M12,24c-0.414,0-0.75-0.336-0.75-0.75v-10.5H0.75C0.336,12.75,0,12.414,0,12s0.336-0.75,0.75-0.75h10.5V0.75 C11.25,0.336,11.586,0,12,0s0.75,0.336,0.75,0.75v10.5h10.5c0.414,0,0.75,0.336,0.75,0.75s-0.336,0.75-0.75,0.75h-10.5v10.5 C12.75,23.664,12.414,24,12,24z"
        />
      </svg>
    );
  });
