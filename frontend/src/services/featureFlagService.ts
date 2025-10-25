import { 
    FeatureFlagConfig, 
    FeatureFlag, 
    MultiVariantFlag, 
    FeatureFlagService, 
    UserContext 
} from '../types';

class FeatureFlagServiceImpl implements FeatureFlagService {
    private featureFlags: FeatureFlagConfig = {};

    setFeatureFlags(flags: FeatureFlagConfig): void {
        this.featureFlags = flags;
    }

    isEnabled(flagName: string): boolean {
        const flag = this.featureFlags[flagName];
        
        if (!flag) {
            console.warn(`Feature flag '${flagName}' not found`);
            return false;
        }

        return flag.enabled;
    }

    getVariant(flagName: string, context?: Record<string, unknown>): unknown {
        const flag = this.featureFlags[flagName];
        
        if (!flag) {
            console.warn(`Feature flag '${flagName}' not found`);
            return false;
        }

        if (!flag.enabled) {
            return false;
        }

        // Check if this is a multi-variant flag
        if (this.isMultiVariantFlag(flag)) {
            return this.evaluateMultiVariantFlag(flag, context);
        }

        // Simple boolean flag
        return true;
    }

    evaluateFlag(flagName: string, _userContext?: UserContext): FeatureFlag {
        const flag = this.featureFlags[flagName];
        
        if (!flag) {
            console.warn(`Feature flag '${flagName}' not found`);
            return { enabled: false };
        }

        return flag;
    }

    private isMultiVariantFlag(flag: FeatureFlag): flag is MultiVariantFlag {
        return 'variants' in flag && 
               typeof flag.variants === 'object' && 
               flag.variants !== null &&
               'defaultVariant' in flag;
    }

    private evaluateMultiVariantFlag(
        flag: MultiVariantFlag, 
        _context?: Record<string, unknown>
    ): unknown {
        try {
            // For now, return the default variant value
            // In a full implementation, this would evaluate rules based on context
            const defaultVariant = flag.variants[flag.defaultVariant];
            
            if (!defaultVariant) {
                console.warn(`Default variant '${flag.defaultVariant}' not found`);
                return false;
            }

            if (!defaultVariant.enabled) {
                return false;
            }

            return defaultVariant.value;
        } catch (error) {
            console.warn('Error evaluating multi-variant flag, returning false', error);
            return false;
        }
    }
}

export const featureFlagService = new FeatureFlagServiceImpl();