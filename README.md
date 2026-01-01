# HSML: Hyperspace Markup Language

A proof of concept that turns a nested HSML description into a deterministic Three.js scene graph. Edit the JSON live in the left pane and the layout/geometry update instantly in the preview. This repository was previously named `roomml-three` and now reflects its focus on Hyperspace Markup Language.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL to interact with the editor and viewer.

## Deployment

The project is configured for GitHub Pages. Pushing to `main` builds the site with Vite using a `/hsml/` base path and deploys the production bundle to Pages.

## Features

- Flex-style layout for containers (row/col, gap, basis/grow/shrink) producing stable layout boxes.
- Room geometry with floor, ceiling, and walls that cut window/door holes.
- Furniture placeholder boxes with free/anchor placement.
- Validation for missing fields, opening bounds, furniture bounds, and overlap warnings.
- Debug helpers: grid/axes, wireframe toggle, and layout bounding boxes.

## Coordinates

- X: left → right
- Y: up
- Z: forward → back
- Origins sit at the top-left corner of each container/room footprint.
