export const DEFAULT_OVERVIEW_GAP_THRESHOLD = 1000;
export const DEFAULT_OVERVIEW_GAP_WIDTH = 96;

const normalizedDates = (eventDates, viewport) => [...new Set(
  eventDates
    .filter(Number.isFinite)
    .filter((date) => date >= viewport.start && date <= viewport.end)
)].sort((a, b) => a - b);

const groupActivityClusters = (dates, viewport, gapThreshold) => {
  if (dates.length === 0) {
    return [{ start: viewport.start, end: viewport.end, dates: [] }];
  }

  const clusters = [{ start: dates[0], end: dates[0], dates: [dates[0]] }];
  dates.slice(1).forEach((date) => {
    const current = clusters[clusters.length - 1];
    if (date - current.end > gapThreshold) {
      clusters.push({ start: date, end: date, dates: [date] });
    } else {
      current.end = date;
      current.dates.push(date);
    }
  });

  if (clusters[0].start - viewport.start <= gapThreshold) {
    clusters[0].start = viewport.start;
  }
  const last = clusters[clusters.length - 1];
  if (viewport.end - last.end <= gapThreshold) {
    last.end = viewport.end;
  }
  return clusters;
};

const createGapRanges = (clusters, viewport) => {
  const gaps = [];
  if (clusters[0].start > viewport.start) {
    gaps.push({ kind: 'leading', start: viewport.start, end: clusters[0].start });
  }
  clusters.slice(1).forEach((cluster, index) => {
    gaps.push({ kind: 'between', start: clusters[index].end, end: cluster.start });
  });
  const last = clusters[clusters.length - 1];
  if (last.end < viewport.end) {
    gaps.push({ kind: 'trailing', start: last.end, end: viewport.end });
  }
  return gaps.map((gap) => ({ ...gap, duration: gap.end - gap.start }));
};

const allocateClusterWidths = (clusters, availableWidth) => {
  const minimumWidth = 48;
  const minimumTotal = clusters.length * minimumWidth;
  if (minimumTotal >= availableWidth) {
    return clusters.map(() => availableWidth / clusters.length);
  }

  const activityWeights = clusters.map((cluster) => (
    Math.max(
      Math.max(cluster.dates.length, 1) * 28,
      Math.sqrt(Math.max(cluster.end - cluster.start, 1)) * 4
    )
  ));
  const weightTotal = activityWeights.reduce((total, value) => total + value, 0);
  const remainder = availableWidth - minimumTotal;
  return activityWeights.map((weight) => (
    minimumWidth + remainder * weight / weightTotal
  ));
};

const projectWithin = (item, year) => {
  const span = item.end - item.start;
  if (span === 0) return (item.x1 + item.x2) / 2;
  return item.x1 + ((year - item.start) / span) * (item.x2 - item.x1);
};

export const createOverviewProjection = ({
  viewport,
  eventDates,
  width,
  gapThreshold = DEFAULT_OVERVIEW_GAP_THRESHOLD,
  gapWidth = DEFAULT_OVERVIEW_GAP_WIDTH,
}) => {
  const dates = normalizedDates(eventDates, viewport);
  const clusterRanges = groupActivityClusters(dates, viewport, gapThreshold);
  const gapRanges = createGapRanges(clusterRanges, viewport);
  const gapBudget = Math.min(gapRanges.length * gapWidth, width * 0.35);
  const renderedGapWidth = gapRanges.length === 0 ? 0 : gapBudget / gapRanges.length;
  const clusterWidths = allocateClusterWidths(clusterRanges, width - gapBudget);
  const sequence = [];

  const leadingGap = gapRanges.find(({ kind }) => kind === 'leading');
  if (leadingGap) sequence.push({ type: 'gap', ...leadingGap });
  clusterRanges.forEach((cluster, index) => {
    sequence.push({ type: 'cluster', ...cluster, allocatedWidth: clusterWidths[index] });
    const nextGap = gapRanges.find((gap) => (
      gap.start === cluster.end && (
        gap.kind === 'between' || (index === clusterRanges.length - 1 && gap.kind === 'trailing')
      )
    ));
    if (nextGap) sequence.push({ type: 'gap', ...nextGap });
  });

  let cursor = 0;
  const positioned = sequence.map((item) => {
    const itemWidth = item.type === 'gap' ? renderedGapWidth : item.allocatedWidth;
    const positionedItem = { ...item, x1: cursor, x2: cursor + itemWidth };
    cursor += itemWidth;
    return positionedItem;
  });
  const clusters = positioned.filter(({ type }) => type === 'cluster');
  const gaps = positioned.filter(({ type }) => type === 'gap');

  const project = (year) => {
    const clamped = Math.min(viewport.end, Math.max(viewport.start, year));
    const cluster = clusters.find(({ start, end }) => clamped >= start && clamped <= end);
    if (cluster) {
      if (cluster.start === cluster.end) {
        const hasPreviousGap = gaps.some(({ end }) => end === cluster.start);
        const hasNextGap = gaps.some(({ start }) => start === cluster.end);
        if (hasPreviousGap && !hasNextGap) return cluster.x1;
        if (hasNextGap && !hasPreviousGap) return cluster.x2;
      }
      return projectWithin(cluster, clamped);
    }
    const gap = gaps.find(({ start, end }) => clamped >= start && clamped <= end);
    if (gap) return projectWithin(gap, clamped);
    return clamped <= viewport.start ? 0 : width;
  };

  return { clusters, gaps, project };
};
