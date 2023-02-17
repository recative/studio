import * as React from 'react';
import useConstant from 'use-constant';

import { useStyletron } from 'baseui';

import { StarTrailManager } from './utils/StarTrailManager';

export interface StarTrailProps {
  className: string;
}

export const StarTrail: React.FC = React.memo(() => {
  const [, theme] = useStyletron();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const manager = useConstant(() => {
    const result = new StarTrailManager(theme.colors.primary50);

    return result;
  });

  React.useEffect(() => {
    if (canvasRef.current) {
      manager.setupCanvas(canvasRef.current);
      manager.play();
    }

    return manager.stop;
  }, [manager]);

  return <canvas width="100%" height="100%" ref={canvasRef} />;
});
