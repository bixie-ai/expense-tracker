import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FooterLinks } from '../components/FooterLinks';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FooterLinks', () => {
  describe('social links', () => {
    it('renders LinkedIn link with target="_blank" and rel attributes', () => {
      renderWithRouter(<FooterLinks />);
      const link = screen.getByLabelText('LinkedIn');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/erick-boyzo-258023a1/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders GitHub link with target="_blank" and rel attributes', () => {
      renderWithRouter(<FooterLinks />);
      const link = screen.getByLabelText('GitHub');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://github.com/erickboyzo');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders Source Code link with target="_blank" and rel attributes', () => {
      renderWithRouter(<FooterLinks />);
      const link = screen.getByLabelText('Source Code');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://github.com/erickboyzo/expense-tracker');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders all three social links', () => {
      renderWithRouter(<FooterLinks />);
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
      expect(screen.getByLabelText('Source Code')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('renders Dashboard navigation link with correct path', () => {
      renderWithRouter(<FooterLinks />);
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders Settings navigation link with correct path', () => {
      renderWithRouter(<FooterLinks />);
      const link = screen.getByRole('link', { name: 'Settings' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/settings');
    });

    it('does not open navigation links in a new tab', () => {
      renderWithRouter(<FooterLinks />);
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });

  describe('custom props', () => {
    it('renders custom navigation links when provided', () => {
      const customNavLinks = [
        { path: '/reports', label: 'Reports' },
        { path: '/help', label: 'Help' },
      ];
      renderWithRouter(<FooterLinks navLinks={customNavLinks} />);
      expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/reports');
      expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help');
      expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    });

    it('renders custom social links when provided', () => {
      const customSocialLinks = [
        { href: 'https://twitter.com/test', icon: <span>X</span>, label: 'Twitter' },
      ];
      renderWithRouter(<FooterLinks socialLinks={customSocialLinks} />);
      const link = screen.getByLabelText('Twitter');
      expect(link).toHaveAttribute('href', 'https://twitter.com/test');
      expect(link).toHaveAttribute('target', '_blank');
      expect(screen.queryByLabelText('LinkedIn')).not.toBeInTheDocument();
    });

    it('renders correct number of links based on provided props', () => {
      const navLinks = [{ path: '/a', label: 'A' }];
      const socialLinks = [
        { href: 'https://example.com', icon: <span />, label: 'Example' },
        { href: 'https://test.com', icon: <span />, label: 'Test' },
      ];
      renderWithRouter(<FooterLinks navLinks={navLinks} socialLinks={socialLinks} />);
      const allLinks = screen.getAllByRole('link');
      expect(allLinks).toHaveLength(3);
    });
  });

  describe('accessibility', () => {
    it('renders as a footer element with contentinfo role', () => {
      const { container } = renderWithRouter(<FooterLinks />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('role', 'contentinfo');
    });

    it('has an accessible navigation landmark', () => {
      renderWithRouter(<FooterLinks />);
      const nav = screen.getByRole('navigation', { name: 'Footer navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('social links have accessible aria-labels', () => {
      renderWithRouter(<FooterLinks />);
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
      expect(screen.getByLabelText('Source Code')).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('renders copyright text', () => {
      renderWithRouter(<FooterLinks />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} Expense Tracker`)).toBeInTheDocument();
    });

    it('renders the total default link count (2 nav + 3 social)', () => {
      renderWithRouter(<FooterLinks />);
      const allLinks = screen.getAllByRole('link');
      expect(allLinks).toHaveLength(5);
    });
  });
});
