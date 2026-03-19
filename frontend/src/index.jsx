import React from 'react';
import { createRoot } from 'react-dom/client';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import configData from "./config.json";

import AppProvider from './context/AppProvider'

// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import App from './App';
import Product from './pages/Product'
import Checkout from './pages/Checkout'
import PlacedOrder from './pages/PlacedOrder'

Amplify.configure({
    API: {
        REST: {
            apiendpoint: {
                endpoint: configData.API_ENDPOINT
            }
        }
    }
});

const routing = (
    <AppProvider>
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/ordercomplete" element={<PlacedOrder />} />
                <Route path="*" element={<App />} />
            </Routes>
        </Router>
    </AppProvider>
)

const root = createRoot(document.getElementById('root'));
root.render(routing);

