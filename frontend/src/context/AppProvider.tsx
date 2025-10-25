// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useCallback } from 'react';
import AppContext from './AppContext';
import { Product, CartItem, FeatureFlagConfig, AppContextType } from '../types';
import { apiService } from '../services/apiService';

interface AppProviderProps {
    children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }): React.JSX.Element => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [featureFlags, setFeatureFlags] = useState<FeatureFlagConfig>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const addToCart = useCallback((product: Product, quantityToAdd: number = 1): void => {
        console.log(`AppProvider: Adding ${quantityToAdd} of product ${product.itemName} (ID: ${product.id}) to cart`);
        
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            
            if (existingItem) {
                console.log(`Product already in cart, updating quantity from ${existingItem.quantity} to ${existingItem.quantity + quantityToAdd}`);
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantityToAdd }
                        : item
                );
            } else {
                console.log(`Adding new product to cart with quantity ${quantityToAdd}`);
                return [...prevCart, { ...product, quantity: quantityToAdd }];
            }
        });
    }, []);

    const removeFromCart = useCallback((productId: number): void => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: number, quantity: number): void => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback((): void => {
        setCart([]);
    }, []);

    const loadProducts = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const productsData = await apiService.getProducts();
            setProducts(productsData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
            setError(errorMessage);
            console.error('Error loading products:', err);
            
            // Retry logic for transient failures
            if (err instanceof Error && err.message.includes('Network')) {
                console.log('Network error detected, will retry on next request');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFeatureFlags = useCallback(async (): Promise<void> => {
        try {
            setError(null);
            const flagsData = await apiService.getFeatureFlags();
            setFeatureFlags(flagsData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load feature flags';
            setError(errorMessage);
            console.error('Error loading feature flags:', err);
            
            // For feature flags, we might want to use cached values or defaults
            console.log('Feature flag loading failed, using empty configuration');
        }
    }, []);

    // Calculate total items in cart (sum of all quantities)
    const getTotalItemsInCart = useCallback((): number => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }, [cart]);

    const contextValue: AppContextType = {
        products,
        cart,
        featureFlags,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadProducts,
        loadFeatureFlags,
        getTotalItemsInCart,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export default AppProvider;