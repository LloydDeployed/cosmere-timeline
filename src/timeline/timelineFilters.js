const normalizeForComparison = (value) => String(value ?? '').trim().toLocaleLowerCase();

const hasExactValue = (values, selected) => {
  if (!selected) return true;
  const target = normalizeForComparison(selected);
  return (values ?? []).some((value) => normalizeForComparison(value) === target);
};

export const createEmptyFilters = () => ({
  work: '',
  storyText: '',
  character: '',
  shard: '',
  system: '',
  hideScopedSpoilers: false,
});

export const hasExplicitSpoilerScope = (event) =>
  (event.spoilerScope?.books?.length ?? 0) > 0 ||
  (event.spoilerScope?.series?.length ?? 0) > 0;

export const eventMatchesFilters = (event, filters) => {
  const storyQuery = normalizeForComparison(filters.storyText);

  return (
    hasExactValue(event.relatedWorks, filters.work) &&
    (!storyQuery || normalizeForComparison(event.description).includes(storyQuery)) &&
    hasExactValue(event.characters, filters.character) &&
    hasExactValue(event.shards, filters.shard) &&
    (!filters.system ||
      normalizeForComparison(event.location?.system) === normalizeForComparison(filters.system)) &&
    (!filters.hideScopedSpoilers || !hasExplicitSpoilerScope(event))
  );
};

export const filterTimelineEvents = (events, filters) =>
  events.filter((event) => eventMatchesFilters(event, filters));

const uniqueSorted = (values) =>
  [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));

export const getFilterOptions = (events) => ({
  works: uniqueSorted(events.flatMap((event) => event.relatedWorks ?? [])),
  characters: uniqueSorted(events.flatMap((event) => event.characters ?? [])),
  shards: uniqueSorted(events.flatMap((event) => event.shards ?? [])),
  systems: uniqueSorted(events.map((event) => event.location?.system)),
});

export const countSpoilerMetadata = (events) => {
  const scoped = events.filter(hasExplicitSpoilerScope).length;
  return { scoped, unscoped: events.length - scoped };
};
