const DATE_KINDS = ['point', 'range', 'order'];
const PRECISIONS = ['exact', 'approximate', 'unknown'];
const CONFIDENCES = ['high', 'medium', 'low', 'unknown'];

const asArray = (value) => {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeStringArray = (value) =>
  asArray(value).map((item) => String(item).trim()).filter(Boolean);

export const normalizeTimelineDate = (date) => {
  if (typeof date === 'number') {
    return {
      kind: 'point',
      value: date,
      precision: 'unknown',
      confidence: 'unknown',
    };
  }

  const normalized = {
    ...date,
    precision: date?.precision ?? 'unknown',
    confidence: date?.confidence ?? 'unknown',
  };

  if (normalized.kind === 'point') {
    normalized.value = Number(normalized.value);
  } else if (normalized.kind === 'range') {
    normalized.start = Number(normalized.start);
    normalized.end = Number(normalized.end);
  }

  return normalized;
};

const normalizeSource = (source) =>
  typeof source === 'string' ? { label: source } : { ...source };

const normalizeSpoilerScope = (scope = {}) => ({
  books: normalizeStringArray(scope.books),
  series: normalizeStringArray(scope.series),
});

const normalizeBook = (book) => ({
  id: book.id ?? slugify(book.title),
  title: book.title,
  publication: {
    year: book.publication?.year ?? book.publicationYear,
    publisher: book.publication?.publisher ?? book.publisher ?? null,
  },
  seriesOrSetting: book.seriesOrSetting ?? null,
  format: book.format ?? null,
  notes: normalizeStringArray(book.notes),
  references: normalizeStringArray(book.references),
});

const normalizeShard = (shard) => ({
  id: shard.id ?? slugify(shard.name),
  name: shard.name,
  vessel: {
    current: shard.currentVessel ?? null,
    living: shard.vesselLiving,
    former: normalizeStringArray(shard.formerVessels),
  },
  worlds: normalizeStringArray(shard.worlds),
  avatarWorlds: normalizeStringArray(shard.avatarsOn),
  relatedWorks: normalizeStringArray(shard.books),
});

const normalizeSystems = (systems) =>
  Object.entries(systems).map(([id, system]) => ({
    id,
    name: system.name ?? id,
    color: system.color,
    relatedWorks: normalizeStringArray(system.books),
    primaryWork: system.primary ?? null,
  }));

const normalizeEvent = (event) => ({
  id: event.id,
  date: normalizeTimelineDate(event.date ?? event.year),
  location: { system: event.location?.system ?? event.system },
  description: event.description ?? event.events,
  relatedWorks: normalizeStringArray(event.relatedWorks ?? event.books),
  shards: normalizeStringArray(event.shards),
  sources: asArray(event.sources).map(normalizeSource),
  spoilerScope: normalizeSpoilerScope(event.spoilerScope),
});

export const normalizeCanonicalData = ({ books, shards, systems, events }) => ({
  books: books.map(normalizeBook),
  shards: shards.map(normalizeShard),
  systems: normalizeSystems(systems),
  events: events.map(normalizeEvent),
});

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const validateDate = (date, path, errors) => {
  if (!date || !DATE_KINDS.includes(date.kind)) {
    errors.push(`${path}.kind must be one of: ${DATE_KINDS.join(', ')}`);
    return;
  }
  if (!PRECISIONS.includes(date.precision)) {
    errors.push(`${path}.precision must be one of: ${PRECISIONS.join(', ')}`);
  }
  if (!CONFIDENCES.includes(date.confidence)) {
    errors.push(`${path}.confidence must be one of: ${CONFIDENCES.join(', ')}`);
  }
  if (date.kind === 'point' && !Number.isFinite(date.value)) {
    errors.push(`${path}.value must be a finite number`);
  }
  if (date.kind === 'range') {
    if (!Number.isFinite(date.start)) errors.push(`${path}.start must be a finite number`);
    if (!Number.isFinite(date.end)) errors.push(`${path}.end must be a finite number`);
    if (Number.isFinite(date.start) && Number.isFinite(date.end) && date.start > date.end) {
      errors.push(`${path}.start must not be after ${path}.end`);
    }
  }
  if (
    date.kind === 'order' &&
    !isNonEmptyString(date.after) &&
    !isNonEmptyString(date.before)
  ) {
    errors.push(`${path} must specify before or after for an ordering-only date`);
  }
};

const validateUniqueIds = (items, path, errors) => {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isNonEmptyString(item.id)) {
      errors.push(`${path}[${index}].id must be a non-empty string`);
    } else if (seen.has(item.id)) {
      errors.push(`${path}[${index}].id duplicates ${JSON.stringify(item.id)}`);
    }
    seen.add(item.id);
  });
};

