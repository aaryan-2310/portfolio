# Candidate C — Needle Engine (deferred to round 2)

Needle Engine renders through Three.js. A code-only prototype here would exercise the
same renderer as Candidate A and measure nothing about what Needle is actually for:
the **Blender/Unity → glTF → web** authoring pipeline.

Needle enters the bake-off the moment a hero asset exists:

1. Model the command deck in Blender (PBR materials, imperfection maps, emissive screens,
   baked AO where cheap).
2. Export the same GLB twice:
   - loaded manually in the Three.js and PlayCanvas prototypes,
   - exported through Needle's Blender add-on with its lightmapping/compression pipeline.
3. Compare: visual result, export ergonomics, bundle weight, load time, and how much
   hand-written glue each path needed.

Round-2 checklist:
- [ ] Hero GLB of the deck (Blender)
- [ ] `npx needle-cloud` / vite plugin evaluation
- [ ] License and branding constraints check (free tier watermark)
- [ ] Bundle-size delta vs plain three
