// metro.config.cjs
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
      'riv',
      'lottie',
    ],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    extraNodeModules: {
      'expo-router': path.resolve(__dirname, 'lib/router'),
      'react-native-sound': path.resolve(__dirname, 'lib/rnsound'),
      'lottie-react-native': path.resolve(__dirname, 'lib/lottie-proxy'),
      '@react-navigation/native': path.resolve(__dirname, 'lib/reactNavigation'),
      'react-native-haptic-feedback': path.resolve(__dirname, 'lib/haptics'),
    },
  },
});
