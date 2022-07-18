import * as React from 'react';

const SvgComponent: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }}
    {...props}
  >
    <path
      d="M16.629 23.25a1.5 1.5 0 0 0 1.06-.439l5.122-5.122a1.5 1.5 0 0 0 .439-1.06V2.25c0-.823-.677-1.5-1.5-1.5H7.371a1.5 1.5 0 0 0-1.06.439L1.189 6.311a1.5 1.5 0 0 0-.439 1.06V21.75c0 .823.677 1.5 1.5 1.5h14.379Z"
      style={{
        fill: '#ffcc80',
        fillRule: 'nonzero',
        stroke: '#f57c00',
        strokeWidth: '1.5px',
      }}
    />
    <path
      d="M17.25 23.115V6.75m-10.5 10.5h16.365M1.189 22.811 6.75 17.25m10.5-10.5 5.561-5.561M17.25 6.75H.885M6.75.885V17.25"
      style={{
        fill: 'none',
        fillRule: 'nonzero',
        stroke: '#f57c00',
        strokeWidth: '1.5px',
      }}
    />
  </svg>
);

export default SvgComponent;