const validateStringArray = (value, path, errors) => {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  value.forEach((item, index) => {
    if (!isNonEmptyString(item)) errors.push(`${path}[${index}] must be a non-empty string`);
  });
};

export class DataValidationError extends Error {
  constructor(errors) {
    super(`Canonical timeline data is invalid:\n- ${errors.join('\n- ')}`);
    this.name = 'DataValidationError';
    this.errors = errors;
  }
}

export const validateCanonicalData = (data) => {
  const errors = [];
  const collections = ['books', 'shards', 'systems', 'events'];
  collections.forEach((name) => {
    if (!Array.isArray(data?.[name])) errors.push(`${name} must be an array`);
  });
  if (errors.length) throw new DataValidationError(errors);

  validateUniqueIds(data.books, 'books', errors);
  validateUniqueIds(data.shards, 'shards', errors);
  validateUniqueIds(data.systems, 'systems', errors);
  validateUniqueIds(data.events, 'events', errors);

  data.books.forEach((book, index) => {
    if (!isNonEmptyString(book.title)) errors.push(`books[${index}].title must be a non-empty string`);
    if (!Number.isInteger(book.publication?.year)) {
      errors.push(`books[${index}].publication.year must be an integer`);
    }
    validateStringArray(book.notes, `books[${index}].notes`, errors);
    validateStringArray(book.references, `books[${index}].references`, errors);
  });

  data.shards.forEach((shard, index) => {
    if (!isNonEmptyString(shard.name)) errors.push(`shards[${index}].name must be a non-empty string`);
    if (typeof shard.vessel?.living !== 'boolean') {
      errors.push(`shards[${index}].vessel.living must be a boolean`);
    }
    validateStringArray(shard.vessel?.former, `shards[${index}].vessel.former`, errors);
    validateStringArray(shard.worlds, `shards[${index}].worlds`, errors);
    validateStringArray(shard.avatarWorlds, `shards[${index}].avatarWorlds`, errors);
    validateStringArray(shard.relatedWorks, `shards[${index}].relatedWorks`, errors);
  });

  const systemIds = new Set(data.systems.map((system) => system.id));
  data.systems.forEach((system, index) => {
    if (!isNonEmptyString(system.name)) errors.push(`systems[${index}].name must be a non-empty string`);
    if (!isNonEmptyString(system.color)) errors.push(`systems[${index}].color must be a non-empty string`);
    validateStringArray(system.relatedWorks, `systems[${index}].relatedWorks`, errors);
  });

  data.events.forEach((event, index) => {
    validateDate(event.date, `events[${index}].date`, errors);
    if (!isNonEmptyString(event.description)) {
      errors.push(`events[${index}].description must be a non-empty string`);
    }
    if (!systemIds.has(event.location?.system)) {
      errors.push(
        `events[${index}].location.system references unknown system ${JSON.stringify(
          event.location?.system
        )}`
      );
    }
    validateStringArray(event.relatedWorks, `events[${index}].relatedWorks`, errors);
    validateStringArray(event.shards, `events[${index}].shards`, errors);
    if (!Array.isArray(event.sources)) {
      errors.push(`events[${index}].sources must be an array`);
    } else {
      event.sources.forEach((source, sourceIndex) => {
        if (!isNonEmptyString(source?.label)) {
          errors.push(
            `events[${index}].sources[${sourceIndex}].label must be a non-empty string`
          );
        }
      });
    }
    validateStringArray(event.spoilerScope?.books, `events[${index}].spoilerScope.books`, errors);
    validateStringArray(event.spoilerScope?.series, `events[${index}].spoilerScope.series`, errors);
  });

  if (errors.length) throw new DataValidationError(errors);
  return data;
};
