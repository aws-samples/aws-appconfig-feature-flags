import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: false,
  },
  resolve: {
    alias: {
      '/opt/nodejs/getConfig': path.resolve(__dirname, 'src/FeatureFlagLayer/getConfig.js'),
      '/opt/nodejs/getFeature': path.resolve(__dirname, 'src/FeatureFlagLayer/getFeature.js'),
    },
  },
});
