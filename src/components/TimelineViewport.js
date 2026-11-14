import { useId, useMemo } from 'react';
import styled from '@emotion/styled';
import { createTimelineViewModel } from '../timeline/timelineProjection';

const WIDTH = 1000;

const wrapText = (text, maxLength = 56) => {
  const words = text.split(/\s+/);
  const lines = [];
  words.forEach((word) => {
    const current = lines[lines.length - 1];
    if (!current || `${current} ${word}`.length > maxLength) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  });
  return lines.slice(0, 3);
};

function EventMarker({ event, color, y, selected, onSelect }) {
  const label = `${event.dateLabel}: ${event.description}`;
  const select = () => onSelect(event.id);

  return (
    <g
      role="button"
      tabIndex="0"
      aria-label={label}
      aria-pressed={selected}
      onClick={select}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault();
          select();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <title>{label}</title>
      {event.kind === 'range' ? (
        <>
          <line
            x1={event.x}
            x2={event.x2}
            y1={y}
            y2={y}
            stroke={color}
            strokeWidth={selected ? 9 : 6}
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx={event.x} cy={y} r="4" fill="#172021" stroke={color} strokeWidth="2" />
          <circle cx={event.x2} cy={y} r="4" fill="#172021" stroke={color} strokeWidth="2" />
        </>
      ) : (
        <circle
          cx={event.x}
          cy={y}
          r={selected ? 8 : 6}
          fill={event.uncertain ? '#172021' : color}
          stroke={selected ? '#f4c36a' : '#f7f2e7'}
          strokeWidth={selected ? 3 : 1.5}
        />
      )}
    </g>
  );
}

function OrderOnlyMarker({ event, color, x, y, selected, onSelect }) {
  const label = `${event.dateLabel}: ${event.description}. Relative order only; no numeric year assigned.`;
  const select = () => onSelect(event.id);

  return (
    <g
      role="button"
      tabIndex="0"
      aria-label={label}
      aria-pressed={selected}
      onClick={select}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault();
          select();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <title>{label}</title>
      <path
        d={`M ${x} ${y - 7} L ${x + 7} ${y} L ${x} ${y + 7} L ${x - 7} ${y} Z`}
        fill="#172021"
        stroke={selected ? '#f4c36a' : color}
        strokeWidth={selected ? 3 : 2}
      />
    </g>
  );
}

