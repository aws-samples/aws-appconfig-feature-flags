// Simple debug test to see what's happening
const { handler } = require('./dist/getAllProducts/getAllProducts.js');

const mockEvent = {
  httpMethod: 'GET',
  path: '/products',
  headers: {},
  queryStringParameters: null,
  requestContext: {
    requestId: 'test-request-id',
  },
  body: null,
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
  pathParameters: null,
  resource: '',
  stageVariables: null,
};

// Set environment variables
process.env.PRODUCT_TABLE = 'test-table';
process.env.AWS_REGION = 'us-east-1';

handler(mockEvent).then(result => {
  console.log('Result:', JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Error:', error);
});