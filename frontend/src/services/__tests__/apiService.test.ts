import { API } from 'aws-amplify';
import { apiService } from '../apiService';
import { Product, FeatureFlagConfig } from '../../types';

// Mock AWS Amplify API
jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
}));

const mockAPI = API as jest.Mocked<typeof API>;

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        itemName: 'Test Product 1',
        itemDesc: 'Description 1',
        itemPrice: 10.99,
        itemImage: 'image1.jpg',
        itemStock: 5,
      },
      {
        id: 2,
        itemName: 'Test Product 2',
        itemDesc: 'Description 2',
        itemPrice: 20.99,
        itemImage: 'image2.jpg',
      },
    ];

    it('should fetch products successfully', async () => {
      mockAPI.get.mockResolvedValue(mockProducts);

      const result = await apiService.getProducts();

      expect(result).toEqual(mockProducts);
      expect(mockAPI.get).toHaveBeenCalledWith('apiendpoint', '/products', {});
    });

    it('should throw error when response is not an array', async () => {
      mockAPI.get.mockResolvedValue({ invalid: 'response' });

      await expect(apiService.getProducts()).rejects.toThrow(
        'Invalid response format: expected array of products'
      );
    });

    it('should handle API errors', async () => {
      const apiError = {
        error: 'API_ERROR',
        message: 'Service unavailable',
      };
      mockAPI.get.mockRejectedValue(apiError);

      await expect(apiService.getProducts()).rejects.toThrow('API Error: Service unavailable');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockAPI.get.mockRejectedValue(networkError);

      await expect(apiService.getProducts()).rejects.toThrow(
        'Failed to fetch products: Network error'
      );
    });

    it('should handle unknown errors', async () => {
      mockAPI.get.mockRejectedValue('Unknown error');

      await expect(apiService.getProducts()).rejects.toThrow(
        'Failed to fetch products: Unknown error'
      );
    });
  });

  describe('getFeatureFlags', () => {
    const mockFeatureFlags: FeatureFlagConfig = {
      feature1: { enabled: true },
      feature2: { enabled: false },
      variant_feature: {
        enabled: true,
        variants: {
          variant_a: { enabled: true, value: 'A' },
          variant_b: { enabled: true, value: 'B' },
        },
        defaultVariant: 'variant_a',
      },
    };

    it('should fetch feature flags successfully', async () => {
      mockAPI.get.mockResolvedValue(mockFeatureFlags);

      const result = await apiService.getFeatureFlags();

      expect(result).toEqual(mockFeatureFlags);
      expect(mockAPI.get).toHaveBeenCalledWith('apiendpoint', '/flags', {});
    });

    it('should throw error when response is not an object', async () => {
      mockAPI.get.mockResolvedValue('invalid response');

      await expect(apiService.getFeatureFlags()).rejects.toThrow(
        'Invalid response format: expected feature flags object'
      );
    });

    it('should throw error when response is null', async () => {
      mockAPI.get.mockResolvedValue(null);

      await expect(apiService.getFeatureFlags()).rejects.toThrow(
        'Invalid response format: expected feature flags object'
      );
    });

    it('should handle API errors', async () => {
      const apiError = {
        error: 'FEATURE_FLAG_ERROR',
        message: 'Feature flags service unavailable',
      };
      mockAPI.get.mockRejectedValue(apiError);

      await expect(apiService.getFeatureFlags()).rejects.toThrow(
        'API Error: Feature flags service unavailable'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Connection timeout');
      mockAPI.get.mockRejectedValue(networkError);

      await expect(apiService.getFeatureFlags()).rejects.toThrow(
        'Failed to fetch feature flags: Connection timeout'
      );
    });

    it('should handle empty feature flags object', async () => {
      mockAPI.get.mockResolvedValue({});

      const result = await apiService.getFeatureFlags();

      expect(result).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should correctly identify API errors', async () => {
      const apiError = {
        error: 'TEST_ERROR',
        message: 'Test error message',
      };
      mockAPI.get.mockRejectedValue(apiError);

      await expect(apiService.getProducts()).rejects.toThrow('API Error: Test error message');
    });

    it('should handle errors without message property', async () => {
      const errorWithoutMessage = {
        error: 'TEST_ERROR',
      };
      mockAPI.get.mockRejectedValue(errorWithoutMessage);

      await expect(apiService.getProducts()).rejects.toThrow('API Error: undefined');
    });

    it('should handle non-object errors', async () => {
      mockAPI.get.mockRejectedValue('String error');

      await expect(apiService.getProducts()).rejects.toThrow(
        'Failed to fetch products: Unknown error'
      );
    });
  });
});