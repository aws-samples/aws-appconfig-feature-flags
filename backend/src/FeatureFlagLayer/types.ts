// Feature Flag Types
export interface FeatureFlag {
  enabled: boolean;
  variants?: Record<string, unknown>;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureFlagConfig {
  [flagName: string]: FeatureFlag | MultiVariantFlag;
}

export interface MultiVariantFlag extends FeatureFlag {
  variants: {
    [variantName: string]: {
      enabled: boolean;
      value: unknown;
      weight?: number;
    };
  };
  defaultVariant: string;
  rules?: VariantRule[];
}

// Variant Evaluation Rules
export interface VariantRule {
  conditions: VariantCondition[];
  variant: string;
}

export interface VariantCondition {
  attribute: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'in' | 'greaterThan' | 'lessThan';
  value: unknown;
}

// User Context for Multi-Variant Evaluation
export interface UserContext {
  userId?: string;
  region?: string;
  userAgent?: string;
  customAttributes?: Record<string, unknown>;
}

// Configuration Types
export interface AppConfigOptions {
  application: string;
  environment: string;
  configuration: string;
  maxAge?: number;
  transform?: 'json' | 'binary';
}

// Error Types
export class AppConfigError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppConfigError';
  }
}

export class FeatureFlagError extends Error {
  constructor(
    message: string,
    public readonly flagName: string,
    public readonly statusCode: number = 404
  ) {
    super(message);
    this.name = 'FeatureFlagError';
  }
}