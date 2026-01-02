# HSML: Hyperspace Markup Language

A proof of concept that turns a nested HSML description into a deterministic Three.js scene graph. Edit the JSON live in the left pane and the layout/geometry update instantly in the preview. This repository was previously named `roomml-three` and now reflects its focus on Hyperspace Markup Language.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL to interact with the editor and viewer. The left pane accepts **HSML** text (line-oriented markup from `sampleHsml.ts`), and the right pane renders the measured/layout Three.js scene.

## Deployment

The project is configured for GitHub Pages. Pushing to `main` builds the site with Vite using a `/hsml/` base path and deploys the production bundle to Pages.

## Features

- HSML v0.1 parsing with inline styles and selector rules.
- Flex-style layout for containers (row/col, gap, basis/grow/shrink) producing stable layout boxes.
- Room geometry with floor, ceiling, and walls that cut window/door holes declared via `open:[door(...), window(...)]`.
- Placeholder boxes for leaf nodes sized by HSML layout.
- Validation for invalid sizes, opening bounds, and overflow warnings.

## HSML quickstart

```txt
House { layout:row gap:0.4 }

House/LivingRoom: "Living" { w:5 d:4 h:2.8 open:[ door(N,1.4,0.9,2.1) ] }
House/LivingRoom/Sofa { w:2.2 d:0.9 h:0.8 }
Room { t:0.12 }
```

Paths express hierarchy, inline style uses `{ key:value }` pairs, and rules such as `Room { t:0.12 }` act as name selectors.
- Debug helpers: grid/axes, wireframe toggle, and layout bounding boxes.

## Coordinates

- X: left → right
- Y: up
- Z: forward → back
- Origins sit at the top-left corner of each container/room footprint.
