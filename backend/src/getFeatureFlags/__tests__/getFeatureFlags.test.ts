import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../getFeatureFlags';

// Mock dependencies
jest.mock('../../FeatureFlagLayer/getConfig');
jest.mock('../../FeatureFlagLayer/getFeature');
jest.mock('../../FeatureFlagLayer/userContextExtractor');
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    addPersistentLogAttributes: jest.fn(),
  })),
}));

import { getConfig } from '../../FeatureFlagLayer/getConfig';
import { getFeature } from '../../FeatureFlagLayer/getFeature';
import { extractUserContext } from '../../FeatureFlagLayer/userContextExtractor';

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockGetFeature = getFeature as jest.MockedFunction<typeof getFeature>;
const mockExtractUserContext = extractUserContext as jest.MockedFunction<typeof extractUserContext>;

describe('getFeatureFlags Lambda Handler', () => {
  const mockEvent: APIGatewayProxyEvent = {
    httpMethod: 'GET',
    path: '/flags',
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractUserContext.mockReturnValue({
      region: 'us-east-1',
    });
  });

  it('should return feature flags successfully', async () => {
    const mockFlags = {
      feature1: { enabled: true },
      feature2: { enabled: false },
    };

    mockGetConfig.mockResolvedValue(mockFlags);

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockFlags);
    expect(result.headers?.['Content-Type']).toBe('application/json');
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers?.['X-Correlation-ID']).toBe('test-request-id');
  });

  it('should evaluate flags when evaluateFlags=true', async () => {
    const mockFlags = {
      feature1: { enabled: true },
      feature2: { enabled: false },
    };

    const eventWithEvaluate = {
      ...mockEvent,
      queryStringParameters: { evaluateFlags: 'true' },
    };

    mockGetConfig.mockResolvedValue(mockFlags);
    mockGetFeature.mockResolvedValueOnce(true);
    mockGetFeature.mockResolvedValueOnce(false);

    const result = await handler(eventWithEvaluate);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.feature1).toEqual({ enabled: true, value: true });
    expect(responseBody.feature2).toEqual({ enabled: false, value: false });
  });

  it('should handle AppConfig errors', async () => {
    const error = new Error('AppConfig service unavailable');
    mockGetConfig.mockRejectedValue(error);

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.error).toBe('INTERNAL_ERROR');
    expect(responseBody.message).toBe('AppConfig service unavailable');
  });

  it('should extract user context from event', async () => {
    const mockFlags = { feature1: { enabled: true } };
    mockGetConfig.mockResolvedValue(mockFlags);

    const eventWithHeaders = {
      ...mockEvent,
      headers: {
        'x-user-id': 'user123',
        'x-user-region': 'us-west-2',
      },
    };

    await handler(eventWithHeaders);

    expect(mockExtractUserContext).toHaveBeenCalledWith(eventWithHeaders);
  });

  it('should handle feature evaluation errors gracefully', async () => {
    const mockFlags = {
      feature1: { enabled: true },
      feature2: { enabled: true },
    };

    const eventWithEvaluate = {
      ...mockEvent,
      queryStringParameters: { evaluateFlags: 'true' },
    };

    mockGetConfig.mockResolvedValue(mockFlags);
    mockGetFeature.mockResolvedValueOnce(true);
    mockGetFeature.mockRejectedValueOnce(new Error('Feature evaluation failed'));

    const result = await handler(eventWithEvaluate);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.feature1).toEqual({ enabled: true, value: true });
    expect(responseBody.feature2).toEqual({ enabled: false, value: false });
  });

  it('should include CORS headers', async () => {
    const mockFlags = { feature1: { enabled: true } };
    mockGetConfig.mockResolvedValue(mockFlags);

    const result = await handler(mockEvent);

    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers?.['Access-Control-Allow-Headers']).toContain('Content-Type');
    expect(result.headers?.['Access-Control-Allow-Methods']).toContain('GET');
  });

  it('should handle empty configuration', async () => {
    mockGetConfig.mockResolvedValue({});

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({});
  });
});