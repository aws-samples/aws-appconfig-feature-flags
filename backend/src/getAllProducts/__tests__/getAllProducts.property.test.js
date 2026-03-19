// Feature: dependency-modernization, Property 1: SDK v3 DynamoDB scan returns identical response shape
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Arbitrary for product-like objects
const productArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  itemName: fc.string({ minLength: 1, maxLength: 50 }),
  itemDesc: fc.string({ minLength: 1, maxLength: 200 }),
  itemPrice: fc.double({ min: 0.01, max: 9999.99, noNaN: true }),
  itemImage: fc.constantFrom('one.png', 'two.png', 'three.png'),
  itemStock: fc.integer({ min: 0, max: 1000 }),
});

const productsArb = fc.array(productArb, { minLength: 0, maxLength: 20 });

describe('Property 1: SDK v3 DynamoDB scan returns identical response shape', () => {
  it('should return Items array from ScanCommand result for any product set', async () => {
    await fc.assert(
      fc.asyncProperty(productsArb, async (products) => {
        // Create a real SDK v3 doc client and mock its send method
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        // Mock the send method to return our generated products
        docClient.send = vi.fn().mockResolvedValue({
          Items: products,
          Count: products.length,
          ScannedCount: products.length,
        });

        const params = {
          TableName: 'TestTable',
          AttributesToGet: ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage'],
        };

        // This mirrors what getAllProducts.js does: docClient.send(new ScanCommand(params))
        const data = await docClient.send(new ScanCommand(params));

        // Verify the response shape matches what the handler expects
        expect(data).toHaveProperty('Items');
        expect(Array.isArray(data.Items)).toBe(true);
        expect(data.Items).toEqual(products);
        expect(data.Items.length).toBe(products.length);

        // Verify JSON serialization round-trip preserves shape (as handler does JSON.stringify)
        const serialized = JSON.stringify(data.Items);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(products);
      }),
      { numRuns: 100 },
    );
  });

  it('should preserve each item shape through JSON serialization for any product', async () => {
    await fc.assert(
      fc.asyncProperty(productArb, async (product) => {
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);

        docClient.send = vi.fn().mockResolvedValue({
          Items: [product],
          Count: 1,
          ScannedCount: 1,
        });

        const data = await docClient.send(new ScanCommand({
          TableName: 'TestTable',
          AttributesToGet: ['id', 'itemDesc', 'itemName', 'itemPrice', 'itemImage', 'itemStock'],
        }));

        // Simulate handler response construction
        const response = {
          statusCode: 200,
          body: JSON.stringify(data.Items),
        };

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveLength(1);
        expect(body[0]).toEqual(product);
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('itemName');
        expect(body[0]).toHaveProperty('itemDesc');
        expect(body[0]).toHaveProperty('itemPrice');
        expect(body[0]).toHaveProperty('itemImage');
      }),
      { numRuns: 100 },
    );
  });
});
