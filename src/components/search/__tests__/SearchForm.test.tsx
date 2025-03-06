import { render, screen, fireEvent } from '@testing-library/react';
import { SearchForm } from '../SearchForm';

// Mock the useRouter hook
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SearchForm Component', () => {
  beforeEach(() => {
    // Clear mock before each test
    mockPush.mockClear();
  });

  test('renders with initial query', () => {
    render(<SearchForm initialQuery="test query" />);
    
    // Check if the input contains the initial query
    const input = screen.getByPlaceholderText('What would you like to know?') as HTMLInputElement;
    expect(input.value).toBe('test query');
    
    // Check if the search button is enabled
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeEnabled();
  });

  test('renders with empty query', () => {
    render(<SearchForm initialQuery="" />);
    
    // Check if the input is empty
    const input = screen.getByPlaceholderText('What would you like to know?') as HTMLInputElement;
    expect(input.value).toBe('');
    
    // Check if the search button is disabled
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeDisabled();
  });

  test('handles query change', () => {
    render(<SearchForm initialQuery="" />);
    
    // Get the input and update its value
    const input = screen.getByPlaceholderText('What would you like to know?');
    fireEvent.change(input, { target: { value: 'new query' } });
    
    // Check if the button is now enabled
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeEnabled();
  });

  test('submits search query', () => {
    render(<SearchForm initialQuery="test query" />);
    
    // Get the form and submit it
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // Check if the router.push was called with the correct URL
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
  });
}); 