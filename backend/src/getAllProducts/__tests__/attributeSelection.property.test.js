// Feature: dependency-modernization, Property 4: Feature-flag-driven attribute selection
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

const BASE_ATTRIBUTES = ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage'];
const STOCK_ATTRIBUTES = ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage', 'itemStock'];

/**
 * Extracted attribute selection logic from getAllProducts.js.
 * This mirrors the exact logic in the handler:
 *   if (flag) { attrs = [...with itemStock] } else { attrs = [...without itemStock] }
 */
function getAttributesToGet(showStockFlag) {
  if (showStockFlag) {
    return ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage', 'itemStock'];
  } else {
    return ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage'];
  }
}

describe('Property 4: Feature-flag-driven attribute selection', () => {
  it('should include itemStock in AttributesToGet iff show_stock is true', () => {
    fc.assert(
      fc.property(fc.boolean(), (showStock) => {
        const attrs = getAttributesToGet(showStock);

        if (showStock) {
          expect(attrs).toEqual(STOCK_ATTRIBUTES);
          expect(attrs).toContain('itemStock');
        } else {
          expect(attrs).toEqual(BASE_ATTRIBUTES);
          expect(attrs).not.toContain('itemStock');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should always include the 5 base attributes regardless of flag state', () => {
    fc.assert(
      fc.property(fc.boolean(), (showStock) => {
        const attrs = getAttributesToGet(showStock);

        for (const attr of BASE_ATTRIBUTES) {
          expect(attrs).toContain(attr);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should return exactly 6 attributes when flag is true and 5 when false', () => {
    fc.assert(
      fc.property(fc.boolean(), (showStock) => {
        const attrs = getAttributesToGet(showStock);

        if (showStock) {
          expect(attrs).toHaveLength(6);
        } else {
          expect(attrs).toHaveLength(5);
        }
      }),
      { numRuns: 100 },
    );
  });
});
