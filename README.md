# RoomML + Three.js

A lightweight RoomML parser and Three.js builder that turns human-readable markup into renderable room geometry (floors, ceilings, walls, and openings) with a Vite demo.

## Scripts
- `npm install` – install dependencies
- `npm run dev` – start the Vite dev server and open the demo
- `npm run build` – build the production bundle
- `npm test` – run Vitest unit tests

## Structure
- `src/roomml/` – parser, builder, and shared types
- `src/demo/` – Vite demo app
- `public/samples/` – example `.roomml` file
- `tests/` – Vitest coverage for parser and builder
