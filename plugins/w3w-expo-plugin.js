/* eslint-disable ts/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod, withPlugins } = require('@expo/config-plugins');

const SRC_ZIP = path.resolve(__dirname, '../w3w/w3w-data.zip');

function withW3wAndroid(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const assetsDir = path.join(config.modRequest.projectRoot, 'android/app/src/main/assets');
      const targetZip = path.join(assetsDir, 'w3w-data.zip');

      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      if (fs.existsSync(SRC_ZIP)) {
        fs.copyFileSync(SRC_ZIP, targetZip);
        console.log(`[w3w-expo-plugin] Injected Android asset: ${targetZip}`);
      }
      else {
        console.warn(`[w3w-expo-plugin] w3w-data.zip not found at ${SRC_ZIP}`);
      }

      return config;
    },
  ]);
}

function withW3wIos(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosDir = path.join(config.modRequest.projectRoot, 'ios/MalibuSAR');
      const targetZip = path.join(iosDir, 'w3w-data.zip');

      if (!fs.existsSync(iosDir)) {
        fs.mkdirSync(iosDir, { recursive: true });
      }

      if (fs.existsSync(SRC_ZIP)) {
        fs.copyFileSync(SRC_ZIP, targetZip);
        console.log(`[w3w-expo-plugin] Injected iOS bundle resource: ${targetZip}`);
      }
      else {
        console.warn(`[w3w-expo-plugin] w3w-data.zip not found at ${SRC_ZIP}`);
      }

      return config;
    },
  ]);
}

function withW3wPlugin(config) {
  return withPlugins(config, [withW3wAndroid, withW3wIos]);
}

module.exports = withW3wPlugin;
