import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

describe('timeline viewport', () => {
  test('renders one SVG and removes disabled lanes from it', () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(screen.getByTestId('lane-Roshar')).toBeInTheDocument();

    const rosharButton = screen.getByRole('button', { name: 'Roshar' });
    expect(rosharButton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(rosharButton);

    expect(rosharButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByTestId('lane-Roshar')).not.toBeInTheDocument();
  });

  test('selects an event and exposes its date and description accessibly', () => {
    render(<App />);
    const viewport = screen.getByRole('img', { name: /cosmere chronology/i });
    const event = within(viewport).getByRole('button', {
      name: /-1050.*adonalsium creates roshar/i,
    });

    fireEvent.click(event);

    expect(screen.getByRole('status')).toHaveTextContent('-1050');
    expect(screen.getByRole('status')).toHaveTextContent('Adonalsium creates Roshar');
    expect(event).toHaveAttribute('aria-pressed', 'true');
  });

  test('zooms and pans using bounded viewport controls', () => {
    render(<App />);
    const start = screen.getByLabelText(/start year/i);
    const end = screen.getByLabelText(/end year/i);

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(Number(start.value)).toBeGreaterThan(-1100);
    expect(Number(end.value)).toBeLessThan(16050);

    const zoomedStart = Number(start.value);
    fireEvent.click(screen.getByRole('button', { name: /pan earlier/i }));
    expect(Number(start.value)).toBeLessThan(zoomedStart);
  });
});
