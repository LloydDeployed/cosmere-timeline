import {
  deriveWorldhopperJourneys,
  projectWorldhopperPaths,
} from './timelineTravel';

const event = (id, system, year) => ({
  id,
  location: { system },
  date: { kind: 'point', value: year, precision: 'exact', confidence: 'high' },
});

const events = [
  event('sel', 'Sel', 10),
  event('scadrial', 'Scadrial', 20),
  event('roshar', 'Roshar', 30),
];

const worldhoppers = [
  {
    id: 'hoid',
    name: 'Hoid',
    color: '#f4c36a',
    appearances: [
      { eventId: 'sel', source: { label: 'Source A' } },
      { eventId: 'scadrial', source: { label: 'Source B' } },
      { eventId: 'roshar', source: { label: 'Source C' } },
    ],
  },
];

describe('worldhopper journey derivation', () => {
  test('derives canonical adjacent transitions from sourced appearances', () => {
    const [journey] = deriveWorldhopperJourneys({ worldhoppers, events });

    expect(journey.transitions).toEqual([
      expect.objectContaining({
        id: 'hoid:sel:scadrial',
        from: expect.objectContaining({ eventId: 'sel', systemId: 'Sel' }),
        to: expect.objectContaining({ eventId: 'scadrial', systemId: 'Scadrial' }),
      }),
      expect.objectContaining({
        id: 'hoid:scadrial:roshar',
        from: expect.objectContaining({ eventId: 'scadrial', systemId: 'Scadrial' }),
        to: expect.objectContaining({ eventId: 'roshar', systemId: 'Roshar' }),
      }),
    ]);
  });

  test('projects only canonical transitions whose endpoints remain visible', () => {
    const journeys = deriveWorldhopperJourneys({ worldhoppers, events });
    const allLanes = [
      { id: 'Sel', y: 100, events: [{ id: 'sel', x: 200 }] },
      { id: 'Scadrial', y: 200, events: [{ id: 'scadrial', x: 400 }] },
      { id: 'Roshar', y: 300, events: [{ id: 'roshar', x: 600 }] },
    ];

    expect(projectWorldhopperPaths({ journeys, lanes: allLanes })).toEqual([
      expect.objectContaining({ id: 'hoid:sel:scadrial', d: expect.stringMatching(/^M 200 100 C /) }),
      expect.objectContaining({ id: 'hoid:scadrial:roshar', d: expect.stringMatching(/^M 400 200 C /) }),
    ]);

    const filteredLanes = [allLanes[0], allLanes[2]];
    expect(projectWorldhopperPaths({ journeys, lanes: filteredLanes })).toEqual([]);
  });

  test('does not draw same-world movement as cross-world travel', () => {
    const journeys = deriveWorldhopperJourneys({
      worldhoppers: [
        {
          ...worldhoppers[0],
          appearances: [
            { eventId: 'sel', source: { label: 'Source A' } },
            { eventId: 'sel-later', source: { label: 'Source B' } },
          ],
        },
      ],
      events: [...events, event('sel-later', 'Sel', 15)],
    });
    const lanes = [
      { id: 'Sel', y: 100, events: [{ id: 'sel', x: 200 }, { id: 'sel-later', x: 300 }] },
    ];

    expect(projectWorldhopperPaths({ journeys, lanes })).toEqual([]);
  });

  test('does not bridge across an unresolved canonical appearance', () => {
    const journeys = deriveWorldhopperJourneys({
      worldhoppers: [
        {
          ...worldhoppers[0],
          appearances: [
            { eventId: 'sel', source: { label: 'Source A' } },
            { eventId: 'missing', source: { label: 'Source B' } },
            { eventId: 'roshar', source: { label: 'Source C' } },
          ],
        },
      ],
      events,
    });
    const lanes = [
      { id: 'Sel', y: 100, events: [{ id: 'sel', x: 200 }] },
      { id: 'Roshar', y: 300, events: [{ id: 'roshar', x: 600 }] },
    ];

    expect(journeys[0].transitions).toEqual([]);
    expect(projectWorldhopperPaths({ journeys, lanes })).toEqual([]);
  });
});
