import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  // App shows "Welcome to Setlist Sleuth" before auth
  expect(screen.getByText(/Welcome to Setlist Sleuth/i)).toBeInTheDocument();
});
