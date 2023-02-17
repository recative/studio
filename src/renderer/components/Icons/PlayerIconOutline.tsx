import * as React from 'react';

export const PlayerIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M8.348 24.003a.746.746 0 0 1-.687-.447.747.747 0 0 1-.013-.574 8.823 8.823 0 0 0 .601-3.276c0-1.444-.323-2.261-.698-3.207-.395-.998-.802-2.028-.802-3.75a.75.75 0 0 1 1.5 0c0 1.435.323 2.252.697 3.197.395.998.803 2.03.803 3.754a10.31 10.31 0 0 1-.703 3.824.743.743 0 0 1-.698.479zm8.921-.005a.752.752 0 0 1-.688-1.05 7.94 7.94 0 0 0 .668-3.248c0-1.439-.323-2.256-.697-3.201-.395-.999-.803-2.029-.803-3.751a.75.75 0 0 1 1.5 0c0 1.436.323 2.253.698 3.198.395.997.802 2.027.802 3.749a9.43 9.43 0 0 1-.793 3.852.748.748 0 0 1-.687.451zM12.816 24a.75.75 0 0 1-.695-1.031 8.582 8.582 0 0 0 .629-3.27c0-1.438-.323-2.254-.697-3.199-.395-.998-.803-2.029-.803-3.751a.75.75 0 0 1 1.5 0c0 1.436.323 2.253.698 3.198.395.997.802 2.027.802 3.749a10.074 10.074 0 0 1-.739 3.835.746.746 0 0 1-.695.469zm7.382-12.694c-.312 0-.613-.093-.872-.269l-.993-.663a3.294 3.294 0 0 0-3.668 0 4.795 4.795 0 0 1-5.332 0 3.294 3.294 0 0 0-3.668-.001l-1 .667a1.56 1.56 0 0 1-.872.264 1.541 1.541 0 0 1-1.096-.461 1.539 1.539 0 0 1-.447-1.099C2.25 4.373 6.624 0 12 0s9.75 4.373 9.75 9.749a1.551 1.551 0 0 1-1.552 1.557zm-3.699-2.99c.95 0 1.872.28 2.666.81l1 .667c.014.009.024.013.035.013.01 0 .029-.003.041-.021a.046.046 0 0 0 .008-.028C20.25 5.201 16.549 1.5 12 1.5S3.75 5.201 3.75 9.75c0 .031.022.055.05.055a.05.05 0 0 0 .029-.009l1.004-.67a4.793 4.793 0 0 1 5.332.001 3.301 3.301 0 0 0 3.668 0 4.78 4.78 0 0 1 2.666-.811z"
      />
      <path
        fill="currentColor"
        d="M7.316 6.75a.755.755 0 0 1-.469-.165.743.743 0 0 1-.276-.503.745.745 0 0 1 .16-.551 6.794 6.794 0 0 1 2.736-2.04.748.748 0 0 1 .973.987.742.742 0 0 1-.409.403 5.279 5.279 0 0 0-2.13 1.588.744.744 0 0 1-.585.281z"
      />
    </svg>
  ));
