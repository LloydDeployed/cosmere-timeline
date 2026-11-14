import books from './books.json';
import shards from './shards.json';
import systems from './systemsData.json';
import events from './timelineEvents.json';
import worldhoppers from './worldhoppers.json';
import {
  normalizeCanonicalData,
  normalizeTimelineDate,
  validateCanonicalData,
} from './dataContract';

describe('timeline data contract', () => {
  test('loads and validates every canonical dataset', () => {
    const canonical = normalizeCanonicalData({ books, shards, systems, events, worldhoppers });

    expect(() => validateCanonicalData(canonical)).not.toThrow();
    expect(canonical.events).toHaveLength(events.length);
    expect(canonical.systems).toHaveLength(Object.keys(systems).length);
    expect(canonical.worldhoppers).toHaveLength(worldhoppers.length);
    expect(
      canonical.events.find((event) =>
        event.description.includes('extremely rough estimate')
      ).date
    ).toMatchObject({ precision: 'approximate', confidence: 'low' });
  });

  test('reports an actionable path for invalid data', () => {
    const canonical = normalizeCanonicalData({ books, shards, systems, events });
    canonical.events[0].location.system = 'missing-system';

    expect(() => validateCanonicalData(canonical)).toThrow(
      /events\[0\]\.location\.system.*missing-system/
    );
  });

  test('keeps persisted event IDs stable when events are reordered', () => {
    const canonical = normalizeCanonicalData({ books, shards, systems, events });
    const reordered = normalizeCanonicalData({
      books,
      shards,
      systems,
      events: [...events].reverse(),
    });

    expect(reordered.events.map((event) => event.id)).toEqual(
      canonical.events.map((event) => event.id).reverse()
    );
  });

  test('rejects duplicate event IDs with an actionable path', () => {
    const canonical = normalizeCanonicalData({ books, shards, systems, events });
    canonical.events[1].id = canonical.events[0].id;

    expect(() => validateCanonicalData(canonical)).toThrow(
      /events\[1\]\.id duplicates "event-001"/
    );
  });

  test('normalizes optional canonical character tags without inferring description text', () => {
    const taggedEvents = [
      { ...events[0], characters: ['Hoid', '  Kaladin  '] },
      { ...events[1], events: 'Vin enters Kredik Shaw' },
    ];
    const canonical = normalizeCanonicalData({ books, shards, systems, events: taggedEvents });

    expect(canonical.events[0].characters).toEqual(['Hoid', 'Kaladin']);
    expect(canonical.events[1].characters).toEqual([]);
    expect(() => validateCanonicalData(canonical)).not.toThrow();
  });

  test('normalizes sourced worldhopper appearances and derives event character tags', () => {
    const worldhoppers = [
      {
        id: 'hoid',
        name: 'Hoid',
        color: '#f4c36a',
        appearances: [
          { eventId: events[0].id, source: 'Primary source A' },
          {
            eventId: events[1].id,
            source: { label: 'Primary source B' },
            note: 'Story-level anchor only.',
          },
        ],
      },
    ];
    const canonical = normalizeCanonicalData({
      books,
      shards,
      systems,
      events,
      worldhoppers,
    });

    expect(canonical.worldhoppers[0]).toMatchObject({
      id: 'hoid',
      name: 'Hoid',
      appearances: [
        { eventId: events[0].id, source: { label: 'Primary source A' } },
        { eventId: events[1].id, note: 'Story-level anchor only.' },
      ],
    });
    expect(canonical.events[0].characters).toContain('Hoid');
    expect(canonical.events[1].characters).toContain('Hoid');
    expect(() => validateCanonicalData(canonical)).not.toThrow();
  });

  test('rejects an appearance that references an unknown event', () => {
    const canonical = normalizeCanonicalData({
      books,
      shards,
      systems,
      events,
      worldhoppers: [
        {
          id: 'hoid',
          name: 'Hoid',
          color: '#f4c36a',
          appearances: [
            { eventId: events[0].id, source: 'Primary source A' },
            { eventId: 'missing-event', source: 'Primary source B' },
          ],
        },
      ],
    });

    expect(() => validateCanonicalData(canonical)).toThrow(
      /worldhoppers\[0\]\.appearances\[1\]\.eventId.*missing-event/
    );
  });

  test('models point dates without blocking ranges or ordering-only dates', () => {
    expect(normalizeTimelineDate(42)).toEqual({
      kind: 'point',
      value: 42,
      precision: 'unknown',
      confidence: 'unknown',
    });

    expect(
      normalizeTimelineDate({
        kind: 'point',
        value: 43,
        precision: 'exact',
        confidence: 'high',
      })
    ).toMatchObject({ kind: 'point', value: 43, precision: 'exact' });

    expect(
      normalizeTimelineDate({
        kind: 'range',
        start: 10,
        end: 20,
        precision: 'approximate',
        confidence: 'low',
      })
    ).toMatchObject({ kind: 'range', start: 10, end: 20 });

    expect(
      normalizeTimelineDate({
        kind: 'order',
        after: 'first-event',
        before: 'third-event',
      })
    ).toMatchObject({ kind: 'order' });
  });
});
