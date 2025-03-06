import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  test('renders logo and copyright text', () => {
    render(<Footer />);
    
    // Check if logo text is rendered
    expect(screen.getByText('Awakened AI')).toBeInTheDocument();
    
    // Check if copyright text is rendered with current year
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${currentYear} Awakened AI`))).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<Footer />);
    
    // Check if footer links are rendered
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
}); 