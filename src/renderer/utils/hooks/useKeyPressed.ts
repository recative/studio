import * as React from 'react';

import { useKeyboardEvent } from '@react-hookz/web';

export const useKeyPressed = (key: string) => {
  const [pressed, setPressed] = React.useState(false);

  useKeyboardEvent(
    key,
    (ev) => {
      if (ev.key !== key) return;

      setPressed(true);
    },
    [],
    { eventOptions: { passive: true } }
  );

  useKeyboardEvent(
    key,
    (ev) => {
      if (ev.key !== key) return;

      setPressed(false);
    },
    [],
    { event: 'keyup', eventOptions: { passive: true } }
  );

  return pressed;
};
