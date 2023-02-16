import { StyleObject } from 'styletron-standard';

export const floatDownAnimationStyle: StyleObject = {
  animationDuration: '300ms',
  animationFillMode: 'forwards',
  animationName: {
    from: {
      opacity: 0,
      transform: 'translateY(5%)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  } as unknown as string,
};
