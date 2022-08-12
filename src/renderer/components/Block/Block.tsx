/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import type * as CSS from 'csstype';
import cn from 'classnames';

import { useStyletron } from 'styletron-react';

import type { Properties } from 'styletron-standard';

export interface IBlockProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'translate'>,
    CSS.Properties<string | number> {}

const HTML_KEYS = [
  'defaultChecked',
  'defaultValue',
  'suppressContentEditableWarning',
  'suppressHydrationWarning',
  'accessKey',
  'className',
  'contentEditable',
  'contextMenu',
  'dir',
  'draggable',
  'hidden',
  'id',
  'lang',
  'placeholder',
  'slot',
  'spellCheck',
  'style',
  'tabIndex',
  'title',
  'translate',
  'radioGroup',
  'role',
  'about',
  'datatype',
  'inlist',
  'prefix',
  'property',
  'resource',
  'typeof',
  'vocab',
  'autoCapitalize',
  'autoCorrect',
  'autoSave',
  'color',
  'itemProp',
  'itemScope',
  'itemType',
  'itemID',
  'itemRef',
  'results',
  'security',
  'unselectable',
  'inputMode',
  'is',
  'children',
] as const;

const InternalBlock: React.ForwardRefRenderFunction<
  HTMLDivElement,
  React.PropsWithChildren<IBlockProps>
> = (props) => {
  const [css] = useStyletron();

  const [{ className, ...divProps }, styleProps] = React.useMemo(() => {
    const a: Partial<React.HTMLAttributes<HTMLDivElement>> = {};
    const b: Partial<Properties> = {};

    Object.keys(props).forEach((key) => {
      if (!HTML_KEYS.includes(key as any)) {
        (b as any)[key] = (props as any)[key];
      } else {
        (a as any)[key] = (props as any)[key];
      }
    });

    return [a, b];
  }, [props]);

  const style = React.useMemo(() => css(styleProps), [css, styleProps]);

  return <div {...divProps} className={cn(style, className)} />;
};

export const RecativeBlock = React.memo(
  React.forwardRef<HTMLDivElement, IBlockProps>(InternalBlock)
);
