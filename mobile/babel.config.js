module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin removed — requires react-native-worklets
    // which conflicts with Expo SDK 54. Reanimated transitions in this app
    // use Animated (core RN) not worklet-based APIs, so no plugin needed.
    plugins: [],
  };
};
