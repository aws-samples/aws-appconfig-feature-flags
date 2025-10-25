import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { getConfig } from '../FeatureFlagLayer/getConfig';
import { getFeature } from '../FeatureFlagLayer/getFeature';
import { extractUserContext } from '../FeatureFlagLayer/userContextExtractor';
import { FeatureFlagConfig, UserContext } from '../FeatureFlagLayer/types';
import { ErrorHandler } from '../shared/errorHandler';
import { LambdaHandler } from './types';

const logger = new Logger({ serviceName: 'getFeatureFlags' });

async function evaluateAllFlags(
  config: FeatureFlagConfig, 
  userContext: UserContext
): Promise<Record<string, unknown>> {
  const evaluatedFlags: Record<string, unknown> = {};

  for (const [flagName, flagConfig] of Object.entries(config)) {
    try {
      const result = await getFeature(flagName, config, userContext);
      evaluatedFlags[flagName] = {
        enabled: flagConfig.enabled,
        value: result,
      };
    } catch (error) {
      logger.warn(`Failed to evaluate flag ${flagName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      evaluatedFlags[flagName] = {
        enabled: false,
        value: false,
      };
    }
  }

  return evaluatedFlags;
}

export const handler: LambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const correlationId = event.requestContext.requestId;
  
  logger.addPersistentLogAttributes({
    httpMethod: event.httpMethod,
    path: event.path,
  });

  logger.info('Processing feature flags request', {
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    // Extract user context for multi-variant flag evaluation
    const userContext: UserContext = extractUserContext(event);

    // Retrieve feature flags configuration from AppConfig
    const config: FeatureFlagConfig = await getConfig();

    logger.info('Successfully retrieved feature flags', {
      flagCount: Object.keys(config).length,
      userContext: {
        hasUserId: Boolean(userContext.userId),
        region: userContext.region,
      },
    });

    // Optionally evaluate specific flags with context if requested
    let processedConfig: FeatureFlagConfig | Record<string, unknown> = config;
    
    if (event.queryStringParameters?.['evaluateFlags'] === 'true') {
      processedConfig = await evaluateAllFlags(config, userContext);
    }

    // Return successful response
    const response = ErrorHandler.createSuccessResponse(processedConfig, correlationId);

    logger.info('Returning successful response', {
      statusCode: response.statusCode,
    });

    return response;

  } catch (error) {
    return ErrorHandler.handleError(error, correlationId, 'getFeatureFlags');
  }
};