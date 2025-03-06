import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(className: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toBeEmpty(): R;
      toBeChecked(): R;
      toHaveValue(value: string | string[] | number): R;
      toHaveFocus(): R;
    }
  }
} 