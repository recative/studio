import * as React from 'react';

import debug from 'debug';
import { useAsync } from '@react-hookz/web';

import {
  LoadingLayer,
  Stage,
  Subtitle,
  Dialog,
  PanicLayer,
  Controller,
} from '@recative/act-player';

import { loadInterfaceComponents } from '../utils/loadInterfaceComponents';

const log = debug('renderer:use-interface-components');

export const useInterfaceComponents = (baseUrl: string | null) => {
  const loadComponents = React.useCallback(async () => {
    if (!baseUrl) return null;
    const defaultComponents = [
      LoadingLayer,
      Stage,
      Subtitle,
      Dialog,
      Controller({}),
      PanicLayer,
    ];

    try {
      const interfaceComponents = await loadInterfaceComponents(baseUrl);
      if (
        'default' in interfaceComponents &&
        interfaceComponents.default instanceof Array
      ) {
        log('Got imported components');
        return interfaceComponents.default;
      }
      log(
        '`default` not in `interfaceComponent`, would not use imported components',
        interfaceComponents
      );
      return defaultComponents;
    } catch (e) {
      log('something wrong happens, would not use imported components', e);
      return defaultComponents;
    }
  }, [baseUrl]);

  const [components, componentActions] = useAsync(loadComponents, []);

  return {
    interfaceComponents: components.result,
    fetchInterfaceComponents: componentActions.execute,
  };
};
