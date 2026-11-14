// group events by system field
export const groupEventsBySystem = (events) => {
  const systems = {};
  events.forEach((event) => {
    const system = event.location.system;
    if (!systems[system]) {
      systems[system] = [];
    }
    systems[system].push(event);
  });
  return systems;
};

export const addEventsToSystems = (systems, events) => {
  const systemsWithEvents = {};
  systems.forEach((system) => {
    systemsWithEvents[system.id] = {
      ...system,
      events: events[system.id] ?? [],
    };
  });
  
  return systemsWithEvents;
}

export const getEventPointYear = (event) =>
  event.date.kind === 'point' ? event.date.value : null;


