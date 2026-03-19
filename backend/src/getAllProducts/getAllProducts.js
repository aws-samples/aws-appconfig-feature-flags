'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const getConfig = require('/opt/nodejs/getConfig');
const getFeature = require('/opt/nodejs/getFeature');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.PRODUCT_TABLE;

async function getProducts() {
  const config = await getConfig();
  const flag = await getFeature('show_stock', config);
  let attributesToGet = '';
  if (flag) {
    attributesToGet = ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage', 'itemStock'];
  } else {
    attributesToGet = ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage'];
  }
  const params = {
    TableName: tableName,
    AttributesToGet: attributesToGet,
  };
  const data = await docClient.send(new ScanCommand(params));
  return data;
}

exports.handler = async(event) => {
  const data = await getProducts();

  const response = {
    statusCode: 200,
    body: JSON.stringify(data.Items),
  };

  return response;
};