function SelectionCard({ event, color, x, y, plot }) {
  const width = 360;
  const height = 92;
  const left = Math.min(Math.max(x - width / 2, plot.left), plot.right - width);
  const cardY = y + 14;
  const lines = wrapText(event.description);

  return (
    <g aria-hidden="true" pointerEvents="none">
      <path d={`M ${x} ${y + 7} L ${x} ${cardY}`} stroke={color} strokeWidth="2" />
      <rect x={left} y={cardY} width={width} height={height} rx="6" fill="#101718" stroke={color} strokeWidth="2" />
      <text x={left + 14} y={cardY + 23} fill="#f4c36a" fontSize="14" fontWeight="700">
        {event.dateLabel}
      </text>
      <text x={left + 14} y={cardY + 44} fill="#f7f2e7" fontSize="13">
        {lines.map((line, index) => (
          <tspan key={line + index} x={left + 14} dy={index === 0 ? 0 : 17}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function TimelineViewport({
  systems,
  events,
  activeSystemIds,
  viewport,
  selectedEventId,
  worldhopperJourneys,
  projectionMode,
  onSelectEvent,
  onZoom,
}) {
  const descriptionId = useId();
  const model = useMemo(
    () => createTimelineViewModel({
      systems,
      events,
      activeSystemIds,
      viewport,
      worldhopperJourneys,
      projectionMode,
      width: WIDTH,
    }),
    [systems, events, activeSystemIds, viewport, worldhopperJourneys, projectionMode]
  );
  const selected = events.find(({ id }) => id === selectedEventId);
  const selectedLane = selected ? model.lanes.find(({ id }) => id === selected.location.system) : null;
  const selectedProjected = selectedLane
    ? [...selectedLane.events, ...selectedLane.orderOnlyEvents].find(
        ({ id }) => id === selectedEventId
      )
    : null;

  return (
    <ViewportFrame>
      <Svg
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="group"
        aria-label={`Cosmere chronology from ${viewport.start} to ${viewport.end}`}
        aria-describedby={descriptionId}
        onWheel={(wheelEvent) => {
          if (!wheelEvent.ctrlKey && !wheelEvent.metaKey) return;
          wheelEvent.preventDefault();
          onZoom(wheelEvent.deltaY < 0 ? 0.8 : 1.25);
        }}
      >
        <title>Cosmere chronology</title>
        <desc id={descriptionId}>
          {model.projection.mode === 'condensed'
            ? 'A numeric chronology with long event-free spans condensed and marked by visible breaks.'
            : 'A linear numeric chronology.'}{' '}
          Curves connect adjacent, explicitly tagged worldhopper appearances. Select an event marker
          to read its date and description. Hold Control or Command while scrolling to zoom the
          chronology; ordinary scrolling continues through the page.
        </desc>
        <rect width={model.width} height={model.height} fill="#172021" rx="8" />

        <g aria-hidden="true">
          {model.ticks.map(({ year, x }) => (
            <g key={year}>
              <line x1={x} x2={x} y1="42" y2={model.height - 28} stroke="#536061" strokeWidth="1" strokeDasharray="3 6" />
              <text x={x} y="28" fill="#c8cfcd" textAnchor="middle" fontSize="12">{year}</text>
            </g>
          ))}
        </g>

        {model.projection.breaks.map((gap) => (
          <g key={`${gap.start}-${gap.end}`} data-testid="timeline-break" aria-label={`Chronology break from ${gap.start} to ${gap.end}`}>
            <path
              d={`M ${gap.x - 7} 34 l 7 8 l 7 -8 M ${gap.x - 7} 42 l 7 8 l 7 -8`}
              fill="none"
              stroke="#f4c36a"
              strokeWidth="2"
              aria-hidden="true"
            />
            <title>Chronology break: {gap.end - gap.start} event-free years</title>
          </g>
        ))}

        <g aria-hidden="true" data-testid="worldhopper-paths">
          {model.travelPaths.map((path) => (
            <path
              key={path.id}
              data-worldhopper={path.worldhopperId}
              d={path.d}
              fill="none"
              stroke={path.color}
              strokeWidth="2.5"
              strokeDasharray="8 5"
              strokeLinecap="round"
              opacity="0.82"
            />
          ))}
        </g>

        {model.lanes.map((lane) => (
          <g key={lane.id} data-testid={`lane-${lane.id}`}>
            <text x={model.plot.left - 14} y={lane.y + 5} fill={lane.color} textAnchor="end" fontSize="15" fontWeight="700">
              {lane.name}
            </text>
            <line x1={model.plot.left} x2={model.plot.right} y1={lane.y} y2={lane.y} stroke={lane.color} strokeWidth="2" opacity="0.72" />
            {lane.events.map((event) => (
              <EventMarker key={event.id} event={event} color={lane.color} y={lane.y} selected={event.id === selectedEventId} onSelect={onSelectEvent} />
            ))}
            {lane.orderOnlyEvents.map((event, index) => (
              <OrderOnlyMarker
                key={event.id}
                event={event}
                color={lane.color}
                x={20 + index * 22}
                y={lane.y}
                selected={event.id === selectedEventId}
                onSelect={onSelectEvent}
              />
            ))}
          </g>
        ))}

        {model.lanes.length === 0 && (
          <text x="500" y="100" fill="#c8cfcd" textAnchor="middle" fontSize="16">
            Enable a world or system lane to view its events.
          </text>
        )}
        {selectedProjected && selectedLane && (
          <SelectionCard
            event={selectedProjected}
            color={selectedLane.color}
            x={selectedProjected.x ?? model.plot.left}
            y={selectedLane.y}
            plot={model.plot}
          />
        )}
      </Svg>
    </ViewportFrame>
  );
}

const ViewportFrame = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid #4d595a;
  border-radius: 0.5rem;
  background: #172021;
`;

const Svg = styled.svg`
  display: block;
  width: 100%;
  min-width: 720px;
  height: auto;

  [role='button']:focus-visible { outline: none; }
  [role='button']:focus-visible circle,
  [role='button']:focus-visible line,
  [role='button']:focus-visible path { filter: drop-shadow(0 0 4px #f4c36a); }
`;

export default TimelineViewport;
