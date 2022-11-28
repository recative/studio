/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';

import { __dirname } from '../utils/path.mjs';

import manifest from '../../src/package.json' assert { type: 'json' };

const externals = manifest.dependencies;

export default {
  externals: [...Object.keys(externals || {})].filter(
    (x) => !x.startsWith('@recative')
  ),

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules(?!\/@recative)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },

  output: {
    path: path.join(__dirname, '../../src'),
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [
      path.join(__dirname, '../../src'),
      path.join(__dirname, '../../src/renderer'),
      path.join(__dirname, '../../main'),
      'node_modules',
    ],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      FLUENTFFMPEG_COV: '',
    }),
  ],
};
