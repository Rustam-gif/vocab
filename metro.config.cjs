// Custom Metro config to ensure metro-runtime resolves to Expo's runtime.
// This avoids ENOENT lookups like react-native/node_modules/metro-runtime.
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'metro-runtime': require.resolve('@expo/metro-runtime'),
};

module.exports = config;

