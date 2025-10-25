import { APIGatewayProxyEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { UserContext } from './types';

const logger = new Logger({ serviceName: 'UserContextExtractor' });

export function extractUserContext(event: APIGatewayProxyEvent): UserContext {
    try {
        const userContext: UserContext = {};

        // Extract user ID from headers or query parameters
        if (event.headers['x-user-id']) {
            userContext.userId = event.headers['x-user-id'];
        } else if (event.queryStringParameters?.['userId']) {
            userContext.userId = event.queryStringParameters['userId'];
        }

        // Extract region from headers or use AWS region
        if (event.headers['x-user-region']) {
            userContext.region = event.headers['x-user-region'];
        } else {
            userContext.region = process.env['AWS_REGION'] || 'us-east-1';
        }

        // Extract user agent
        if (event.headers['User-Agent']) {
            userContext.userAgent = event.headers['User-Agent'];
        }

        // Extract custom attributes from query parameters
        if (event.queryStringParameters) {
            const customAttributes: Record<string, unknown> = {};
            
            Object.entries(event.queryStringParameters).forEach(([key, value]) => {
                if (key.startsWith('attr_') && value) {
                    const attributeName = key.substring(5); // Remove 'attr_' prefix
                    customAttributes[attributeName] = value;
                }
            });

            if (Object.keys(customAttributes).length > 0) {
                userContext.customAttributes = customAttributes;
            }
        }

        logger.info('Extracted user context', {
            hasUserId: Boolean(userContext.userId),
            region: userContext.region,
            hasUserAgent: Boolean(userContext.userAgent),
            customAttributeCount: Object.keys(userContext.customAttributes || {}).length,
        });

        return userContext;
    } catch (error) {
        logger.warn('Error extracting user context, returning empty context', {
            error: error instanceof Error ? error.message : String(error),
        });
        
        return {
            region: process.env['AWS_REGION'] || 'us-east-1',
        };
    }
}

export function validateUserContext(userContext: UserContext): boolean {
    // Basic validation - can be extended based on requirements
    if (userContext.userId && typeof userContext.userId !== 'string') {
        return false;
    }
    
    if (userContext.region && typeof userContext.region !== 'string') {
        return false;
    }
    
    if (userContext.userAgent && typeof userContext.userAgent !== 'string') {
        return false;
    }
    
    if (userContext.customAttributes && typeof userContext.customAttributes !== 'object') {
        return false;
    }
    
    return true;
}