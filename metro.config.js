const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['import', 'require', 'default'];

// Don't watch the Python AI backend — it has a .venv with thousands of files
// that slow Metro's file scanner and trigger spurious rebuilds.
config.resolver.blockList = [
  /services\/ai-service\/.*/,
];
config.watchFolders = [__dirname];

module.exports = config;
