import { getFeature } from '../getFeature';
import { FeatureFlagConfig, UserContext, FeatureFlagError } from '../types';

// Mock the logger
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('getFeature', () => {
  const mockFeatureFlags: FeatureFlagConfig = {
    simple_flag: {
      enabled: true,
    },
    disabled_flag: {
      enabled: false,
    },
    multi_variant_flag: {
      enabled: true,
      variants: {
        variant_a: {
          enabled: true,
          value: 'A',
        },
        variant_b: {
          enabled: true,
          value: 'B',
        },
        disabled_variant: {
          enabled: false,
          value: 'disabled',
        },
      },
      defaultVariant: 'variant_a',
      rules: [
        {
          conditions: [
            {
              attribute: 'userId',
              operator: 'equals',
              value: 'user123',
            },
          ],
          variant: 'variant_b',
        },
      ],
    },
  };

  describe('simple feature flags', () => {
    it('should return true for enabled flag', async () => {
      const result = await getFeature('simple_flag', mockFeatureFlags);
      expect(result).toBe(true);
    });

    it('should return false for disabled flag', async () => {
      const result = await getFeature('disabled_flag', mockFeatureFlags);
      expect(result).toBe(false);
    });

    it('should throw FeatureFlagError for non-existent flag', async () => {
      await expect(getFeature('non_existent', mockFeatureFlags)).rejects.toThrow(FeatureFlagError);
    });
  });

  describe('multi-variant feature flags', () => {
    it('should return default variant when no user context', async () => {
      const result = await getFeature('multi_variant_flag', mockFeatureFlags);
      expect(result).toBe('A');
    });

    it('should return default variant when no rules match', async () => {
      const userContext: UserContext = {
        userId: 'different_user',
      };
      const result = await getFeature('multi_variant_flag', mockFeatureFlags, userContext);
      expect(result).toBe('A');
    });

    it('should return specific variant when rule matches', async () => {
      const userContext: UserContext = {
        userId: 'user123',
      };
      const result = await getFeature('multi_variant_flag', mockFeatureFlags, userContext);
      expect(result).toBe('B');
    });

    it('should return false when variant is disabled', async () => {
      const flagsWithDisabledVariant: FeatureFlagConfig = {
        test_flag: {
          enabled: true,
          variants: {
            disabled_variant: {
              enabled: false,
              value: 'test',
            },
          },
          defaultVariant: 'disabled_variant',
        },
      };

      const result = await getFeature('test_flag', flagsWithDisabledVariant);
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw FeatureFlagError with correct properties', async () => {
      try {
        await getFeature('non_existent', mockFeatureFlags);
      } catch (error) {
        expect(error).toBeInstanceOf(FeatureFlagError);
        expect((error as FeatureFlagError).flagName).toBe('non_existent');
        expect((error as FeatureFlagError).statusCode).toBe(404);
      }
    });

    it('should handle malformed feature flag gracefully', async () => {
      const malformedFlags: FeatureFlagConfig = {
        malformed_flag: {
          enabled: true,
          variants: null as any,
          defaultVariant: 'non_existent',
        },
      };

      const result = await getFeature('malformed_flag', malformedFlags);
      expect(result).toBe(true); // Should fall back to simple flag behavior
    });
  });

  describe('variant rule evaluation', () => {
    const complexFlags: FeatureFlagConfig = {
      complex_flag: {
        enabled: true,
        variants: {
          default: { enabled: true, value: 'default' },
          premium: { enabled: true, value: 'premium' },
          beta: { enabled: true, value: 'beta' },
        },
        defaultVariant: 'default',
        rules: [
          {
            conditions: [
              { attribute: 'region', operator: 'equals', value: 'us-west-2' },
              { attribute: 'userId', operator: 'contains', value: 'premium' },
            ],
            variant: 'premium',
          },
          {
            conditions: [
              { attribute: 'userAgent', operator: 'contains', value: 'Beta' },
            ],
            variant: 'beta',
          },
        ],
      },
    };

    it('should evaluate multiple conditions with AND logic', async () => {
      const userContext: UserContext = {
        region: 'us-west-2',
        userId: 'premium_user_123',
      };

      const result = await getFeature('complex_flag', complexFlags, userContext);
      expect(result).toBe('premium');
    });

    it('should not match when only some conditions match', async () => {
      const userContext: UserContext = {
        region: 'us-west-2',
        userId: 'regular_user',
      };

      const result = await getFeature('complex_flag', complexFlags, userContext);
      expect(result).toBe('default');
    });

    it('should match first applicable rule', async () => {
      const userContext: UserContext = {
        region: 'us-west-2',
        userId: 'premium_user_123',
        userAgent: 'Mozilla/5.0 Beta',
      };

      const result = await getFeature('complex_flag', complexFlags, userContext);
      expect(result).toBe('premium'); // First rule should match
    });
  });
});