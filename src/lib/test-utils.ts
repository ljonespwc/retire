/**
 * Test utilities for React component testing
 */

import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement, ReactNode } from 'react';

/**
 * Custom render function that wraps components with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Wrapper component for providers (can be extended later)
  function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(React.Fragment, null, children);
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Re-export everything from testing library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
