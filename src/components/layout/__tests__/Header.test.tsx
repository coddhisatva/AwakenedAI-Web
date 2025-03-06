import { render, screen } from '@testing-library/react';
import { Header } from '../Header';
import { AuthContext } from '@/lib/auth';

// Mock the useAuth hook
jest.mock('@/lib/auth', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useAuth: jest.fn(),
}));

describe('Header Component', () => {
  test('renders logo and navigation links', () => {
    // Mock auth context with no user (logged out state)
    const mockUseAuth = jest.requireMock('@/lib/auth').useAuth;
    mockUseAuth.mockReturnValue({ user: null });

    render(<Header />);
    
    // Check if logo text is rendered
    expect(screen.getByText('Awakened AI')).toBeInTheDocument();
    
    // Check if navigation links are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    
    // Verify sign in/up buttons are visible when not logged in
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  test('shows user dropdown when logged in', () => {
    // Mock auth context with a logged in user
    const mockUseAuth = jest.requireMock('@/lib/auth').useAuth;
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      signOut: jest.fn(),
    });

    render(<Header />);
    
    // Logo and navigation should still be present
    expect(screen.getByText('Awakened AI')).toBeInTheDocument();
    
    // Sign in/up buttons should not be visible
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    
    // User avatar should be visible with fallback containing first letter of email
    const avatar = screen.getByText('t');
    expect(avatar).toBeInTheDocument();
  });
}); 