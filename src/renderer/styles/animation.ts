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

export const floatUpAnimationStyle: StyleObject = {
  animationDuration: '300ms',
  animationFillMode: 'forwards',
  animationName: {
    from: {
      opacity: 0,
      transform: 'translateY(-5%)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  } as unknown as string,
};

export const floatLeftAnimationStyle: StyleObject = {
  animationDuration: '300ms',
  animationFillMode: 'forwards',
  animationName: {
    from: {
      opacity: 0,
      transform: 'translateX(-5%)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  } as unknown as string,
};

export const floatRightAnimationStyle: StyleObject = {
  animationDuration: '300ms',
  animationFillMode: 'forwards',
  animationName: {
    from: {
      opacity: 0,
      transform: 'translateX(5%)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  } as unknown as string,
};

export const blinkAnimationStyle: StyleObject = {
  animationDuration: '2000ms',
  animationIterationCount: 'infinite',
  animationName: {
    '0%': {
      opacity: 0,
    },
    '20%': {
      opacity: 0,
    },
    '80%': {
      opacity: 1,
    },
    '100%': {
      opacity: 1,
    },
  } as unknown as string,
};
