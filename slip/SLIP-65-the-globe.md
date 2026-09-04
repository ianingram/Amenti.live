### 65 · THE GLOBE — geometry instead of a projection
Raised 4 Sep, after the map got zoom and relief the same night. **A bigger move
than anything else in #64**, recorded before it is started rather than after.

**THE SENTENCE THAT SETTLED IT.** *A globe is a globe. It is a projection
itself. No need to build a projection when geometry is the projection.*

Every flat map is a compromise about how to lie. Equirectangular — what the map
draws today — stretches horizontal distance about DOUBLE at 60°N, so the chart
already misleads about the one thing a reader most wants from it: how far
anything is from anything. Rome to Alexandria against Rome to London reads
wrong right now. A sphere does not have that argument, because it is not an
argument. It is the shape.

**WHAT THIS RETIRES.** Two ideas were considered and are now closed:

- **TILT ON THE FLAT CHART — refused, and not on honesty grounds.** RELIEF.jpg
  is a PICTURE of terrain with the shading baked flat. Tilting it skews a
  photograph lying on a plane: no gorge deepens, no ridge rises, and everything
  near the horizon compresses until pins are unreadable and distances stop
  being comparable. It does not deliver the thing it looks like it delivers.
- **"CURVED AS YOU ZOOM IN" — the physics runs the other way.** Over a 500 km
  span the earth's bulge is a fraction of a percent. A patch does not become
  curved as you go in; it becomes FLATTER, correctly. Curvature is a
  ZOOMED-OUT phenomenon, which is exactly where the flat chart's distortion
  lives too. Both problems are the same problem and the globe answers both.

**WHY IT IS CHEAPER THAN IT SOUNDS.**
- **The relief is already the right file.** An equirectangular image is exactly
  the layout a sphere texture expects: `u = (lon+180)/360`, `v = (90-lat)/180`.
  RELIEF.jpg maps onto a sphere with NO resampling. The afternoon's work stands.
- **The pins get simpler, not harder.** Lat/lon to a point on a sphere is three
  lines of trigonometry. No projection maths, no distortion caveat, and a pin
  on the far side is BEHIND THE EARTH rather than needing a rule to hide it.
- **Trade routes become drawable.** A route is a great circle. On a flat chart
  a great circle looks like an arbitrary curve, which is why the
  Mediterranean-to-India question is unanswerable on the current surface. On a
  sphere it is a straight line across the surface and needs no defending.
- **There is precedent aboard.** amenti-timeline.js already renders a
  three-tier sky; the ship has done spatial rendering before.

**THE HONEST COST.** It is a different renderer. Everything built on 4 Sep
against an SVG scene would need rebuilding against a 3D one: the label
collision cull, the persisting seat nodes and their fades, the anchor mark, the
aperture scrub, the sky band, Jupiter's return line. None of it is wasted —
the RULES all transfer — but the drawing does not.

**THE SHAPE TO BUILD TOWARD.**
- **THE BLUEPRINT STAYS FLAT AND STAYS THE DEFAULT.** It is the better
  INSTRUMENT: flat land, a hard coast, names that read at once because nothing
  competes with them. A reader looking for where a soul stood is not reading
  terrain.
- **THE ATLAS BECOMES THE GLOBE.** It is the better PICTURE, and the point of
  it is seeing the earth rather than reading a list. The toggle that exists
  today already frames this correctly: the atlas is a choice, not the state a
  reader is dropped into.

**THE ONE PREREQUISITE, AND IT IS WORTH DOING ALONE.** `WORLD.json` currently
stores a PRE-PROJECTED path string — the equirectangular maths is baked into
the file. It should hold lon/lat rings and be projected at draw time. That is
an afternoon, it makes the flat map carry any projection, and NOTHING ELSE HERE
CAN START UNTIL IT IS DONE.

- **Acceptance test:** WORLD.json holds lon/lat, not screen coordinates, and
  the flat blueprint renders from it unchanged. Then: a sphere, correctly
  textured, with 864 pins on it, and a great circle from Rome to Alexandria
  that a reader can measure against one from Rome to London and see that the
  first is shorter — which the map today gets wrong.
