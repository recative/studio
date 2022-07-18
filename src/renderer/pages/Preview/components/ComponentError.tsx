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
    <circle
      cx={12}
      cy={12}
      r={11.25}
      style={{
        fill: 'none',
        stroke: '#d32f2f',
        strokeWidth: '1.5px',
      }}
    />
    <path
      d="M6.75 8.25h3m-1.5 1.5v-3m6 1.5h3m-1.5 1.5v-3m-9 10.5c0-2.564 1.192-3.545 2.864-3.545 2.9 0 1.871 3.545 4.772 3.545 1.674 0 2.864-.982 2.864-3.545"
      style={{
        fill: 'none',
        fillRule: 'nonzero',
        stroke: '#d32f2f',
        strokeWidth: '1.5px',
      }}
    />
    <circle
      cx={12}
      cy={12}
      r={11.25}
      style={{
        fill: '#ef9a9a',
        stroke: '#d32f2f',
        strokeWidth: '1.5px',
      }}
    />
    <path
      d="M6.75 8.25h3m-1.5 1.5v-3m6 1.5h3m-1.5 1.5v-3m-9 10.5c0-2.564 1.192-3.545 2.864-3.545 2.9 0 1.871 3.545 4.772 3.545 1.674 0 2.864-.982 2.864-3.545"
      style={{
        fill: 'none',
        fillRule: 'nonzero',
        stroke: '#d32f2f',
        strokeWidth: '1.5px',
      }}
    />
  </svg>
);

export default SvgComponent;
