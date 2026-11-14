import books from './books.json';
import events from './timelineEvents.json';
import shards from './shards.json';
import systems from './systemsData.json';
import { normalizeCanonicalData, validateCanonicalData } from './dataContract';

const canonicalData = validateCanonicalData(
  normalizeCanonicalData({ books, events, shards, systems })
);

export default canonicalData;
