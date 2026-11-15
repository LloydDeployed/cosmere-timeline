import {
  applyViewportBoundDraft,
  clampViewport,
  createTimeProjection,
  createTimelineViewModel,
  panViewport,
  zoomViewport,
} from './timelineProjection';

const bounds = { start: -100, end: 900 };

describe('timeline viewport math', () => {
  test('builds explicit fixed-width gaps between linear activity clusters', () => {
    const projection = createTimeProjection({
      viewport: { start: 0, end: 10000 },
      eventDates: [0, 100, 9000, 10000],
      width: 1000,
      mode: 'overview',
      gapThreshold: 1000,
      gapWidth: 100,
    });

    expect(projection.mode).toBe('overview');
    expect(projection.gaps).toHaveLength(1);
    expect(projection.gaps[0]).toMatchObject({ start: 100, end: 9000, duration: 8900 });
    expect(projection.gaps[0].x2 - projection.gaps[0].x1).toBeCloseTo(100);
    expect(projection.project(0)).toBe(0);
    expect(projection.project(100)).toBeCloseTo(projection.gaps[0].x1);
    expect(projection.project(4550)).toBeCloseTo(
      (projection.gaps[0].x1 + projection.gaps[0].x2) / 2
    );
    expect(projection.project(9000)).toBeCloseTo(projection.gaps[0].x2);
    expect(projection.project(10000)).toBe(1000);
  });

  test('removes projected ticks that would overlap inside condensed gaps', () => {
    const model = createTimelineViewModel({
      systems: [{ id: 'Roshar', name: 'Roshar', color: '#68a7d3' }],
      events: [0, 100, 9000, 10000].map((value) => ({
        id: `event-${value}`,
        location: { system: 'Roshar' },
        date: { kind: 'point', value, precision: 'exact', confidence: 'high' },
        description: `Event at ${value}`,
      })),
      activeSystemIds: ['Roshar'],
      viewport: { start: 0, end: 10000 },
      width: 1000,
      projectionMode: 'overview',
    });

    const spacings = model.ticks.slice(1).map((tick, index) => (
      tick.x - model.ticks[index].x
    ));
    expect(spacings.every((spacing) => spacing >= 60)).toBe(true);
    expect(model.ticks.some(({ year }) => year > 100 && year < 9000)).toBe(false);
  });

  test('keeps Roshar years proportional inside the 6450–7958 condensed span', () => {
    const projection = createTimeProjection({
      viewport: { start: 6000, end: 8111 },
      eventDates: [6000, 6400, 6450, 7958, 8111],
      width: 800,
      mode: 'overview',
    });
    const gap = projection.gaps.find(({ start, end }) => start === 6450 && end === 7958);

    expect(gap).toMatchObject({ duration: 1508 });
    expect(projection.project(6450)).toBe(gap.x1);
    expect(projection.project(7958)).toBe(gap.x2);
    expect(projection.project(7000)).toBeGreaterThan(gap.x1);
    expect(projection.project(7000)).toBeLessThan(gap.x2);
    expect(projection.project(8000)).toBeGreaterThan(gap.x2);
  });

  test('linear projection preserves the original chronology coordinates', () => {
    const projection = createTimeProjection({
      viewport: { start: 0, end: 10000 },
      eventDates: [0, 100, 9000, 10000],
      width: 1000,
      mode: 'linear',
    });

    expect(projection.breaks).toEqual([]);
    expect(projection.project(2500)).toBe(250);
  });

  test('uses linear chronology by default for detailed views', () => {
    const projection = createTimeProjection({
      viewport: { start: 0, end: 10000 },
      eventDates: [0, 100, 9000, 10000],
      width: 1000,
    });

    expect(projection.mode).toBe('linear');
    expect(projection.gaps).toEqual([]);
    expect(projection.project(4550)).toBe(455);
  });

  test('clamps reversed, undersized, and out-of-bounds viewports', () => {
    expect(clampViewport({ start: 950, end: -200 }, bounds, 100)).toEqual(bounds);
    expect(clampViewport({ start: -200, end: 0 }, bounds, 100)).toEqual({
      start: -100,
      end: 100,
    });
    expect(clampViewport({ start: 850, end: 870 }, bounds, 100)).toEqual({
      start: 800,
      end: 900,
    });
  });

  test('zooms around an anchor and will not exceed chronology bounds', () => {
    expect(zoomViewport({ start: 0, end: 800 }, 0.5, 200, bounds, 100)).toEqual({
      start: 100,
      end: 500,
    });
    expect(zoomViewport(bounds, 2, 400, bounds, 100)).toEqual(bounds);
  });

  test('pans without changing span or escaping chronology bounds', () => {
    expect(panViewport({ start: 0, end: 400 }, 250, bounds)).toEqual({
      start: 250,
      end: 650,
    });
    expect(panViewport({ start: 0, end: 400 }, -500, bounds)).toEqual({
      start: -100,
      end: 300,
    });
  });

  test('applies complete whole-year drafts without mutating invalid viewports', () => {
    const viewport = { start: 100, end: 500 };

    expect(applyViewportBoundDraft(viewport, 'end', '700', bounds, 25)).toEqual({
      viewport: { start: 100, end: 700 },
      error: null,
    });
    expect(applyViewportBoundDraft(viewport, 'end', '1', bounds, 25)).toEqual({
      viewport,
      error: 'Start and end must be at least 25 years apart.',
    });
    expect(applyViewportBoundDraft(viewport, 'start', '12.5', bounds, 25)).toEqual({
      viewport,
      error: 'Enter a whole year.',
    });
    expect(applyViewportBoundDraft(viewport, 'start', '', bounds, 25)).toEqual({
      viewport,
      error: 'Enter a whole year.',
    });
  });
});

