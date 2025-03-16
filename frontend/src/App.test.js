import { render, screen } from '@testing-library/react';
import App from './App';

test('renders PostgreSQL Backup Manager title', () => {
  render(<App />);
  const titleElement = screen.getByText(/PostgreSQL Backup Manager/i);
  expect(titleElement).toBeInTheDocument();
}); 