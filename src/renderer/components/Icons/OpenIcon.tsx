import * as React from 'react';

export const OpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M23.44 9.549A1.492 1.492 0 0022.28 9H10.42a.5.5 0 01-.491-.4L9.651 7.205A1.5 1.5 0 008.18 6H1.72A1.5 1.5 0 00.249 7.8l2.6 13A1.5 1.5 0 004.32 22H20.281a1.5 1.5 0 001.47-1.2l2-10h0A1.5 1.5 0 0023.44 9.549zM3.22 5A1 1 0 004.2 4.222.263.263 0 014.443 4H19.72a.5.5 0 01.5.5V7a1 1 0 002 0V4a2 2 0 00-2-2h-16a2 2 0 00-2 2A1 1 0 003.22 5z"
      />
    </svg>
  );
};
