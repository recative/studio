const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const { CracoAliasPlugin } = require('react-app-alias');

module.exports = {
  webpack: {
    alias: {
      components: path.resolve(__dirname, 'src/renderer/components'),
      pages: path.resolve(__dirname, 'src/renderer/pages'),
      resources: path.resolve(__dirname, 'src/renderer/resources'),
      stores: path.resolve(__dirname, 'src/renderer/stores'),
      styles: path.resolve(__dirname, 'src/renderer/styles'),
      utils: path.resolve(__dirname, 'src/renderer/utils'),
    },
    configure: (x) => {
      if (!('resolve' in x)) {
        Reflect.set(x, 'resolve', {});
      }

      if (!('fallback' in x.resolve)) {
        Reflect.set(x.resolve, 'fallback', {});
      }

      Reflect.set(x.resolve.fallback, 'fs', false);
      Reflect.set(x.resolve.fallback, 'path', false);
      Reflect.set(x.resolve.fallback, 'http', false);
      Reflect.set(x.resolve.fallback, 'https', false);

      if (!Array.isArray(x.ignoreWarnings)) {
        Reflect.set(x, 'ignoreWarnings', []);
        x.ignoreWarnings.push(/Failed to parse source map/);
      }

      x.module.rules[1].oneOf.push({
        test: /\.(js|mjs|jsx|ts|tsx)$/, // Regex for matching file endings
        include: path.resolve(__dirname, 'packages'), // Joined path to your custom library
        loader: require.resolve('babel-loader'), // Default resolver for js(x)/ts(x) files
        options: {
          customize: require.resolve(
            'babel-preset-react-app/webpack-overrides',
          ),
          presets: [
            [
              require.resolve('babel-preset-react-app'),
              {
                runtime: 'automatic',
              },
            ],
          ],
        },
      });

      return x;
    },
  },
  plugins: [
    {
      plugin: CracoAliasPlugin,
      options: {},
    },
  ],
};
