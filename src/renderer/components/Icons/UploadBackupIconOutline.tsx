import * as React from 'react';
import { SVGProps } from 'react';

export const UploadBackupIconOutline: React.FC<SVGProps<SVGSVGElement>> =
  React.memo((props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M16.956 14.305a.751.751 0 0 1 0-1.501h1.249l.057.001c2.319 0 4.227-1.908 4.227-4.227a4.242 4.242 0 0 0-4.192-4.227h-.008a3.45 3.45 0 0 0-1.021.122l-.505.14-.305-.426A5.474 5.474 0 0 0 12.009 1.9a5.488 5.488 0 0 0-5.398 4.585l-.151.918-.865-.342a2.997 2.997 0 0 0-4.084 2.786 2.99 2.99 0 0 0 1.881 2.772c.357.127.734.19 1.118.185h2.493a.752.752 0 0 1 0 1.501H4.518a4.688 4.688 0 0 1-1.663-.286l-.01-.004a4.489 4.489 0 0 1-2.511-5.84c.8-2.007 2.926-3.124 4.981-2.747C6.169 2.493 8.891.4 12.009.4a6.98 6.98 0 0 1 5.362 2.516c.315-.052.635-.074.956-.064a5.743 5.743 0 0 1 5.591 4.824c.047.298.071.6.071.902 0 3.142-2.585 5.727-5.727 5.727h-1.306Zm-4.206 1.06v7.485a.75.75 0 0 1-1.5 0v-7.485l-2.49 2.49a.749.749 0 1 1-1.06-1.06l4.3-4.301 4.3 4.301a.749.749 0 1 1-1.06 1.06l-2.49-2.49Z"
      />
    </svg>
  ));
