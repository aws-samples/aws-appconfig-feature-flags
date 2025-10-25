import { useContext, useMemo } from 'react';
import AppContext from '../context/AppContext';
import { featureFlagService } from '../services/featureFlagService';

export interface UseFeatureFlagResult {
  isEnabled: boolean;
  variant: unknown;
  loading: boolean;
  error: string | null;
}

export function useFeatureFlag(flagName: string, context?: Record<string, unknown>): UseFeatureFlagResult {
  const { featureFlags, loading, error } = useContext(AppContext);

  const result = useMemo(() => {
    // Update the feature flag service with current flags
    featureFlagService.setFeatureFlags(featureFlags);

    const isEnabled = featureFlagService.isEnabled(flagName);
    const variant = featureFlagService.getVariant(flagName, context);

    return {
      isEnabled,
      variant,
    };
  }, [flagName, featureFlags, context]);

  return {
    ...result,
    loading,
    error,
  };
}

export function useFeatureFlags() {
  const { featureFlags, loading, error, loadFeatureFlags } = useContext(AppContext);

  return {
    featureFlags,
    loading,
    error,
    loadFeatureFlags,
    isEnabled: (flagName: string) => {
      featureFlagService.setFeatureFlags(featureFlags);
      return featureFlagService.isEnabled(flagName);
    },
    getVariant: (flagName: string, context?: Record<string, unknown>) => {
      featureFlagService.setFeatureFlags(featureFlags);
      return featureFlagService.getVariant(flagName, context);
    },
  };
}