import { APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { AppConfigError, FeatureFlagError } from '../FeatureFlagLayer/types';

const logger = new Logger({ serviceName: 'ErrorHandler' });

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  correlationId?: string;
}

export class ErrorHandler {
  static handleError(
    error: unknown, 
    correlationId: string,
    context?: string
  ): APIGatewayProxyResult {
    logger.error('Handling error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
      context,
    });

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Internal server error';

    if (error instanceof AppConfigError) {
      statusCode = error.statusCode;
      errorCode = error.code || 'APPCONFIG_ERROR';
      errorMessage = error.message;
    } else if (error instanceof FeatureFlagError) {
      statusCode = error.statusCode;
      errorCode = 'FEATURE_FLAG_ERROR';
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error patterns
      if (error.message.includes('timeout')) {
        statusCode = 504;
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('not found')) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
      } else if (error.message.includes('unauthorized')) {
        statusCode = 401;
        errorCode = 'UNAUTHORIZED';
      } else if (error.message.includes('forbidden')) {
        statusCode = 403;
        errorCode = 'FORBIDDEN';
      }
    }

    const errorResponse: ErrorResponse = {
      error: errorCode,
      message: errorMessage,
      correlationId,
    };

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(errorResponse),
    };
  }

  static logError(error: unknown, context: string, additionalInfo?: Record<string, unknown>): void {
    logger.error(`Error in ${context}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...additionalInfo,
    });
  }

  static createSuccessResponse<T>(
    data: T, 
    correlationId: string,
    statusCode: number = 200
  ): APIGatewayProxyResult {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(data),
    };
  }
}