import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app header', () => {
  render(<App />);
  expect(screen.getByText(/DJ Blaze's Setlist Sleuth/i)).toBeInTheDocument();
});
