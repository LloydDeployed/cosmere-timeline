import { projectWorldhopperPaths } from './timelineTravel';

export const CHRONOLOGY_BOUNDS = { start: -1100, end: 16050 };
export const MIN_VIEWPORT_SPAN = 25;
export const CONDENSED_GAP_THRESHOLD = 1000;
export const CONDENSED_GAP_SPAN = 120;

const finiteOr = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const clampViewport = (viewport, bounds, minimumSpan = MIN_VIEWPORT_SPAN) => {
  let start = finiteOr(viewport?.start, bounds.start);
  let end = finiteOr(viewport?.end, bounds.end);
  const availableSpan = bounds.end - bounds.start;
  const minSpan = Math.min(Math.max(minimumSpan, 0), availableSpan);

  if (end <= start) return { ...bounds };

  if (end - start < minSpan) {
    const middle = (start + end) / 2;
    start = middle - minSpan / 2;
    end = middle + minSpan / 2;
  }
  if (start < bounds.start) {
    end += bounds.start - start;
    start = bounds.start;
  }
  if (end > bounds.end) {
    start -= end - bounds.end;
    end = bounds.end;
  }

  return {
    start: Math.max(bounds.start, start),
    end: Math.min(bounds.end, end),
  };
};

export const zoomViewport = (
  viewport,
  factor,
  anchor,
  bounds,
  minimumSpan = MIN_VIEWPORT_SPAN
) => {
  const current = clampViewport(viewport, bounds, minimumSpan);
  const span = current.end - current.start;
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const safeAnchor = Math.min(
    current.end,
    Math.max(current.start, finiteOr(anchor, current.start + span / 2))
  );
  const anchorRatio = (safeAnchor - current.start) / span;
  const nextSpan = Math.max(minimumSpan, Math.min(bounds.end - bounds.start, span * safeFactor));

  return clampViewport(
    {
      start: safeAnchor - nextSpan * anchorRatio,
      end: safeAnchor + nextSpan * (1 - anchorRatio),
    },
    bounds,
    minimumSpan
  );
};

export const panViewport = (viewport, delta, bounds) => {
  const current = clampViewport(viewport, bounds, 0);
  const span = current.end - current.start;
  let start = current.start + finiteOr(delta, 0);
  let end = start + span;

  if (start < bounds.start) {
    start = bounds.start;
    end = start + span;
  }
  if (end > bounds.end) {
    end = bounds.end;
    start = end - span;
  }
  return { start, end };
};

export const applyViewportBoundDraft = (
  viewport,
  bound,
  draft,
  bounds,
  minimumSpan = MIN_VIEWPORT_SPAN
) => {
  if (String(draft).trim() === '') {
    return { viewport, error: 'Enter a whole year.' };
  }
  const value = Number(draft);
  if (!Number.isInteger(value)) {
    return { viewport, error: 'Enter a whole year.' };
  }
  if (value < bounds.start || value > bounds.end) {
    return {
      viewport,
      error: `Enter a year from ${bounds.start} through ${bounds.end}.`,
    };
  }

  const next = { ...viewport, [bound]: value };
  if (next.end - next.start < minimumSpan) {
    return {
      viewport,
      error: `Start and end must be at least ${minimumSpan} years apart.`,
    };
  }
  return { viewport: next, error: null };
};

const formatYear = (value) =>
  Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();

export const formatTimelineDate = (date) => {
  if (date.kind === 'range') {
    return `${date.precision === 'exact' ? '' : '≈ '}${formatYear(date.start)}–${formatYear(
      date.end
    )}`;
  }
  if (date.kind === 'order') {
    const parts = [];
    if (date.after) parts.push(`After ${date.after}`);
    if (date.before) parts.push(`Before ${date.before}`);
    return parts.join(', ');
  }
  return `${date.precision === 'exact' ? '' : '≈ '}${formatYear(date.value)}`;
};

export const isEventInViewport = (event, viewport) => {
  if (event.date.kind === 'order') return true;
  if (event.date.kind === 'range') {
    return event.date.end >= viewport.start && event.date.start <= viewport.end;
  }
  return event.date.value >= viewport.start && event.date.value <= viewport.end;
};

const numericEventDates = (events) => events.flatMap((event) => {
  if (event.date.kind === 'point') return [event.date.value];
  if (event.date.kind === 'range') return [event.date.start, event.date.end];
  return [];
});

