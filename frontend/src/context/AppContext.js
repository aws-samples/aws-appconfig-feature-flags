// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react'

const AppContext = React.createContext({
    cart: {itemCount: 0},
    items: [],
    itemCache: 0,
    flags: [],
    flagCache: 0,
    clearCart: () => {},
    addItemToCart: (item, quantity) => {},
    addItems: (items) => {},
    cacheItem: (itemCache) => {},
    addFlags: (flags) => {},
    cacheFlag: (flagCache) => {}
});

export default AppContext