import { Logger } from '@aws-lambda-powertools/logger';
import { 
  FeatureFlagConfig, 
  FeatureFlag, 
  MultiVariantFlag, 
  UserContext, 
  VariantRule, 
  VariantCondition,
  FeatureFlagError 
} from './types';

const logger = new Logger({ serviceName: 'FeatureFlagLayer' });

export async function getFeature(
  name: string, 
  features: FeatureFlagConfig,
  userContext?: UserContext
): Promise<boolean | unknown> {
  try {
    logger.info('Evaluating feature flag', { flagName: name, userContext });

    const feature = features[name];
    
    if (!feature) {
      logger.warn('Feature flag not found', { flagName: name });
      throw new FeatureFlagError(
        `There is no feature named "${name}"`,
        name,
        404
      );
    }

    // Check if feature is enabled at all
    if (!feature.enabled) {
      logger.info('Feature flag is disabled', { flagName: name });
      return false;
    }

    // Check if this is a multi-variant flag
    if (isMultiVariantFlag(feature)) {
      const variantValue = evaluateMultiVariantFlag(feature, userContext);
      logger.info('Multi-variant flag evaluated', { 
        flagName: name, 
        variant: variantValue 
      });
      return variantValue;
    }

    // Simple boolean flag
    logger.info('Simple feature flag evaluated as enabled', { flagName: name });
    return true;

  } catch (error) {
    logger.error('Error evaluating feature flag', {
      flagName: name,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof FeatureFlagError) {
      throw error;
    }

    throw new FeatureFlagError(
      `Failed to evaluate feature flag "${name}"`,
      name,
      500
    );
  }
}

function isMultiVariantFlag(feature: FeatureFlag): feature is MultiVariantFlag {
  return 'variants' in feature && 
         typeof feature.variants === 'object' && 
         feature.variants !== null &&
         'defaultVariant' in feature;
}

function evaluateMultiVariantFlag(
  flag: MultiVariantFlag, 
  userContext?: UserContext
): unknown {
  try {
    // If no user context or rules, return default variant
    if (!userContext || !flag.rules || flag.rules.length === 0) {
      return getVariantValue(flag, flag.defaultVariant);
    }

    // Evaluate rules in order
    for (const rule of flag.rules) {
      if (evaluateRule(rule, userContext)) {
        return getVariantValue(flag, rule.variant);
      }
    }

    // No rules matched, return default variant
    return getVariantValue(flag, flag.defaultVariant);
  } catch (error) {
    logger.warn('Error evaluating multi-variant flag, returning default', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getVariantValue(flag, flag.defaultVariant);
  }
}

function evaluateRule(rule: VariantRule, userContext: UserContext): boolean {
  return rule.conditions.every(condition => 
    evaluateCondition(condition, userContext)
  );
}

function evaluateCondition(condition: VariantCondition, userContext: UserContext): boolean {
  const contextValue = getContextValue(condition.attribute, userContext);
  
  if (contextValue === undefined || contextValue === null) {
    return false;
  }

  switch (condition.operator) {
    case 'equals':
      return contextValue === condition.value;
    
    case 'contains':
      return String(contextValue).includes(String(condition.value));
    
    case 'startsWith':
      return String(contextValue).startsWith(String(condition.value));
    
    case 'in':
      return Array.isArray(condition.value) && 
             condition.value.includes(contextValue);
    
    case 'greaterThan':
      return Number(contextValue) > Number(condition.value);
    
    case 'lessThan':
      return Number(contextValue) < Number(condition.value);
    
    default:
      logger.warn('Unknown condition operator', { operator: condition.operator });
      return false;
  }
}

function getContextValue(attribute: string, userContext: UserContext): unknown {
  switch (attribute) {
    case 'userId':
      return userContext.userId;
    case 'region':
      return userContext.region;
    case 'userAgent':
      return userContext.userAgent;
    default:
      return userContext.customAttributes?.[attribute];
  }
}

function getVariantValue(flag: MultiVariantFlag, variantName: string): unknown {
  const variant = flag.variants[variantName];
  
  if (!variant) {
    logger.warn('Variant not found, using default', { 
      variantName, 
      defaultVariant: flag.defaultVariant 
    });
    return flag.variants[flag.defaultVariant]?.value ?? false;
  }

  if (!variant.enabled) {
    logger.info('Variant is disabled, returning false', { variantName });
    return false;
  }

  return variant.value;
}

export default getFeature;