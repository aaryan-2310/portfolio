# worldline-lab — rendering-engine bake-off

Prototype ground for the WORLDLINE V2 redesign (see
`docs/superpowers/specs/2026-08-08-worldline-brief.md`). The same cinematic
cockpit scene is built once per candidate engine so the choice is made on
evidence, not preference.

```bash
yarn            # install (three, playcanvas, vite)
yarn dev        # http://localhost:4330 — hub page links both prototypes
```

| Path | Candidate | Status |
|---|---|---|
| `three/` | Three.js 0.182 | ready |
| `playcanvas/` | PlayCanvas engine 2.x | ready |
| `needle/` | Needle Engine | deferred — needs the Blender hero asset (see its README) |

## The shared scene contract

`shared/spec.ts` is the single source of truth: cockpit geometry, palette, camera
choreography, console copy, display-light strength, the equirect environment
painting, and reduced-motion rules. Both prototypes import it. If an engine can't
express part of the spec idiomatically, its on-screen HUD carries a flag saying so —
those flags are findings, not bugs.

## What to judge

- **Fidelity** — how metal answers the warm key light; whether screens visibly light
  the hull around them; glass believability; planet limb.
- **Cost** — the HUD is measured, not decorative: FPS, frame ms, draw calls,
  JS heap, ms-to-first-frame.
- **Interaction** — hover/click the centre console; feel of the 1.6 s cinematic
  camera transition; Esc returns.
- **Angular fit** — recorded in `docs/superpowers/specs/2026-08-08-worldline-tech-decisions.md`,
  including the datapoint that `angular-three@4.x` requires Angular ≥ 20 while the
  portfolio is on Angular 19.

## Round 2 (asset round)

The engines only truly separate once a hero-quality GLB exists. Round 2 loads the
same Blender-authored deck model in every candidate and re-judges fidelity, load
weight, and pipeline ergonomics. Until then, treat round 1 as: *architecture feel,
integration cost, and the floor of what each engine gives you for free.*
