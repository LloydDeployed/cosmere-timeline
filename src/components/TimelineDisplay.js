import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import canonicalData from '../data/canonicalData';
import TimelineViewport from './TimelineViewport';
import {
  CHRONOLOGY_BOUNDS,
  clampViewport,
  formatTimelineDate,
  isEventInViewport,
  panViewport,
  zoomViewport,
} from '../timeline/timelineProjection';
import {
  countSpoilerMetadata,
  createEmptyFilters,
  filterTimelineEvents,
  getFilterOptions,
} from '../timeline/timelineFilters';
import { deriveWorldhopperJourneys } from '../timeline/timelineTravel';

const formatControlValue = (value) => Number(value.toFixed(2));

function TimelineDisplay() {
  const [viewport, setViewport] = useState(CHRONOLOGY_BOUNDS);
  const [projectionMode, setProjectionMode] = useState('condensed');
  const [activeSystemIds, setActiveSystemIds] = useState(() =>
    canonicalData.systems.map(({ id }) => id)
  );
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [filters, setFilters] = useState(createEmptyFilters);
  const [activeWorldhopperIds, setActiveWorldhopperIds] = useState(() =>
    canonicalData.worldhoppers.map(({ id }) => id)
  );
  const filterOptions = useMemo(() => getFilterOptions(canonicalData.events), []);
  const spoilerMetadata = useMemo(() => countSpoilerMetadata(canonicalData.events), []);
  const worldhopperJourneys = useMemo(
    () => deriveWorldhopperJourneys({
      worldhoppers: canonicalData.worldhoppers,
      events: canonicalData.events,
    }),
    []
  );
  const activeWorldhopperJourneys = useMemo(
    () => worldhopperJourneys.filter(({ id }) => activeWorldhopperIds.includes(id)),
    [activeWorldhopperIds, worldhopperJourneys]
  );
  const filteredEvents = useMemo(
    () => filterTimelineEvents(canonicalData.events, filters),
    [filters]
  );
  const eventsInActiveLanes = useMemo(
    () => filteredEvents.filter((event) => activeSystemIds.includes(event.location.system)),
    [activeSystemIds, filteredEvents]
  );
  const visibleEvents = useMemo(
    () => eventsInActiveLanes.filter((event) => isEventInViewport(event, viewport)),
    [eventsInActiveLanes, viewport]
  );
  const selectedEvent = useMemo(
    () => canonicalData.events.find(({ id }) => id === selectedEventId) ?? null,
    [selectedEventId]
  );

  useEffect(() => {
    if (selectedEventId && !visibleEvents.some(({ id }) => id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, visibleEvents]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters(createEmptyFilters());
    setActiveSystemIds(canonicalData.systems.map(({ id }) => id));
    setActiveWorldhopperIds(canonicalData.worldhoppers.map(({ id }) => id));
  };

  const toggleSystem = (systemId) => {
    setActiveSystemIds((current) =>
      current.includes(systemId)
        ? current.filter((id) => id !== systemId)
        : [...current, systemId]
    );
  };

  const toggleWorldhopper = (worldhopperId) => {
    setActiveWorldhopperIds((current) =>
      current.includes(worldhopperId)
        ? current.filter((id) => id !== worldhopperId)
        : [...current, worldhopperId]
    );
  };

  const setBound = (bound, value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    setViewport((current) =>
      clampViewport({ ...current, [bound]: number }, CHRONOLOGY_BOUNDS)
    );
  };

  const zoom = (factor) => {
    setViewport((current) =>
      zoomViewport(
        current,
        factor,
        current.start + (current.end - current.start) / 2,
        CHRONOLOGY_BOUNDS
      )
    );
  };

  const pan = (direction) => {
    setViewport((current) =>
      panViewport(
        current,
        (current.end - current.start) * 0.25 * direction,
        CHRONOLOGY_BOUNDS
      )
    );
  };

  return (
    <Container>
      <FilterSection aria-labelledby="filter-heading">
        <FilterHeader>
          <ControlHeading id="filter-heading">Filter events</ControlHeading>
          <ClearButton type="button" onClick={clearFilters}>Clear filters</ClearButton>
        </FilterHeader>
        <FilterGrid>
          <FilterField>
            <label htmlFor="story-text">Story text</label>
            <input
              id="story-text"
              type="search"
              value={filters.storyText}
              onChange={(event) => updateFilter('storyText', event.target.value)}
              placeholder="Search event descriptions"
            />
            <small>Searches descriptions only, not character metadata.</small>
          </FilterField>
          <FilterField>
            <label htmlFor="work-filter">Book or work</label>
            <select
              id="work-filter"
              value={filters.work}
              onChange={(event) => updateFilter('work', event.target.value)}
            >
              <option value="">All works</option>
              {filterOptions.works.map((work) => <option key={work} value={work}>{work}</option>)}
            </select>
          </FilterField>
          <FilterField>
            <label htmlFor="character-filter">Character</label>
            <select
              id="character-filter"
              value={filters.character}
              disabled={filterOptions.characters.length === 0}
              onChange={(event) => updateFilter('character', event.target.value)}
            >
              <option value="">All characters</option>
              {filterOptions.characters.map((character) => (
                <option key={character} value={character}>{character}</option>
              ))}
            </select>
            {filterOptions.characters.length === 0 && (
              <small>No events have canonical character tags yet.</small>
            )}
          </FilterField>
          <FilterField>
            <label htmlFor="shard-filter">Shard</label>
            <select
              id="shard-filter"
              value={filters.shard}
              onChange={(event) => updateFilter('shard', event.target.value)}
            >
              <option value="">All Shards</option>
              {filterOptions.shards.map((shard) => <option key={shard} value={shard}>{shard}</option>)}
            </select>
          </FilterField>
        </FilterGrid>
        <SpoilerControl>
          <input
            id="hide-scoped-spoilers"
            type="checkbox"
            checked={filters.hideScopedSpoilers}
            disabled={spoilerMetadata.scoped === 0}
            onChange={(event) => updateFilter('hideScopedSpoilers', event.target.checked)}
          />
          <label htmlFor="hide-scoped-spoilers">Hide events with explicit spoiler metadata</label>
        </SpoilerControl>
        <MetadataNote>
          {spoilerMetadata.scoped} of {canonicalData.events.length} events have explicit spoiler
          metadata; {spoilerMetadata.unscoped} events lack explicit spoiler metadata. Unscoped does
          not mean spoiler-free.
        </MetadataNote>
      </FilterSection>

      <section aria-labelledby="lane-heading">
        <ControlHeading id="lane-heading">World and system lanes</ControlHeading>
        <LaneControls>
          {canonicalData.systems.map((system) => {
            const isActive = activeSystemIds.includes(system.id);
            return (
              <LaneButton
                key={system.id}
                type="button"
                aria-pressed={isActive}
                $active={isActive}
                $color={system.color}
                onClick={() => toggleSystem(system.id)}
              >
                {system.name}
              </LaneButton>
            );
          })}
        </LaneControls>
      </section>

      <TravelSection aria-labelledby="travel-heading">
        <ControlHeading id="travel-heading">Worldhopper travel</ControlHeading>
        <TravelControls>
          {canonicalData.worldhoppers.map((worldhopper) => {
            const isActive = activeWorldhopperIds.includes(worldhopper.id);
            return (
              <TravelButton
                key={worldhopper.id}
                type="button"
                aria-label={`${worldhopper.name} travel path`}
                aria-pressed={isActive}
                $active={isActive}
                $color={worldhopper.color}
                onClick={() => toggleWorldhopper(worldhopper.id)}
              >
                {worldhopper.name}
              </TravelButton>
            );
          })}
        </TravelControls>
        <MetadataNote>
          Curves connect adjacent, explicitly tagged story appearances. They show chronology, not
          an exact route or arrival date, and disappear when either anchor is filtered or outside
          the viewport.
        </MetadataNote>
        <SourceDisclosure>
          <summary>Appearance sources and limitations</summary>
          {canonicalData.worldhoppers.map((worldhopper) => (
            <div key={worldhopper.id}>
              <strong>{worldhopper.name}:</strong>{' '}
              {worldhopper.appearances.map(({ eventId, source }) =>
                `${eventId} — ${source.label}`
              ).join('; ')}
            </div>
          ))}
        </SourceDisclosure>
      </TravelSection>

      <ResultStatus role="status" aria-label="Filter results" aria-live="polite">
        {eventsInActiveLanes.length} matching {eventsInActiveLanes.length === 1 ? 'event' : 'events'} in
        active lanes; {visibleEvents.length} in the current viewport.
      </ResultStatus>

      <ViewportControls aria-label="Timeline viewport controls">
        <ControlButton
          type="button"
          aria-pressed={projectionMode === 'linear'}
          onClick={() => setProjectionMode((current) => (current === 'linear' ? 'condensed' : 'linear'))}
        >
          {projectionMode === 'linear' ? 'Condense quiet spans' : 'Use linear chronology'}
        </ControlButton>
        <ControlButton type="button" onClick={() => pan(-1)} aria-label="Pan earlier">
          ← Earlier
        </ControlButton>
        <ControlButton type="button" onClick={() => zoom(0.5)} aria-label="Zoom in">
          + Zoom in
        </ControlButton>
        <ControlButton type="button" onClick={() => zoom(2)} aria-label="Zoom out">
          − Zoom out
        </ControlButton>
        <ControlButton type="button" onClick={() => pan(1)} aria-label="Pan later">
          Later →
        </ControlButton>
        <YearField>
          <label htmlFor="start-year">Start year</label>
          <input
            id="start-year"
            type="number"
            min={CHRONOLOGY_BOUNDS.start}
            max={CHRONOLOGY_BOUNDS.end}
            value={formatControlValue(viewport.start)}
            onChange={(event) => setBound('start', event.target.value)}
          />
        </YearField>
        <YearField>
          <label htmlFor="end-year">End year</label>
          <input
            id="end-year"
            type="number"
            min={CHRONOLOGY_BOUNDS.start}
            max={CHRONOLOGY_BOUNDS.end}
            value={formatControlValue(viewport.end)}
            onChange={(event) => setBound('end', event.target.value)}
          />
        </YearField>
      </ViewportControls>

      <Legend>
        {projectionMode === 'condensed'
          ? 'Long event-free spans are condensed; break markers show where chronology skips.'
          : 'Chronology is shown at a linear scale, including long quiet eras.'}{' '}
        Hollow markers and ≈ labels preserve approximate or unknown date precision.
      </Legend>

      <TimelineViewport
        systems={canonicalData.systems}
        events={filteredEvents}
        activeSystemIds={activeSystemIds}
        viewport={viewport}
        selectedEventId={selectedEventId}
        worldhopperJourneys={activeWorldhopperJourneys}
        projectionMode={projectionMode}
        onSelectEvent={setSelectedEventId}
        onZoom={zoom}
      />

      <SelectionStatus role="status" aria-label="Selected event details" aria-live="polite">
        {selectedEvent
          ? `${formatTimelineDate(selectedEvent.date)} — ${selectedEvent.description}`
          : 'Select an event marker for its date and description.'}
      </SelectionStatus>
    </Container>
  );
}

const Container = styled.div`
  width: min(1500px, 100%);
  margin: 0 auto;
`;

const FilterSection = styled.section`
  margin-bottom: 1rem;
  padding: 1rem;
  background: #182021;
  border: 1px solid #445051;
  border-radius: 0.5rem;
  text-align: left;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.8rem;
`;

const FilterField = styled.div`
  display: grid;
  align-content: start;
  gap: 0.3rem;

  label { color: #e5dfd1; font-size: 0.85rem; font-weight: 700; }
  input, select {
    width: 100%;
    min-height: 2.5rem;
    padding: 0.4rem 0.55rem;
    color: #fff;
    background: #101617;
    border: 1px solid #687576;
    border-radius: 0.25rem;
  }
  input:focus-visible, select:focus-visible { outline: 3px solid #f0b35a; outline-offset: 1px; }
  select:disabled { color: #8f9a98; opacity: 0.72; }
  small { color: #aab4b2; font-size: 0.72rem; line-height: 1.35; }
`;

const SpoilerControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.9rem;
  color: #e5dfd1;

  input { width: 1.15rem; height: 1.15rem; accent-color: #d59a47; }
  input:disabled + label { color: #8f9a98; }
`;

const MetadataNote = styled.p`
  margin: 0.45rem 0 0;
  color: #aab4b2;
  font-size: 0.75rem;
`;

const ClearButton = styled.button`
  padding: 0.4rem 0.65rem;
  color: #f8f4e9;
  background: transparent;
  border: 1px solid #687576;
  border-radius: 0.25rem;
  cursor: pointer;
  &:focus-visible { outline: 3px solid #f0b35a; outline-offset: 2px; }
`;

const ControlHeading = styled.h2`
  margin: 0 0 0.75rem;
  color: #f2ead9;
  font-size: 1rem;
  text-align: left;
`;

const LaneControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TravelSection = styled.section`
  margin-top: 1rem;
  text-align: left;
`;

const TravelControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TravelButton = styled.button`
  padding: 0.45rem 0.75rem;
  color: #f8f4e9;
  background: #202829;
  border: 1px solid ${({ $active, $color }) => ($active ? $color : '#566061')};
  border-bottom-width: 0.3rem;
  border-radius: 0.25rem;
  opacity: ${({ $active }) => ($active ? 1 : 0.55)};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid #f0b35a;
    outline-offset: 2px;
  }
`;

const SourceDisclosure = styled.details`
  margin-top: 0.5rem;
  color: #aab4b2;
  font-size: 0.75rem;
  line-height: 1.5;

  summary { color: #d8dedc; cursor: pointer; }
  div { margin-top: 0.35rem; }
`;

const LaneButton = styled.button`
  padding: 0.45rem 0.75rem;
  color: #f8f4e9;
  background: #202829;
  border: 1px solid ${({ $active, $color }) => ($active ? $color : '#566061')};
  border-left-width: 0.35rem;
  border-radius: 0.25rem;
  opacity: ${({ $active }) => ($active ? 1 : 0.55)};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid #f0b35a;
    outline-offset: 2px;
  }
`;

const ViewportControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.55rem;
  margin: 1rem 0 0.65rem;
`;

const ControlButton = styled.button`
  min-height: 2.5rem;
  padding: 0.45rem 0.75rem;
  color: #f8f4e9;
  background: #283334;
  border: 1px solid #687576;
  border-radius: 0.25rem;
  cursor: pointer;

  &:hover {
    background: #344243;
  }
`;

const YearField = styled.div`
  display: grid;
  gap: 0.2rem;
  margin-left: 0.3rem;
  text-align: left;

  label {
    color: #bfc7c6;
    font-size: 0.75rem;
  }

  input {
    width: 7.25rem;
    min-height: 2.5rem;
    padding: 0.35rem 0.5rem;
    color: #fff;
    background: #151b1c;
    border: 1px solid #687576;
    border-radius: 0.25rem;
  }
`;

const Legend = styled.p`
  margin: 0 0 0.75rem;
  color: #bfc7c6;
  font-size: 0.82rem;
  line-height: 1.45;
  text-align: left;
`;

const ResultStatus = styled.p`
  margin: 0.75rem 0;
  color: #f4c36a;
  font-size: 0.86rem;
  text-align: left;
`;

const SelectionStatus = styled.p`
  min-height: 1.5rem;
  margin: 0.75rem 0 0;
  color: #d8dedc;
  text-align: left;
`;

export default TimelineDisplay;
