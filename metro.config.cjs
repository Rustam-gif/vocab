// Metro configuration for Expo
// Using CommonJS because package.json sets "type": "module",
// and Metro expects a CJS config. This also adds support for .riv assets.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes('riv')) {
  config.resolver.assetExts.push('riv');
}

// Force 'expo-asset' to resolve from project root to avoid nested path lookup
// like expo/node_modules/expo-asset/build/index.js on some setups.
config.resolver.extraNodeModules = Object.assign(
  {},
  config.resolver.extraNodeModules || {},
  {
    'expo-asset': path.resolve(__dirname, 'node_modules/expo-asset'),
  }
);

module.exports = config;
