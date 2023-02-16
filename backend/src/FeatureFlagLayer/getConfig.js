'use strict';
const fetch = require('node-fetch');

async function getConfig() {
  const appconfigPort = process.env.AWS_APPCONFIG_EXTENSION_HTTP_PORT || 2772;
  try {
    const url = `http://localhost:${appconfigPort}`
              + `/applications/${process.env.APPCONFIG_APPLICATION}`
              + `/environments/${process.env.APPCONFIG_ENVIRONMENT}`
              + `/configurations/${process.env.APPCONFIG_CONFIGURATION}`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = getConfig;
