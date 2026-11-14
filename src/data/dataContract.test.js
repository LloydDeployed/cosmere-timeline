import books from './books.json';
import shards from './shards.json';
import systems from './systemsData.json';
import events from './timelineEvents.json';
import {
  normalizeCanonicalData,
  normalizeTimelineDate,
  validateCanonicalData,
} from './dataContract';

describe('timeline data contract', () => {
  test('loads and validates every canonical dataset', () => {
    const canonical = normalizeCanonicalData({ books, shards, systems, events });

    expect(() => validateCanonicalData(canonical)).not.toThrow();
    expect(canonical.events).toHaveLength(events.length);
    expect(canonical.systems).toHaveLength(Object.keys(systems).length);
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
