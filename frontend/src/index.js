import React from 'react';
import ReactDOM from 'react-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import Amplify from 'aws-amplify'
import * as serviceWorker from './serviceWorker';
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
        endpoints: [
            {
                name: "apiendpoint",
                endpoint: configData.API_ENDPOINT
            }
        ]
    }
});

const routing = (
    <AppProvider>
        <Router>
            <Switch>
                <Route exact path="/" component={App} />
                <Route path="/product/:id" component={Product} />
                <Route path="/checkout" component={Checkout} />
                <Route path="/ordercomplete" component={PlacedOrder}/>
                <Route component={App} />
            </Switch>
        </Router>
    </AppProvider>
)

ReactDOM.render(routing, document.getElementById('root'));

serviceWorker.unregister();
