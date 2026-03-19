// Behavioral verification: confirm backend migration patterns are in place
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readSrc(relativePath) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

function readRoot(relativePath) {
  return readFileSync(resolve(__dirname, '..', '..', relativePath), 'utf-8');
}

describe('Backend migration verification', () => {
  describe('getAllProducts.js — AWS SDK v3', () => {
    const src = readSrc('getAllProducts/getAllProducts.js');

    it('imports from @aws-sdk/client-dynamodb', () => {
      expect(src).toMatch(/@aws-sdk\/client-dynamodb/);
    });

    it('imports from @aws-sdk/lib-dynamodb', () => {
      expect(src).toMatch(/@aws-sdk\/lib-dynamodb/);
    });

    it('does not use aws-sdk v2 imports', () => {
      expect(src).not.toMatch(/require\s*\(\s*['"]aws-sdk/);
    });
  });

  describe('template.yaml — Lambda runtime', () => {
    const src = readRoot('template.yaml');

    it('declares nodejs20.x runtime for Lambda functions', () => {
      const runtimeMatches = src.match(/Runtime:\s*nodejs\S+/g) || [];
      expect(runtimeMatches.length).toBeGreaterThan(0);
      runtimeMatches.forEach((match) => {
        expect(match).toMatch(/nodejs20\.x/);
      });
    });

    it('declares nodejs20.x for FeatureFlagLayer CompatibleRuntimes', () => {
      expect(src).toMatch(/CompatibleRuntimes:\s*\n\s*-\s*nodejs20\.x/);
    });

    it('declares nodejs20.x BuildMethod for FeatureFlagLayer', () => {
      expect(src).toMatch(/BuildMethod:\s*nodejs20\.x/);
    });
  });
});
