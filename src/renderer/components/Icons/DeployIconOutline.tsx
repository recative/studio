import * as React from 'react';

export const DeployIconOutline: React.FC<React.SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd" {...props}>
      <path
        fill="currentColor"
        d="M3.845 21.446H1.956A1.965 1.965 0 0 1 0 19.49V6.935c0-1.021.798-1.869 1.799-1.95L4.072.439a.701.701 0 0 1 .627-.387h6.872a.7.7 0 0 1 .626.387l2.27 4.54h.044c1.073 0 1.956.883 1.956 1.956v1.811h3.641a1.952 1.952 0 0 1 1.64.877l1.92 2.885.001.003c.213.317.328.69.331 1.073v7.162a.7.7 0 0 1-.7.7h-.633a3.232 3.232 0 0 1-3.134 2.511c-1.521 0-2.81-1.082-3.133-2.511h-6.289c-.323 1.429-1.612 2.511-3.133 2.511a3.231 3.231 0 0 1-3.133-2.511ZM22.6 19.798v-6.205a.559.559 0 0 0-.094-.304l-.002-.003-1.921-2.888-.002-.002a.555.555 0 0 0-.467-.25H16.467v9.652a3.23 3.23 0 0 1 3.066-2.263 3.23 3.23 0 0 1 3.067 2.263Zm-17.433.948a1.82 1.82 0 0 0 1.811 1.811 1.82 1.82 0 0 0 1.811-1.811 1.82 1.82 0 0 0-1.811-1.811c-.994 0-1.811.817-1.811 1.811Zm5.971-19.294H5.131L3.368 4.979h9.534l-1.764-3.527Zm3.373 4.927H1.956a.559.559 0 0 0-.556.556V19.49c0 .305.251.556.556.556h1.889a3.23 3.23 0 0 1 3.133-2.511 3.23 3.23 0 0 1 3.133 2.511h4.956V6.935a.559.559 0 0 0-.556-.556Zm3.211 14.367a1.82 1.82 0 0 0 1.811 1.811 1.82 1.82 0 0 0 1.811-1.811c0-.994-.817-1.811-1.811-1.811a1.82 1.82 0 0 0-1.811 1.811Z"
      />
    </svg>
  ));
