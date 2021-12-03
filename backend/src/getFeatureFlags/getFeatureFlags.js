'use strict';
const getConfig = require('/opt/nodejs/getConfig');

exports.handler = async(event) => {
  const config = await getConfig();
  const response = {
    statusCode: 200,
    body: JSON.stringify(config),
  };
  return response;
};
