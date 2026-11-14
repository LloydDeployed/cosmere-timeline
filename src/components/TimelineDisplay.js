import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import canonicalData from '../data/canonicalData';
import TimelineViewport from './TimelineViewport';
import {
  CHRONOLOGY_BOUNDS,
  clampViewport,
  formatTimelineDate,
  panViewport,
  zoomViewport,
} from '../timeline/timelineProjection';

const formatControlValue = (value) => Number(value.toFixed(2));

function TimelineDisplay() {
  const [viewport, setViewport] = useState(CHRONOLOGY_BOUNDS);
  const [activeSystemIds, setActiveSystemIds] = useState(() =>
    canonicalData.systems.map(({ id }) => id)
  );
  const [selectedEventId, setSelectedEventId] = useState(null);
  const selectedEvent = useMemo(
    () => canonicalData.events.find(({ id }) => id === selectedEventId) ?? null,
    [selectedEventId]
  );

  const toggleSystem = (systemId) => {
    setActiveSystemIds((current) =>
      current.includes(systemId)
        ? current.filter((id) => id !== systemId)
        : [...current, systemId]
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

      <ViewportControls aria-label="Timeline viewport controls">
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
        The chronology stays linear, including long quiet eras. Zoom to inspect dense eras.
        Hollow markers and ≈ labels preserve approximate or unknown date precision.
      </Legend>

      <TimelineViewport
        systems={canonicalData.systems}
        events={canonicalData.events}
        activeSystemIds={activeSystemIds}
        viewport={viewport}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
        onZoom={zoom}
      />

      <SelectionStatus role="status" aria-live="polite">
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

const SelectionStatus = styled.p`
  min-height: 1.5rem;
  margin: 0.75rem 0 0;
  color: #d8dedc;
  text-align: left;
`;

export default TimelineDisplay;
