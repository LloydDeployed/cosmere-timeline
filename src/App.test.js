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
    const viewport = screen.getByRole('group', { name: /cosmere chronology/i });
    const event = within(viewport).getByRole('button', {
      name: /-1050.*adonalsium creates roshar/i,
    });

    fireEvent.click(event);

    expect(screen.getByRole('status', { name: /selected event details/i })).toHaveTextContent('-1050');
    expect(screen.getByRole('status', { name: /selected event details/i })).toHaveTextContent('Adonalsium creates Roshar');
    expect(event).toHaveAttribute('aria-pressed', 'true');
  });

  test('dismisses selected event details with an explicit close control', () => {
    render(<App />);
    const event = screen.getByRole('button', {
      name: /-1050.*adonalsium creates roshar/i,
    });

    fireEvent.click(event);
    fireEvent.click(screen.getByRole('button', { name: /close event details/i }));

    expect(screen.getByRole('status', { name: /selected event details/i })).toHaveTextContent(
      /select an event marker/i
    );
    expect(event).toHaveAttribute('aria-pressed', 'false');
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

  test('groups pan and zoom controls and presents whole-year viewport bounds', () => {
    render(<App />);

    const panControls = screen.getByRole('group', { name: /pan timeline/i });
    expect(within(panControls).getByRole('button', { name: /pan earlier/i })).toBeInTheDocument();
    expect(within(panControls).getByRole('button', { name: /pan later/i })).toBeInTheDocument();

    const zoomControls = screen.getByRole('group', { name: /zoom timeline/i });
    fireEvent.click(within(zoomControls).getByRole('button', { name: /zoom in/i }));

    expect(screen.getByLabelText(/start year/i).value).toMatch(/^-?\d+$/);
    expect(screen.getByLabelText(/end year/i).value).toMatch(/^-?\d+$/);
  });

  test('keeps temporary invalid year edits from resetting the viewport', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    const start = screen.getByLabelText(/start year/i);
    const end = screen.getByLabelText(/end year/i);
    const zoomedStart = start.value;

    fireEvent.focus(end);
    fireEvent.change(end, { target: { value: '1' } });

    expect(start).toHaveValue(Number(zoomedStart));
    expect(end).toHaveValue(1);

    fireEvent.blur(end);
    expect(start).toHaveValue(Number(zoomedStart));
    expect(end).toHaveAttribute('aria-invalid', 'true');
  });

  test('leaves ordinary wheel scrolling alone and requires a modifier for wheel zoom', () => {
    render(<App />);
    const viewport = screen.getByRole('group', { name: /cosmere chronology/i });
    const start = screen.getByLabelText(/start year/i);
    const initialStart = start.value;

    fireEvent.wheel(viewport, { deltaY: -100 });
    expect(start).toHaveValue(Number(initialStart));

    fireEvent.wheel(viewport, { deltaY: -100, ctrlKey: true });
    expect(Number(start.value)).toBeGreaterThan(Number(initialStart));
  });

  test('toggles condensed chronology and exposes visible break markers', () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll('[data-testid="timeline-break"]').length).toBeGreaterThan(0);
    const linearToggle = screen.getByRole('button', { name: /use linear chronology/i });
    fireEvent.click(linearToggle);

    expect(linearToggle).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('[data-testid="timeline-break"]')).toHaveLength(0);
    expect(screen.getByText(/chronology is shown at a linear scale/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /condense quiet spans/i }));
    expect(container.querySelectorAll('[data-testid="timeline-break"]').length).toBeGreaterThan(0);
  });

  test('filters story text, reports visible results, and clears filters without resetting viewport', () => {
    render(<App />);
    const start = screen.getByLabelText(/start year/i);
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    const zoomedStart = start.value;

    fireEvent.change(screen.getByRole('searchbox', { name: /story text/i }), {
      target: { value: 'The Recreance' },
    });

    expect(screen.getByRole('status', { name: /filter results/i })).toHaveTextContent(
      /1 matching event/i
    );
    expect(screen.getByRole('button', { name: /the recreance/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(screen.getByRole('searchbox', { name: /story text/i })).toHaveValue('');
    expect(start).toHaveValue(Number(zoomedStart));
  });

  test('composes work filters with active lanes and clears a hidden selection', () => {
    render(<App />);
    const event = screen.getByRole('button', { name: /-1050.*adonalsium creates roshar/i });
    fireEvent.click(event);
    expect(screen.getByRole('status', { name: /selected event details/i })).toHaveTextContent('Adonalsium creates Roshar');

    fireEvent.click(screen.getByRole('button', { name: 'Cosmere' }));

    expect(screen.queryByRole('button', { name: /adonalsium creates roshar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: /selected event details/i })).toHaveTextContent(/select an event marker/i);
  });

  test('derives character filters from sourced appearances and discloses absent spoiler metadata', () => {
    render(<App />);

    expect(screen.getByLabelText(/character/i)).toBeEnabled();
    expect(screen.getByRole('option', { name: 'Hoid' })).toBeInTheDocument();
    expect(screen.getByLabelText(/hide events with explicit spoiler metadata/i)).toBeDisabled();
    expect(screen.getByText(/events lack explicit spoiler metadata/i)).toBeInTheDocument();
  });

  test('toggles individual travel paths and never bridges filtered-out appearances', () => {
    const { container } = render(<App />);
    const hoidToggle = screen.getByRole('button', { name: /hoid travel path/i });

    expect(hoidToggle).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('[data-worldhopper="hoid"]')).toHaveLength(3);
    expect(container.querySelector('[data-worldhopper="hoid"]')).toHaveAttribute('stroke-width', '2.5');

    fireEvent.click(hoidToggle);
    expect(hoidToggle).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('[data-worldhopper="hoid"]')).toHaveLength(0);

    fireEvent.click(hoidToggle);
    fireEvent.change(screen.getByRole('searchbox', { name: /story text/i }), {
      target: { value: 'Pahn Kal Rebellion' },
    });
    expect(container.querySelectorAll('[data-worldhopper="hoid"]')).toHaveLength(0);
  });

  test('optionally hides lanes without events in the current viewport', () => {
    render(<App />);
    expect(screen.getByTestId('lane-Yolen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    fireEvent.click(screen.getByRole('checkbox', {
      name: /hide lanes with no events in the current view/i,
    }));

    expect(screen.queryByTestId('lane-Yolen')).not.toBeInTheDocument();
    expect(screen.getByTestId('lane-Roshar')).toBeInTheDocument();
  });
});
