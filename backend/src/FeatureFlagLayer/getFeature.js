'use strict';
async function getFeature(name, features) {
  let featureArray = [];
  featureArray.push(features);
  const feature=featureArray[0][name];
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
