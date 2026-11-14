# Cosmere Interactive Timeline

This is a timeline of the Cosmere, a universe created by Brandon Sanderson. It is a work in progress, and will be updated as new information is released and as I get better at building cool features.

## Development

This project was bootstrapped with [Create React App]

The timeline is rendered as one SVG backed by pure projection helpers. Use the
lane buttons to show or hide systems, the earlier/later controls to pan, and the
zoom controls or mouse wheel to change the visible year span. Numeric inputs
allow direct viewport bounds.

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
- [ ] World Hopper / Shard travels
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
