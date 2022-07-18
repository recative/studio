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
      d="M8.5.75V4.5a9.767 9.767 0 0 0-6 9c0 5.349 4.401 9.75 9.75 9.75S22 18.849 22 13.5a9.767 9.767 0 0 0-6-9V.75"
      style={{
        fill: '#b39ddb',
        fillRule: 'nonzero',
        stroke: '#512da8',
        strokeWidth: '1.5px',
      }}
    />
    <path
      d="M6.25.75h12M7 15.75h7.5m-3.75-3v3m3-7.5v4.5h3.75v3M10.75 9h-3v3M10 18.75h5.25"
      style={{
        fill: 'none',
        fillRule: 'nonzero',
        stroke: '#512da8',
        strokeWidth: '1.5px',
      }}
    />
  </svg>
);

export default SvgComponent;
