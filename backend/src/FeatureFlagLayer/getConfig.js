'use strict';
const fetch = require('node-fetch');

async function getConfig() {
  let appconfigPort = 2772;
  try {
    if (process.env.AWS_APPCONFIG_EXTENSION_HTTP_PORT) {
      appconfigPort = process.env.APPCONFIG_EXTENSION_HTTP_PORT;
    }
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
