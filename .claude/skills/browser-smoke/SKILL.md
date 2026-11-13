---
name: browser-smoke
description: Read when verifying the Phaser client in a real browser
---

# Browser smoke (plan B)

Prefer **headless view tests** (`src/view/`, `npm test`) and thin Phaser wiring. Use browser smoke only when CDP/canvas checks are needed.

## Run

```bash
npm run serve          # terminal 1
npm run smoke:browser  # terminal 2 — JSON on stdout, exit 0/1
npm run smoke:browser -- --skip-cdp   # HTTP only (no Chrome)
npm run smoke:browser -- --url http://127.0.0.1:4000
```

## Layers (don't duplicate)

| Layer | Path | Verify with |
| --- | --- | --- |
| Combat rules | `src/engine/` | `npm run sim`, vitest |
| Fight presentation | `src/view/` | vitest (`fightSession.test.ts`) |
| Phaser view | `src/states/`, `src/entities/` | types, lint, `smoke:browser` |

NEVER put payoff math or tile/HUD layout in Phaser scenes — `projectFightView` owns positions and poses.

## Script

`bin/smoke-browser.ts` — HTTP 200 on `/` and `/dist/game.js`; optional headless Chrome CDP checks canvas buffer `924×565` and CSS aspect ~ `924/565`.

NEVER add one-off Python/node `-e` CDP probes in chat — extend `bin/smoke-browser.ts` instead.
