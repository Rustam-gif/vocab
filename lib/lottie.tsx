// Re-export real lottie-react-native for New Architecture
// Using real Lottie v7.3.4 with Fabric support
// @ts-ignore - Import from actual node_modules, not our alias
const LottieView = require('../../node_modules/lottie-react-native').default;

export type LottieViewHandle = {
  play?: () => void;
  reset?: () => void;
  pause?: () => void;
};

export default LottieView;
