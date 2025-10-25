// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';
import { AppContextType } from '../types';

const defaultContextValue: AppContextType = {
    products: [],
    cart: [],
    featureFlags: {},
    loading: false,
    error: null,
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    loadProducts: async () => {},
    loadFeatureFlags: async () => {},
    getTotalItemsInCart: () => 0,
};

const AppContext = React.createContext<AppContextType>(defaultContextValue);

export default AppContext;