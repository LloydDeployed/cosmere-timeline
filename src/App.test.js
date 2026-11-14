import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the timeline controls and toggles a system lane', () => {
  render(<App />);

  expect(
    screen.getByRole('heading', { name: /cosmere interactive timeline/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/start year/i)).toHaveValue(-1100);

  const rosharButton = screen.getByRole('button', { name: 'Roshar' });
  expect(rosharButton).toHaveClass('active');
  fireEvent.click(rosharButton);
  expect(rosharButton).toHaveClass('inactive');
});
