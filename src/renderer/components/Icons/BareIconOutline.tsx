import * as React from 'react';

export const BareIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M15.772 3.708 3.663 15.749A3.263 3.263 0 0 0 .05 18.975c0 .851.335 1.668.932 2.275l.005.005c.303.304.665.541 1.061.7.158.395.396.756.7 1.06l.005.004a3.249 3.249 0 0 0 2.277.931 3.263 3.263 0 0 0 3.234-3.563L20.372 8.348a3.263 3.263 0 0 0 3.613-3.226c0-.851-.335-1.669-.932-2.276l-.004-.004a3.176 3.176 0 0 0-1.062-.701 3.146 3.146 0 0 0-.7-1.059l-.005-.005a3.25 3.25 0 0 0-2.277-.93 3.263 3.263 0 0 0-3.249 3.246l.016.315Zm1.33.792a.746.746 0 0 0 .201-.705 1.76 1.76 0 0 1-.047-.402c0-.958.79-1.746 1.749-1.746.458 0 .897.179 1.224.498.213.214.364.481.438.773a.748.748 0 0 0 .545.545c.293.074.561.225.774.438.32.326.499.764.499 1.221a1.756 1.756 0 0 1-2.181 1.692.75.75 0 0 0-.713.195L6.933 19.596a.75.75 0 0 0-.201.705A1.756 1.756 0 0 1 5.03 22.45a1.75 1.75 0 0 1-1.224-.499 1.66 1.66 0 0 1-.437-.773.753.753 0 0 0-.546-.545 1.668 1.668 0 0 1-.774-.437 1.744 1.744 0 0 1-.499-1.221 1.756 1.756 0 0 1 2.181-1.693.75.75 0 0 0 .714-.195L17.102 4.5Z"
      />
    </svg>
  ));