export const createTimeProjection = ({
  viewport,
  eventDates = [],
  width,
  mode = 'condensed',
  gapThreshold = CONDENSED_GAP_THRESHOLD,
  condensedGap = CONDENSED_GAP_SPAN,
}) => {
  const span = viewport.end - viewport.start;
  const plotLeft = 0;
  const plotRight = width;
  const dates = [...new Set(eventDates
    .filter(Number.isFinite)
    .map((date) => Math.min(viewport.end, Math.max(viewport.start, date))))]
    .sort((a, b) => a - b);
  const candidates = mode === 'condensed'
    ? dates.slice(1).map((end, index) => ({ start: dates[index], end }))
      .filter(({ start, end }) => end - start > gapThreshold)
    : [];
  const safeCondensedGap = Math.max(0, Number.isFinite(condensedGap) ? condensedGap : 0);
  const weightedSpan = span - candidates.reduce(
    (total, gap) => total + (gap.end - gap.start - safeCondensedGap),
    0
  );
  const projectRaw = (year) => {
    const clamped = Math.min(viewport.end, Math.max(viewport.start, year));
    const compressedBefore = candidates.reduce((total, gap) => {
      if (clamped <= gap.start) return total;
      return total + Math.min(clamped, gap.end) - gap.start
        - Math.min(safeCondensedGap, Math.max(0, clamped - gap.start));
    }, 0);
    return plotLeft + ((clamped - viewport.start - compressedBefore) / weightedSpan)
      * (plotRight - plotLeft);
  };
  const breaks = candidates.map((gap) => ({
    ...gap,
    x: (projectRaw(gap.start) + projectRaw(gap.end)) / 2,
  }));

  return {
    mode: mode === 'linear' ? 'linear' : 'condensed',
    breaks,
    project: mode === 'linear' ? (year) => (
      plotLeft + ((year - viewport.start) / span) * (plotRight - plotLeft)
    ) : projectRaw,
  };
};

const makeTicks = (viewport, count = 8) => {
  const span = viewport.end - viewport.start;
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const first = Math.ceil(viewport.start / step) * step;
  const ticks = [];
  for (let value = first; value <= viewport.end; value += step) {
    ticks.push(Number(value.toFixed(8)));
  }
  return ticks;
};

export const createTimelineViewModel = ({
  systems,
  events,
  activeSystemIds,
  viewport,
  worldhopperJourneys = [],
  width = 1000,
  projectionMode = 'condensed',
}) => {
  const plot = { left: 150, right: width - 50 };
  const plotWidth = plot.right - plot.left;
  const active = new Set(activeSystemIds);
  const projectionEvents = events.filter(
    (event) => active.has(event.location.system) && isEventInViewport(event, viewport)
  );
  const timeProjection = createTimeProjection({
    viewport,
    eventDates: numericEventDates(projectionEvents),
    width: plotWidth,
    mode: projectionMode,
  });
  const project = (year) => plot.left + timeProjection.project(year);

  const lanes = systems
    .filter((system) => active.has(system.id))
    .map((system, index) => {
      const systemEvents = events.filter((event) => event.location.system === system.id);
      const orderOnlyEvents = systemEvents
        .filter((event) => event.date.kind === 'order')
        .map((event) => ({
          ...event,
          kind: 'order',
          x: null,
          dateLabel: formatTimelineDate(event.date),
          uncertain: true,
        }));
      const numericEvents = systemEvents
        .filter((event) => event.date.kind !== 'order' && isEventInViewport(event, viewport))
        .map((event) => {
          const start = event.date.kind === 'point' ? event.date.value : event.date.start;
          const end = event.date.kind === 'point' ? null : event.date.end;
          return {
            ...event,
            kind: event.date.kind,
            x: project(Math.max(viewport.start, start)),
            x2: end == null ? null : project(Math.min(viewport.end, end)),
            dateLabel: formatTimelineDate(event.date),
            uncertain:
              event.date.precision !== 'exact' ||
              event.date.confidence === 'low' ||
              event.date.confidence === 'unknown',
          };
        })
        .sort((a, b) => a.x - b.x || a.id.localeCompare(b.id));

      return {
        ...system,
        index,
        y: 76 + index * 68,
        events: numericEvents,
        orderOnlyEvents,
      };
    });

  return {
    width,
    plot,
    projection: {
      ...timeProjection,
      breaks: timeProjection.breaks.map((gap) => ({ ...gap, x: gap.x + plot.left })),
    },
    lanes,
    travelPaths: projectWorldhopperPaths({ journeys: worldhopperJourneys, lanes }),
    ticks: makeTicks(viewport).map((year) => ({ year, x: project(year) })),
    height: 126 + Math.max(lanes.length, 1) * 68,
  };
};
