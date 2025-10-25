import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Feature from '../Feature';
import AppContext from '../../context/AppContext';
import { AppContextType } from '../../types';

// Mock the feature flag service
jest.mock('../../services/featureFlagService', () => ({
  featureFlagService: {
    setFeatureFlags: jest.fn(),
    isEnabled: jest.fn(),
  },
}));

import { featureFlagService } from '../../services/featureFlagService';

const mockFeatureFlagService = featureFlagService as jest.Mocked<typeof featureFlagService>;

describe('Feature Component', () => {
  const mockContextValue: AppContextType = {
    products: [],
    cart: [],
    featureFlags: {
      enabled_flag: { enabled: true },
      disabled_flag: { enabled: false },
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

  const renderWithContext = (contextValue: AppContextType, component: React.ReactElement) => {
    return render(
      <AppContext.Provider value={contextValue}>
        {component}
      </AppContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when feature flag is enabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(true);

    renderWithContext(
      mockContextValue,
      <Feature flagName="enabled_flag">
        <div>Feature content</div>
      </Feature>
    );

    expect(screen.getByText('Feature content')).toBeInTheDocument();
    expect(mockFeatureFlagService.setFeatureFlags).toHaveBeenCalledWith(mockContextValue.featureFlags);
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('enabled_flag');
  });

  it('should not render children when feature flag is disabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);

    renderWithContext(
      mockContextValue,
      <Feature flagName="disabled_flag">
        <div>Feature content</div>
      </Feature>
    );

    expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
  });

  it('should render fallback when feature flag is disabled and fallback is provided', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);

    renderWithContext(
      mockContextValue,
      <Feature 
        flagName="disabled_flag" 
        fallback={<div>Fallback content</div>}
      >
        <div>Feature content</div>
      </Feature>
    );

    expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
    expect(screen.getByText('Fallback content')).toBeInTheDocument();
  });

  it('should return null when feature flag is disabled and no fallback is provided', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);

    const { container } = renderWithContext(
      mockContextValue,
      <Feature flagName="disabled_flag">
        <div>Feature content</div>
      </Feature>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle non-existent feature flags', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);

    renderWithContext(
      mockContextValue,
      <Feature flagName="non_existent_flag">
        <div>Feature content</div>
      </Feature>
    );

    expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('non_existent_flag');
  });

  it('should update feature flag service when context changes', () => {
    const { rerender } = renderWithContext(
      mockContextValue,
      <Feature flagName="enabled_flag">
        <div>Feature content</div>
      </Feature>
    );

    const updatedContextValue = {
      ...mockContextValue,
      featureFlags: {
        enabled_flag: { enabled: false },
      },
    };

    rerender(
      <AppContext.Provider value={updatedContextValue}>
        <Feature flagName="enabled_flag">
          <div>Feature content</div>
        </Feature>
      </AppContext.Provider>
    );

    expect(mockFeatureFlagService.setFeatureFlags).toHaveBeenCalledWith(updatedContextValue.featureFlags);
  });
});