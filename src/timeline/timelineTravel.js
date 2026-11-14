const indexEvents = (events) => new Map(events.map((event) => [event.id, event]));

const toAppearance = (appearance, event) => ({
  ...appearance,
  systemId: event.location.system,
  date: event.date,
});

export const deriveWorldhopperJourneys = ({ worldhoppers, events }) => {
  const eventsById = indexEvents(events);

  return worldhoppers.map((worldhopper) => {
    const resolvedAppearances = worldhopper.appearances.map((appearance) => {
        const event = eventsById.get(appearance.eventId);
        return event ? toAppearance(appearance, event) : null;
      });
    const appearances = resolvedAppearances.filter(Boolean);
    const transitions = resolvedAppearances.slice(1).flatMap((to, index) => {
      const from = resolvedAppearances[index];
      return from && to ? [{
        id: `${worldhopper.id}:${from.eventId}:${to.eventId}`,
        from,
        to,
      }] : [];
    });

    return { ...worldhopper, appearances, transitions };
  });
};

const indexProjectedEvents = (lanes) => {
  const projected = new Map();
  lanes.forEach((lane) => {
    lane.events.forEach((event) => {
      projected.set(event.id, { eventId: event.id, systemId: lane.id, x: event.x, y: lane.y });
    });
  });
  return projected;
};

const makeCurve = (from, to) => {
  const middleX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${middleX} ${from.y}, ${middleX} ${to.y}, ${to.x} ${to.y}`;
};

export const projectWorldhopperPaths = ({ journeys, lanes }) => {
  const projectedEvents = indexProjectedEvents(lanes);

  return journeys.flatMap((journey) =>
    journey.transitions.flatMap((transition) => {
      const from = projectedEvents.get(transition.from.eventId);
      const to = projectedEvents.get(transition.to.eventId);
      if (!from || !to || from.systemId === to.systemId) return [];

      return [{
        ...transition,
        worldhopperId: journey.id,
        name: journey.name,
        color: journey.color,
        from,
        to,
        d: makeCurve(from, to),
      }];
    })
  );
};
