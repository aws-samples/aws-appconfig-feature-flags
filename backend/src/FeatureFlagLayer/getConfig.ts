import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
import { Logger } from '@aws-lambda-powertools/logger';
import { FeatureFlagConfig, AppConfigError } from './types';

const logger = new Logger({ serviceName: 'FeatureFlagLayer' });

export async function getConfig(): Promise<FeatureFlagConfig> {
  try {
    const application = process.env['APPCONFIG_APPLICATION'];
    const environment = process.env['APPCONFIG_ENVIRONMENT'];
    const configuration = process.env['APPCONFIG_CONFIGURATION'];

    if (!application || !environment || !configuration) {
      throw new AppConfigError(
        'Missing required AppConfig environment variables',
        500,
        'MISSING_CONFIG'
      );
    }

    logger.info('Retrieving AppConfig configuration', {
      application,
      environment,
      configuration,
    });

    // Use AWS Lambda Powertools to get AppConfig data with JSON transformation
    const config = await getAppConfig(configuration, {
      application,
      environment,
      transform: 'json',
      maxAge: 300, // Cache for 5 minutes
    });

    if (!config || typeof config !== 'object') {
      throw new AppConfigError(
        'Invalid configuration format received from AppConfig',
        500,
        'INVALID_CONFIG_FORMAT'
      );
    }

    const configObject = config as Record<string, unknown>;
    
    logger.info('Successfully retrieved AppConfig configuration', {
      flagCount: Object.keys(configObject).length,
    });

    return configObject as FeatureFlagConfig;
  } catch (error) {
    logger.error('Failed to retrieve AppConfig configuration', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof AppConfigError) {
      throw error;
    }

    throw new AppConfigError(
      'Failed to retrieve configuration from AppConfig',
      500,
      'CONFIG_RETRIEVAL_FAILED'
    );
  }
}

export default getConfig;