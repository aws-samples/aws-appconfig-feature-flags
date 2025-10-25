import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../getAllProducts';
import { Product } from '../types';

// Mock dependencies
jest.mock('../../FeatureFlagLayer/getConfig');
jest.mock('../../FeatureFlagLayer/getFeature');
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    addPersistentLogAttributes: jest.fn(),
  })),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSendFn = jest.fn();
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSendFn,
      })),
    },
    ScanCommand: jest.fn().mockImplementation((params) => params),
  };
});

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
}));

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '../../FeatureFlagLayer/getConfig';
import { getFeature } from '../../FeatureFlagLayer/getFeature';

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockGetFeature = getFeature as jest.MockedFunction<typeof getFeature>;

// Get the mock send function
const mockDocClient = (DynamoDBDocumentClient.from as jest.Mock)();
const mockSendFromModule = mockDocClient.send;

describe('getAllProducts Lambda Handler', () => {
  const originalEnv = process.env;
  
  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'GET',
    path: '/products',
    headers: {},
    queryStringParameters: null,
    requestContext: {
      requestId: 'test-request-id',
    } as any,
    body: null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    pathParameters: null,
    resource: '',
    stageVariables: null,
  };

  const mockProducts: Product[] = [
    {
      id: 1,
      itemName: 'Test Product 1',
      itemDesc: 'Description 1',
      itemPrice: 10.99,
      itemImage: 'image1.jpg',
      itemStock: 5,
    },
    {
      id: 2,
      itemName: 'Test Product 2',
      itemDesc: 'Description 2',
      itemPrice: 20.99,
      itemImage: 'image2.jpg',
      itemStock: 10,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      PRODUCT_TABLE: 'test-products-table',
      AWS_REGION: 'us-east-1',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return products with stock when show_stock flag is enabled', async () => {
    mockGetConfig.mockResolvedValue({ show_stock: { enabled: true } });
    mockGetFeature.mockResolvedValue(true);
    mockSendFromModule.mockResolvedValue({
      Items: mockProducts,
      ScannedCount: 2,
    });

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockProducts);
    
    // Verify DynamoDB scan was called with stock attribute
    expect(mockSendFromModule).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: 'test-products-table',
        ProjectionExpression: 'id, itemDesc, itemName, itemPrice, itemImage, itemStock',
      })
    );
  });

  it('should return products without stock when show_stock flag is disabled', async () => {
    mockGetConfig.mockResolvedValue({ show_stock: { enabled: false } });
    mockGetFeature.mockResolvedValue(false);
    mockSendFromModule.mockResolvedValue({
      Items: mockProducts.map(({ itemStock, ...product }) => product),
      ScannedCount: 2,
    });

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    
    // Verify DynamoDB scan was called without stock attribute
    expect(mockSendFromModule).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: 'test-products-table',
        ProjectionExpression: 'id, itemDesc, itemName, itemPrice, itemImage',
      })
    );
  });

  it('should handle empty product list', async () => {
    mockGetConfig.mockResolvedValue({ show_stock: { enabled: true } });
    mockGetFeature.mockResolvedValue(true);
    mockSendFromModule.mockResolvedValue({
      Items: [],
      ScannedCount: 0,
    });

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([]);
  });

  it('should handle DynamoDB errors', async () => {
    mockGetConfig.mockResolvedValue({ show_stock: { enabled: true } });
    mockGetFeature.mockResolvedValue(true);
    mockSendFromModule.mockRejectedValue(new Error('DynamoDB service unavailable'));

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('INTERNAL_ERROR');
    expect(responseBody.message).toContain('Failed to retrieve products');
  });

  it('should handle missing PRODUCT_TABLE environment variable', async () => {
    delete process.env['PRODUCT_TABLE'];

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('INTERNAL_ERROR');
    expect(responseBody.message).toContain('PRODUCT_TABLE environment variable is not set');
  });

  it('should handle AppConfig errors', async () => {
    mockGetConfig.mockRejectedValue(new Error('AppConfig unavailable'));

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('INTERNAL_ERROR');
  });

  it('should include CORS headers', async () => {
    mockGetConfig.mockResolvedValue({ show_stock: { enabled: true } });
    mockGetFeature.mockResolvedValue(true);
    mockSendFromModule.mockResolvedValue({ Items: mockProducts });

    const result = await handler(mockEvent);

    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers?.['Content-Type']).toBe('application/json');
    expect(result.headers?.['X-Correlation-ID']).toBe('test-request-id');
  });

  it('should handle feature flag evaluation errors gracefully', async () => {
    mockGetConfig.mockResolvedValue({ show_stock: { enabled: true } });
    mockGetFeature.mockRejectedValue(new Error('Feature evaluation failed'));
    mockSendFromModule.mockResolvedValue({ Items: mockProducts });

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('INTERNAL_ERROR');
  });
});