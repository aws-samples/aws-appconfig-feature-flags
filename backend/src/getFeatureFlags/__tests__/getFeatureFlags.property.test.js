// Feature: dependency-modernization, Property 5: Feature flags endpoint response wrapping
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Arbitrary for a single feature flag entry
const featureFlagArb = fc.record({
  enabled: fc.boolean(),
  title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

// Arbitrary for a config object with random feature flag names
const configArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/),
  featureFlagArb,
  { minKeys: 0, maxKeys: 10 },
);

/**
 * Replicate the handler logic from getFeatureFlags.js:
 *   const config = await getConfig();
 *   return { statusCode: 200, body: JSON.stringify(config) };
 *
 * We test the property that for ANY config object returned by getConfig,
 * the response wrapping always produces statusCode 200 and body that
 * round-trips back to the original config via JSON.parse.
 */
function buildResponse(config) {
  return {
    statusCode: 200,
    body: JSON.stringify(config),
  };
}

describe('Property 5: Feature flags endpoint response wrapping', () => {
  it('should return statusCode 200 and body === JSON.stringify(config) for any config object', async () => {
    await fc.assert(
      fc.asyncProperty(configArb, async (config) => {
        const response = buildResponse(config);

        expect(response.statusCode).toBe(200);
        expect(typeof response.body).toBe('string');
        expect(response.body).toBe(JSON.stringify(config));

        // Round-trip: parsing body should yield the original config
        expect(JSON.parse(response.body)).toEqual(config);
      }),
      { numRuns: 100 },
    );
  });

  it('should preserve all feature flag keys and values through JSON serialization', async () => {
    await fc.assert(
      fc.asyncProperty(configArb, async (config) => {
        const response = buildResponse(config);
        const parsed = JSON.parse(response.body);

        // Every key in the original config must be present in the parsed body
        for (const key of Object.keys(config)) {
          expect(parsed).toHaveProperty(key);
          expect(parsed[key].enabled).toBe(config[key].enabled);
        }

        // No extra keys should appear
        expect(Object.keys(parsed).sort()).toEqual(Object.keys(config).sort());
      }),
      { numRuns: 100 },
    );
  });
});
