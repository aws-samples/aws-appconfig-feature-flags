'use strict';
async function getFeature(name, features) {
  const feature=features[name];
  if (feature) {
    if (feature.enabled) {
      return true;
    }
  }
  if (!feature) {
  console.error(
    `There is no feature named "${name}"`,
  );
    return false;
  }
  return false;
}

module.exports = getFeature;
