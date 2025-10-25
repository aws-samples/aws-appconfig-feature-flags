import { getConfig } from '../getConfig';
import { AppConfigError } from '../types';

// Mock AWS Lambda Powertools
jest.mock('@aws-lambda-powertools/parameters/appconfig', () => ({
  getAppConfig: jest.fn(),
}));

jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';

const mockGetAppConfig = getAppConfig as jest.MockedFunction<typeof getAppConfig>;

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      APPCONFIG_APPLICATION: 'test-app',
      APPCONFIG_ENVIRONMENT: 'test-env',
      APPCONFIG_CONFIGURATION: 'test-config',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should successfully retrieve configuration', async () => {
    const mockConfig = {
      feature1: { enabled: true },
      feature2: { enabled: false },
    };

    mockGetAppConfig.mockResolvedValue(mockConfig as any);

    const result = await getConfig();

    expect(result).toEqual(mockConfig);
    expect(mockGetAppConfig).toHaveBeenCalledWith(
      'test-config',
      {
        application: 'test-app',
        environment: 'test-env',
        transform: 'json',
        maxAge: 300,
      }
    );
  });

  it('should throw AppConfigError when environment variables are missing', async () => {
    delete process.env['APPCONFIG_APPLICATION'];

    await expect(getConfig()).rejects.toThrow(AppConfigError);
    await expect(getConfig()).rejects.toThrow('Missing required AppConfig environment variables');
  });

  it('should throw AppConfigError when configuration is invalid', async () => {
    mockGetAppConfig.mockResolvedValue(null as any);

    await expect(getConfig()).rejects.toThrow(AppConfigError);
    await expect(getConfig()).rejects.toThrow('Invalid configuration format received from AppConfig');
  });

  it('should throw AppConfigError when configuration is not an object', async () => {
    mockGetAppConfig.mockResolvedValue('invalid string config' as any);

    await expect(getConfig()).rejects.toThrow(AppConfigError);
    await expect(getConfig()).rejects.toThrow('Invalid configuration format received from AppConfig');
  });

  it('should handle AppConfig service errors', async () => {
    const serviceError = new Error('AppConfig service unavailable');
    mockGetAppConfig.mockRejectedValue(serviceError);

    await expect(getConfig()).rejects.toThrow(AppConfigError);
    await expect(getConfig()).rejects.toThrow('Failed to retrieve configuration from AppConfig');
  });

  it('should handle network timeouts', async () => {
    const timeoutError = new Error('Request timeout');
    mockGetAppConfig.mockRejectedValue(timeoutError);

    await expect(getConfig()).rejects.toThrow(AppConfigError);
  });

  describe('environment variable validation', () => {
    const requiredVars = ['APPCONFIG_APPLICATION', 'APPCONFIG_ENVIRONMENT', 'APPCONFIG_CONFIGURATION'];

    requiredVars.forEach(varName => {
      it(`should throw error when ${varName} is missing`, async () => {
        delete process.env[varName as keyof NodeJS.ProcessEnv];

        await expect(getConfig()).rejects.toThrow(AppConfigError);
        await expect(getConfig()).rejects.toThrow('Missing required AppConfig environment variables');
      });

      it(`should throw error when ${varName} is empty`, async () => {
        process.env[varName as keyof NodeJS.ProcessEnv] = '';

        await expect(getConfig()).rejects.toThrow(AppConfigError);
        await expect(getConfig()).rejects.toThrow('Missing required AppConfig environment variables');
      });
    });
  });
});