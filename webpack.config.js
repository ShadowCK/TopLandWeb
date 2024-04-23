import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import webpack from 'webpack';

// Note: Cannot use __dirname and __filename in Node.js's ES module,
const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = dirname(__filename);

const config = JSON.parse(fs.readFileSync(resolve(__dirname, './package.json')));
const { version } = config;

export default (env, argv) => {
  const mode = argv.mode || 'development';
  return {
    entry: './src/main.js',
    mode,
    watchOptions: {
      aggregateTimeout: 200,
    },
    output: {
      path: resolve(__dirname, 'dist'),
      filename: 'bundle.js',
    },
    plugins: [
      new webpack.DefinePlugin({
        WEBPACK_MODE: JSON.stringify(mode === 'production' ? 'production' : 'development'),
        VERSION: JSON.stringify(version),
      }),
    ],
  };
};
