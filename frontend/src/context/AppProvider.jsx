// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react'
import AppContext from './AppContext'

const AppProvider = ({children}) => {

    const incrementItems = () => {
        setAppContext(prevState => {
            return {
                ...prevState,
                cart: {itemCount: prevState.cart.itemCount + 1}
            }
        })
    }

    const addItemToCart = (item, quantity) => {
        setAppContext(prevState => {
            var newItems = Object.assign({}, prevState)
            newItems.cart.items.push({id: item.id, quantity: quantity})
            return {
                ...prevState,
                cart: {items: newItems.cart.items}
            }
        })
    }

    const addItems = (items) => {
        setAppContext(prevState => {
            return {
                ...prevState,
                items
            }
        })
    }

    const cacheItem = (itemCache) => {
        setAppContext(prevState => {
            return {
                ...prevState,
                itemCache
            }
        })
    }

    const addFlags = (flags) => {
        setAppContext(prevState => {
            return {
                ...prevState,
                flags
            }
        })
    }

    const cacheFlag = (flagCache) => {
        setAppContext(prevState => {
            return {
                ...prevState,
                flagCache
            }
        })
    }

    const clearCart = () => {
        setAppContext(prevState => {
            return {
                ...prevState,
                cart: {items: []}
            }
        })
    }
    
    const appState = {
        cart: {items: []},
        items: [],
        itemCache: 0,
        flags: [],
        flagCache: 0,
        addItemToCart,
        incrementItems,
        addItems,
        cacheItem,
        addFlags,
        cacheFlag,
        clearCart
    }

    const [appContext, setAppContext] = useState(appState)

    return (
        <AppContext.Provider value={appContext}>
            {children}
        </AppContext.Provider>
    )
}

export default AppProvider