describe('timeline view model', () => {
  const systems = [
    { id: 'Roshar', name: 'Roshar', color: '#68a7d3' },
    { id: 'Sel', name: 'Sel', color: '#9ac56b' },
  ];
  const events = [
    {
      id: 'exact',
      location: { system: 'Roshar' },
      date: { kind: 'point', value: 100, precision: 'exact', confidence: 'high' },
      description: 'Exact event',
    },
    {
      id: 'approximate',
      location: { system: 'Roshar' },
      date: {
        kind: 'point',
        value: 200,
        precision: 'approximate',
        confidence: 'low',
      },
      description: 'Approximate event',
    },
    {
      id: 'range',
      location: { system: 'Roshar' },
      date: {
        kind: 'range',
        start: 300,
        end: 500,
        precision: 'approximate',
        confidence: 'medium',
      },
      description: 'Range event',
    },
    {
      id: 'ordered',
      location: { system: 'Roshar' },
      date: { kind: 'order', after: 'range', precision: 'unknown', confidence: 'low' },
      description: 'Only ordered event',
    },
    {
      id: 'sel-event',
      location: { system: 'Sel' },
      date: { kind: 'point', value: 400, precision: 'exact', confidence: 'high' },
      description: 'Hidden with lane',
    },
  ];

  test('projects enabled lanes deterministically into plot coordinates', () => {
    const model = createTimelineViewModel({
      systems,
      events,
      activeSystemIds: ['Roshar'],
      viewport: { start: 0, end: 800 },
      width: 1000,
    });

    expect(model.lanes).toHaveLength(1);
    expect(model.lanes[0].id).toBe('Roshar');
    expect(model.lanes[0].events.map(({ id }) => id)).toEqual([
      'exact',
      'approximate',
      'range',
    ]);
    expect(model.lanes[0].events[0].x).toBeCloseTo(250);
    expect(model.lanes[0].events[1]).toMatchObject({ uncertain: true });
  });

  test('renders ranges as spans and keeps order-only events off the numeric axis', () => {
    const model = createTimelineViewModel({
      systems,
      events,
      activeSystemIds: ['Roshar'],
      viewport: { start: 0, end: 800 },
      width: 1000,
    });
    const lane = model.lanes[0];
    const range = lane.events.find(({ id }) => id === 'range');

    expect(range).toMatchObject({ kind: 'range', x: 450, x2: 650 });
    expect(lane.orderOnlyEvents).toEqual([
      expect.objectContaining({ id: 'ordered', x: null, dateLabel: 'After range' }),
    ]);
  });

  test('clips out-of-range numeric events without dropping relative-order notes', () => {
    const model = createTimelineViewModel({
      systems,
      events,
      activeSystemIds: ['Roshar'],
      viewport: { start: 0, end: 250 },
      width: 1000,
    });

    expect(model.lanes[0].events.map(({ id }) => id)).toEqual(['exact', 'approximate']);
    expect(model.lanes[0].orderOnlyEvents).toHaveLength(1);
  });
});
