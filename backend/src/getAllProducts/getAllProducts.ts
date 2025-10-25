import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { getConfig } from '../FeatureFlagLayer/getConfig';
import { getFeature } from '../FeatureFlagLayer/getFeature';
import { FeatureFlagConfig, AppConfigError, FeatureFlagError } from '../FeatureFlagLayer/types';
import { ErrorHandler } from '../shared/errorHandler';
import { Product, LambdaHandler } from './types';

const logger = new Logger({ serviceName: 'getAllProducts' });

// Initialize DynamoDB client with SDK v3
const dynamoClient = new DynamoDBClient({
  region: process.env['AWS_REGION'] || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function getProducts(): Promise<Product[]> {
  try {
    const tableName = process.env['PRODUCT_TABLE'];
    if (!tableName) {
      throw new Error('PRODUCT_TABLE environment variable is not set');
    }

    logger.info('Retrieving feature flags configuration');
    const config: FeatureFlagConfig = await getConfig();

    logger.info('Evaluating show_stock feature flag');
    const showStockFlag = await getFeature('show_stock', config);

    // Determine which attributes to retrieve based on feature flag
    const attributesToGet: string[] = showStockFlag 
      ? ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage', 'itemStock']
      : ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage'];

    logger.info('Scanning DynamoDB table', {
      tableName,
      attributesToGet,
      showStock: Boolean(showStockFlag),
    });

    const scanCommand = new ScanCommand({
      TableName: tableName,
      ProjectionExpression: attributesToGet.join(', '),
    });

    const data = await docClient.send(scanCommand);

    logger.info('Successfully retrieved products from DynamoDB', {
      itemCount: data.Items?.length || 0,
      scannedCount: data.ScannedCount || 0,
    });

    return (data.Items as Product[]) || [];

  } catch (error) {
    logger.error('Error retrieving products', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof AppConfigError || error instanceof FeatureFlagError) {
      throw error;
    }

    throw new Error(`Failed to retrieve products: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const handler: LambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const correlationId = event.requestContext.requestId;
  
  logger.addPersistentLogAttributes({
    httpMethod: event.httpMethod,
    path: event.path,
  });

  logger.info('Processing get all products request', {
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    const products = await getProducts();

    logger.info('Successfully processed products request', {
      productCount: products.length,
    });

    const response = ErrorHandler.createSuccessResponse(products, correlationId);

    return response;

  } catch (error) {
    return ErrorHandler.handleError(error, correlationId, 'getAllProducts');
  }
};