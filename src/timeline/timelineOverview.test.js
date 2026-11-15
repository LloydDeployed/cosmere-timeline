import { createOverviewProjection } from './timelineOverview';

describe('event-focused timeline overview', () => {
  test('allocates more width to denser activity clusters and fixed width to gaps', () => {
    const denseDates = Array.from({ length: 10 }, (_, index) => 2000 + index * 10);
    const projection = createOverviewProjection({
      viewport: { start: 0, end: 5000 },
      eventDates: [0, 100, ...denseDates, 5000],
      width: 1000,
      gapThreshold: 500,
      gapWidth: 100,
    });

    expect(projection.gaps).toHaveLength(2);
    projection.gaps.forEach((gap) => {
      expect(gap.x2 - gap.x1).toBeCloseTo(100);
    });
    const sparseWidth = projection.clusters[0].x2 - projection.clusters[0].x1;
    const denseWidth = projection.clusters[1].x2 - projection.clusters[1].x1;
    expect(denseWidth).toBeGreaterThan(sparseWidth);
  });

  test('projects cluster and gap boundaries continuously', () => {
    const projection = createOverviewProjection({
      viewport: { start: 0, end: 5000 },
      eventDates: [0, 100, 2000, 2100, 5000],
      width: 1000,
      gapThreshold: 500,
      gapWidth: 100,
    });

    projection.gaps.forEach((gap) => {
      expect(projection.project(gap.start)).toBeCloseTo(gap.x1);
      expect(projection.project(gap.end)).toBeCloseTo(gap.x2);
      expect(projection.project((gap.start + gap.end) / 2)).toBeCloseTo(
        (gap.x1 + gap.x2) / 2
      );
    });
  });
});
