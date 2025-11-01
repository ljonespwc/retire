/**
 * Vitest test setup file
 * Runs before each test file
 */

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { config } from 'dotenv';

// Load .env.local for tests
config({ path: '.env.local' });

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest matchers with jest-dom
declare global {
  namespace Vi {
    interface Matchers<R = any> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toHaveClass(...classNames: string[]): R;
    }
  }
}
