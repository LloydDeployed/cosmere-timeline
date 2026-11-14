import {
  countSpoilerMetadata,
  createEmptyFilters,
  eventMatchesFilters,
  filterTimelineEvents,
  getFilterOptions,
} from './timelineFilters';

const events = [
  {
    id: 'stormlight',
    description: 'Kaladin speaks the Fourth Ideal',
    location: { system: 'Roshar' },
    relatedWorks: ['Rhythm of War'],
    characters: ['Kaladin'],
    shards: ['Honor'],
    spoilerScope: { books: ['Rhythm of War'], series: ['The Stormlight Archive'] },
  },
  {
    id: 'mistborn',
    description: 'The Ascendant Warrior enters Kredik Shaw',
    location: { system: 'Scadrial' },
    relatedWorks: ['The Final Empire'],
    characters: ['Vin'],
    shards: ['Preservation'],
    spoilerScope: { books: [], series: [] },
  },
];

describe('timeline filters', () => {
  test('matches only structured fields for work, character, Shard, and system', () => {
    expect(
      eventMatchesFilters(events[0], {
        ...createEmptyFilters(),
        work: 'Rhythm of War',
        character: 'Kaladin',
        shard: 'Honor',
        system: 'Roshar',
      })
    ).toBe(true);
    expect(eventMatchesFilters(events[1], { ...createEmptyFilters(), character: 'Warrior' })).toBe(
      false
    );
  });

  test('searches story descriptions separately and composes every active predicate', () => {
    expect(filterTimelineEvents(events, { ...createEmptyFilters(), storyText: 'kredik' })).toEqual([
      events[1],
    ]);
    expect(
      filterTimelineEvents(events, {
        ...createEmptyFilters(),
        storyText: 'ideal',
        shard: 'Preservation',
      })
    ).toEqual([]);
  });

  test('hides only events with explicit spoiler metadata', () => {
    expect(
      filterTimelineEvents(events, { ...createEmptyFilters(), hideScopedSpoilers: true })
    ).toEqual([events[1]]);
    expect(countSpoilerMetadata(events)).toEqual({ scoped: 1, unscoped: 1 });
  });

  test('derives sorted, unique options from canonical event fields', () => {
    expect(getFilterOptions(events)).toEqual({
      works: ['Rhythm of War', 'The Final Empire'],
      characters: ['Kaladin', 'Vin'],
      shards: ['Honor', 'Preservation'],
      systems: ['Roshar', 'Scadrial'],
    });
  });
});
