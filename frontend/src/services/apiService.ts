import { get } from 'aws-amplify/api';
import { Product, FeatureFlagConfig, ApiService, ApiError } from '../types';

class ApiServiceImpl implements ApiService {
    private readonly apiName = 'apiendpoint';

    async getProducts(): Promise<Product[]> {
        try {
            const { body } = await get({ 
                apiName: this.apiName, 
                path: '/products' 
            }).response;
            
            const response = await body.json();
            
            if (!Array.isArray(response)) {
                throw new Error('Invalid response format: expected array of products');
            }

            return response as unknown as Product[];
        } catch (error) {
            console.error('Error fetching products:', error);
            
            if (this.isApiError(error)) {
                throw new Error(`API Error: ${error.message}`);
            }
            
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch products: ${error.message}`
                    : 'Failed to fetch products: Unknown error'
            );
        }
    }

    async getFeatureFlags(): Promise<FeatureFlagConfig> {
        try {
            const { body } = await get({ 
                apiName: this.apiName, 
                path: '/flags' 
            }).response;
            
            const response = await body.json();
            
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response format: expected feature flags object');
            }

            return response as unknown as FeatureFlagConfig;
        } catch (error) {
            console.error('Error fetching feature flags:', error);
            
            if (this.isApiError(error)) {
                throw new Error(`API Error: ${error.message}`);
            }
            
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch feature flags: ${error.message}`
                    : 'Failed to fetch feature flags: Unknown error'
            );
        }
    }

    private isApiError(error: unknown): error is ApiError {
        return (
            typeof error === 'object' &&
            error !== null &&
            'error' in error &&
            'message' in error
        );
    }
}

export const apiService = new ApiServiceImpl();