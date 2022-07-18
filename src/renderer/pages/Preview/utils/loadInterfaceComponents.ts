/* eslint-disable global-require */
import createLoadRemoteModule, {
  createRequires,
} from '@paciolan/remote-module-loader';

const dependencies = {
  '@nanostores/react': require('@nanostores/react'),
  classnames: require('classnames'),
  nanostores: require('nanostores'),
  baseui: require('baseui'),
  'baseui/block': require('baseui/block'),
  'baseui/button': require('baseui/button'),
  'baseui/select': require('baseui/select'),
  'baseui/form-control': require('baseui/form-control'),
  'baseui/typography': require('baseui/typography'),
  react: require('react'),
  'react/jsx-runtime': require('react/jsx-runtime'),
  'react-dom': require('react-dom'),
  'react-use': require('react-use'),
  'react-slider': require('react-slider'),
  'use-constant': require('use-constant'),
  '@recative/act-player': require('@recative/act-player'),
  '@recative/act-protocol': require('@recative/act-protocol'),
  '@recative/core-manager': require('@recative/core-manager'),
  '@recative/definitions': require('@recative/definitions'),
  '@recative/smart-resource': require('@recative/smart-resource'),
};

export const loadInterfaceComponents = (baseUrl: string) => {
  const requires = createRequires(dependencies);
  const loadRemoteModule = createLoadRemoteModule({ requires });
  return loadRemoteModule(`${baseUrl}/interfaceComponents`);
};
