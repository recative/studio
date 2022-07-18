import * as React from 'react';

export const WaitIconOutline: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 23.25C5.797 23.25.75 18.203.75 12S5.797.75 12 .75 23.25 5.797 23.25 12 18.203 23.25 12 23.25Zm0-21c-5.376 0-9.75 4.374-9.75 9.75s4.374 9.75 9.75 9.75 9.75-4.374 9.75-9.75S17.376 2.25 12 2.25Z"
        fill="currentColor"
      />
      <path
        d="M16.687 17.438a.743.743 0 0 1-.53-.22L11.47 12.53a.74.74 0 0 1-.163-.245l-.009-.025a.737.737 0 0 1-.047-.26V8.25a.75.75 0 0 1 1.5 0v3.439l4.467 4.468a.744.744 0 0 1 0 1.06.752.752 0 0 1-.531.221Z"
        fill="currentColor"
      />
    </svg>
  );
};
