import React from 'react';
import { renderHook } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags } from '../useFeatureFlag';
import AppContext from '../../context/AppContext';
import { AppContextType } from '../../types';

// Mock the feature flag service
jest.mock('../../services/featureFlagService', () => ({
  featureFlagService: {
    setFeatureFlags: jest.fn(),
    isEnabled: jest.fn(),
    getVariant: jest.fn(),
  },
}));

import { featureFlagService } from '../../services/featureFlagService';

const mockFeatureFlagService = featureFlagService as jest.Mocked<typeof featureFlagService>;

describe('useFeatureFlag', () => {
  const mockContextValue: AppContextType = {
    products: [],
    cart: [],
    featureFlags: {
      enabled_flag: { enabled: true },
      disabled_flag: { enabled: false },
      variant_flag: {
        enabled: true,
        variants: {
          variant_a: { enabled: true, value: 'A' },
          variant_b: { enabled: true, value: 'B' },
        },
        defaultVariant: 'variant_a',
      },
    },
    loading: false,
    error: null,
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    loadProducts: jest.fn(),
    loadFeatureFlags: jest.fn(),
  };

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AppContext.Provider value={mockContextValue}>
      {children}
    </AppContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFeatureFlag', () => {
    it('should return enabled state and variant for a feature flag', () => {
      mockFeatureFlagService.isEnabled.mockReturnValue(true);
      mockFeatureFlagService.getVariant.mockReturnValue('test_variant');

      const { result } = renderHook(
        () => useFeatureFlag('enabled_flag'),
        { wrapper }
      );

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.variant).toBe('test_variant');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      expect(mockFeatureFlagService.setFeatureFlags).toHaveBeenCalledWith(mockContextValue.featureFlags);
      expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('enabled_flag');
      expect(mockFeatureFlagService.getVariant).toHaveBeenCalledWith('enabled_flag', undefined);
    });

    it('should pass context to getVariant when provided', () => {
      mockFeatureFlagService.isEnabled.mockReturnValue(true);
      mockFeatureFlagService.getVariant.mockReturnValue('contextual_variant');

      const context = { userId: 'user123' };

      const { result } = renderHook(
        () => useFeatureFlag('enabled_flag', context),
        { wrapper }
      );

      expect(result.current.variant).toBe('contextual_variant');
      expect(mockFeatureFlagService.getVariant).toHaveBeenCalledWith('enabled_flag', context);
    });

    it('should return disabled state for disabled flag', () => {
      mockFeatureFlagService.isEnabled.mockReturnValue(false);
      mockFeatureFlagService.getVariant.mockReturnValue(false);

      const { result } = renderHook(
        () => useFeatureFlag('disabled_flag'),
        { wrapper }
      );

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.variant).toBe(false);
    });

    it('should reflect loading and error states from context', () => {
      const loadingContextValue = {
        ...mockContextValue,
        loading: true,
        error: 'Test error',
      };

      const loadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <AppContext.Provider value={loadingContextValue}>
          {children}
        </AppContext.Provider>
      );

      mockFeatureFlagService.isEnabled.mockReturnValue(true);
      mockFeatureFlagService.getVariant.mockReturnValue(true);

      const { result } = renderHook(
        () => useFeatureFlag('enabled_flag'),
        { wrapper: loadingWrapper }
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe('Test error');
    });

    it('should memoize results based on flag name and context', () => {
      mockFeatureFlagService.isEnabled.mockReturnValue(true);
      mockFeatureFlagService.getVariant.mockReturnValue('memoized_variant');

      const { result, rerender } = renderHook(
        ({ flagName, context }) => useFeatureFlag(flagName, context),
        {
          wrapper,
          initialProps: { flagName: 'enabled_flag', context: { userId: 'user123' } },
        }
      );

      const firstResult = result.current;

      // Re-render with same props
      rerender({ flagName: 'enabled_flag', context: { userId: 'user123' } });

      expect(result.current).toBe(firstResult); // Should be the same object reference
    });
  });

  describe('useFeatureFlags', () => {
    it('should return feature flags and utility functions', () => {
      mockFeatureFlagService.isEnabled.mockReturnValue(true);
      mockFeatureFlagService.getVariant.mockReturnValue('test_variant');

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      expect(result.current.featureFlags).toBe(mockContextValue.featureFlags);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.loadFeatureFlags).toBe(mockContextValue.loadFeatureFlags);

      // Test utility functions
      expect(result.current.isEnabled('test_flag')).toBe(true);
      expect(result.current.getVariant('test_flag', { userId: 'user123' })).toBe('test_variant');

      expect(mockFeatureFlagService.setFeatureFlags).toHaveBeenCalledWith(mockContextValue.featureFlags);
      expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('test_flag');
      expect(mockFeatureFlagService.getVariant).toHaveBeenCalledWith('test_flag', { userId: 'user123' });
    });

    it('should handle disabled flags in utility functions', () => {
      mockFeatureFlagService.isEnabled.mockReturnValue(false);
      mockFeatureFlagService.getVariant.mockReturnValue(false);

      const { result } = renderHook(() => useFeatureFlags(), { wrapper });

      expect(result.current.isEnabled('disabled_flag')).toBe(false);
      expect(result.current.getVariant('disabled_flag')).toBe(false);
    });
  });
});