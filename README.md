# Cosmere Interactive Timeline

This is a timeline of the Cosmere, a universe created by Brandon Sanderson. It is a work in progress, and will be updated as new information is released and as I get better at building cool features.

## Development

This project was bootstrapped with [Create React App]

The timeline is rendered as one SVG backed by pure projection helpers. Use the
lane buttons to show or hide systems, the earlier/later controls to pan, and the
zoom controls or mouse wheel to change the visible year span. Numeric inputs
allow direct viewport bounds.

Event filters compose across structured book/work, character, Shard, and
world/system fields. Story text search is intentionally limited to event
descriptions; it is not treated as character metadata. Clearing filters restores
all lanes but preserves the current viewport.

Spoiler hiding uses only explicit event `spoilerScope` metadata. The interface
reports metadata coverage because an event without a scope is unknown, not
necessarily spoiler-free. Character filtering likewise depends on the optional
canonical `characters` array; the control stays disabled until events carry
those tags.

Worldhopper curves are derived from `src/data/worldhoppers.json`, which stores
ordered appearance anchors by canonical event ID plus a primary-book source and
limitation note. The SVG never stores hand-authored route geometry: pure journey
and projection helpers connect only adjacent tagged appearances whose two event
anchors remain visible. Filtering, hiding a lane, or moving an endpoint outside
the viewport removes that segment rather than inventing a shortcut across the
missing appearance. The initial Hoid anchors are deliberately story-level
chronology markers, not claims about exact arrival or departure dates. The data
contract supports additional travelers, but none should be added until their
identity and spoiler scope can be represented explicitly.

Approximate and unknown-precision dates use hollow markers and an `≈` label.
Date ranges render as spans. Ordering-only events stay outside the numeric axis
rather than being assigned an invented year.

## Roadmap

- [x] Basic timeline with events
- [x] Zoom in/out
- [x] Scroll/zoom bar?
- [ ] Pan left/right
- [x] Select worlds
- [ ] Filtering by series/books
- [ ] Dynamic custom filtering
- [ ] Links to Coppermind
- [x] World Hopper travels
- [ ] Condensing time spans without events

## Design

### Events

- Wiki links
- Shapes and colors for categories and types
  - Books
  - Shards
  - Characters

## Notes

- SLA5 ~ 10958.8
- 4950 ~ the Sibling is created (6000 y)
- 3900 ~ first people come to Roshar (7000 y)
