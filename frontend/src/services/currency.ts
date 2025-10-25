// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CurrencyService } from '../types';

class CurrencyServiceImpl implements CurrencyService {
    private readonly locale = 'en-US';
    private readonly currency = 'USD';

    formatPrice(price: number): string {
        return new Intl.NumberFormat(this.locale, {
            style: "currency",
            currency: this.currency,
        }).format(price);
    }

    getCurrencySymbol(): string {
        return '$';
    }
}

export const currencyService = new CurrencyServiceImpl();

// Export the legacy function for backward compatibility
export const formatCurrency = (number: number): string => {
    return currencyService.formatPrice(number);
};