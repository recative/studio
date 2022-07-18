// eslint-disable-next-line @typescript-eslint/ban-types -- Using `object` here is reasonable.
export type WritableKeys<T extends object | null> = T extends null
  ? never
  : {
      [P in keyof T]-?: IfEquals<
        { [Q in P]: T[P] },
        { readonly [Q in P]: T[P] },
        never,
        P
      >;
    }[keyof T];

export type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X
  ? 1
  : 2) extends <T>() => T extends Y ? 1 : 2
  ? A
  : B;
