// Behavioral verification: confirm migration patterns are in place
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readSrc(relativePath) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

describe('Frontend migration verification', () => {
  describe('index.jsx — React 18 + Router v6', () => {
    const src = readSrc('index.jsx');

    it('uses createRoot from react-dom/client', () => {
      expect(src).toMatch(/from\s+['"]react-dom\/client['"]/);
      expect(src).toMatch(/createRoot/);
    });

    it('uses Routes instead of Switch', () => {
      expect(src).toMatch(/Routes/);
      expect(src).not.toMatch(/Switch/);
    });

    it('uses element prop instead of component prop on Route', () => {
      expect(src).toMatch(/element=\{/);
      expect(src).not.toMatch(/component=\{/);
    });
  });

  describe('Product.jsx — useParams hook', () => {
    const src = readSrc('pages/Product.jsx');

    it('imports useParams from react-router-dom', () => {
      expect(src).toMatch(/useParams/);
      expect(src).toMatch(/from\s+['"]react-router-dom['"]/);
    });

    it('does not use props.match', () => {
      expect(src).not.toMatch(/props\.match/);
    });
  });

  describe('Checkout.jsx — useNavigate hook', () => {
    const src = readSrc('pages/Checkout.jsx');

    it('imports useNavigate from react-router-dom', () => {
      expect(src).toMatch(/useNavigate/);
      expect(src).toMatch(/from\s+['"]react-router-dom['"]/);
    });

    it('does not use props.history', () => {
      expect(src).not.toMatch(/props\.history/);
    });
  });

  describe('InitState.jsx — Amplify v6 modular API', () => {
    const src = readSrc('pages/InitState.jsx');

    it('imports get from aws-amplify/api', () => {
      expect(src).toMatch(/from\s+['"]aws-amplify\/api['"]/);
      expect(src).toMatch(/\bget\b/);
    });

    it('does not use legacy API.get pattern', () => {
      expect(src).not.toMatch(/API\.get\s*\(/);
    });
  });
});
