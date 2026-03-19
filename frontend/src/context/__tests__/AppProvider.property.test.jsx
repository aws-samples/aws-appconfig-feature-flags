// Feature: dependency-modernization, Property 2: Cart item count equals number of add operations
import React, { useContext, useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import AppProvider from '../AppProvider';
import AppContext from '../AppContext';

/**
 * Helper component that calls addItemToCart for each item in the provided
 * sequence, then reports the resulting cart length via a callback.
 */
function CartDriver({ sequence, onResult }) {
  const { addItemToCart, cart } = useContext(AppContext);

  useEffect(() => {
    sequence.forEach(({ id, quantity }) => {
      addItemToCart({ id }, quantity);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cart.items.length === sequence.length) {
      onResult(cart.items.length);
    }
  }, [cart.items.length, sequence.length, onResult]);

  return null;
}

describe('Property 2: Cart item count equals number of add operations', () => {
  const productArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    quantity: fc.integer({ min: 1, max: 99 }),
  });

  it('cart.items.length equals the number of addItemToCart calls', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { minLength: 1, maxLength: 20 }),
        (sequence) => {
          let result = null;

          act(() => {
            render(
              <AppProvider>
                <CartDriver
                  sequence={sequence}
                  onResult={(len) => { result = len; }}
                />
              </AppProvider>
            );
          });

          expect(result).toBe(sequence.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
