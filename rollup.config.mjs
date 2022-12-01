/* eslint-disable import/no-extraneous-dependencies */

import json from '@rollup/plugin-json';
import sucrase from '@rollup/plugin-sucrase';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import internal from 'rollup-plugin-internal';

import packageJson from './package.json' assert { type: 'json' };

export default [
  {
    input: 'src/main/main.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      external({
        includeDependencies: true,
      }),
      json(),
      resolve({
        extensions: [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.json',
          '.node',
          '.mjs',
          '.cjs',
        ],
        modulesOnly: true,
        moduleDirectories: ['node_modules', 'packages'],
      }),
      commonjs({
        defaultIsModuleExports: 'auto',
      }),
      internal.default([
        '@recative/definitions',
        '@recative/extension-sdk',
        '@recative/studio-definitions',
        'electron-devtools-installer',
      ]),
      sucrase({
        exclude: ['node_modules/**'],
        transforms: ['jsx', 'typescript'],
      }),
    ],
    external: ['electron'],
  },
];
