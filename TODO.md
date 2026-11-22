# Downtone — to do

## Compact city: clean up every street and bridge (branch `compact-city`)
The street network is decided (PLAN.roads in plan.js); how it looks on the ground is still buggy. Ride every
street end to end on a phone, then fix:
- Junctions: where two streets meet, one clean junction (no overlapping ribbons, no z-fighting, no gaps in the
  sidewalk; the lane dashes stop at the junction). Same where downtown's grid streets meet its ring street.
- Ends: every street ends on another street or at a place (station forecourt, lido, observatory terrace); no
  stubs from the old districts' streets poking out past their new outlines (market lanes, old town lanes,
  park trails, the old canal-quarter quays).
- Ground patches cut by the district outlines (the blotchy grey and sand edges outside downtown's ring and
  round the market): give every district a clean edge (kerb or grass verge) instead.
- Bridges: every street that crosses the canal has a bridge that meets the street at both ends (heights,
  width, sidewalks, parapet rails line up); footbridges land on the quays; nothing dips into the canal.
- Street over or under the metro: the viaduct clears every street with room to spare; where the line is in a
  cutting near a street, the street bridges it. No pier stands in a street or a sidewalk.
- Old town streets (ring, three radials) on the hill: no steps in the ribbon, sidewalks follow the slope.
- Cars: they drive the new streets; check they turn at junctions and never drive through a station or a house.
- Then `tools/geom.py` and the physics/camera bot on the new map.

## Compact city: everything that still looks wrong (review of 21 Nov 2026, from the air and at street level)
Seen in test shots (tools/shot.py with "view" / "top" steps). Fix in roughly this order.

### Streets and junctions
- Junctions: asphalt plates now cover every crossing and T (sidewalks and dashes no longer run through the
  middle). Still missing: kerb radii at the corners (corners are square), stop lines, and a sliver of sidewalk
  shows where a plate meets a curved street at a shallow angle (main street × old town road above downtown).
- Downtown's own grid streets end in slanted cuts where the district outline trims them (north-west corner,
  next to the ring street): end them square on the ring street instead.
- Ground patches trimmed by the district outlines have zig-zag triangle edges (downtown's pale ground and its
  sidewalk patches round the ring street, the market's sand ground). Give every district a clean edge (kerb,
  verge, or a hedge) and stop trimming patches triangle by triangle.
- The main street starts on a huge asphalt area at the observatory's terrace (with painted arrows): make the
  terrace a proper end (a little square, steps, the main street's last bend into it).
- Forest station: the cross street just stops under the viaduct. It needs a forecourt and a visible way up to the
  platforms (stairs or ramps) — same check for every elevated station.
- The arch spot's low ledge under the main street's stone bridge looks like loose white triangles from the quay.

### Districts
- Old town: blocks now have a second ring of houses round a small court. Still empty patches inside the wall where the blocks meet the curve of the wall and round the
  station's two stairways; fill them with houses that follow the wall. The rows round the open places outside
  the wall (terraceRow) are still tall town houses: make them village houses too. Big shop windows on the
  medieval houses are too large (shopFront glass); make them small medieval shop fronts.
- Between the old town and the market (south-east of the wall) the market's houses are tall flat-roofed town
  houses with modern-looking windows: next to the medieval town they look out of place.
- Empty grass: the strip between the forest edge and downtown (under the metro's west side), the slopes between
  the summit and the old town, and the strip between downtown's ring and the canal quarter (under the metro's
  south side) are large plain lawns. Fill them: allotments, a park with paths, sports pitches, trees along the
  viaduct.
- Downtown: several blocks are empty (the cable car's corridor clears a diagonal through the middle); check which
  are empty on purpose. The cable now runs from the Needle down to Canal station across all of downtown: decide
  whether that is wanted.
- Marina: the sailboats are flat slabs with very tall masts; seen from afar the masts read as a grey comb.

### Water
- The canal now opens into the harbour basin. Still check from the quays: the stretch of quay between the
  embankment and the canal, the embankment's end in the lake, and the docks' quay wall west of x 222.
- The lake's shoreline is drawn by the 8 m terrain grid where it crosses the water: slightly angular up close.
  A smoother waterline (finer terrain along the shore, or a shore strip) would help everywhere.
- The canal's water is darker than the lake's; fine, but a short blend where they meet would look softer.

### Metro
- Check every station from the street: stairs/ramps up, forecourts, nothing of a district built under or into
  the viaduct (houses under the market's side of the line, the market hall's corner).
- The tunnel mouths on the old town's hill: look at them from the lanes (portal blocks, the cut in the slope).

### Playtest tour (22 Nov): 56 views at eye level, every district — what was found
Fixed:
- The game started underground: the spawn point was the old map's, and the summit terrace was built 58 m too low
  (heights in moved districts were shifted twice: the real height functions call each other by their patched names).
- The sky was a dark green sheet: the outer hills mesh assumed the map's width was a multiple of 48 m.
- Black voids across the canal: terrain tile skirts hanging in the open where the canal cuts the terrain.
- Downtown towers drawn black: boxes given with their corners in reverse came out inside out (now any order works).
- The sunken street had no road surface (now asphalt and sidewalks); downtown's open ground was bare sandy earth
  (now paved).
- The skatepark had never been built (the viaduct crossed its spot): now in the north-east corner above the old
  town, with a path from the ring street.
- Street bridges over the canal now follow the street and span the quays (the promenade's bridge stood askew).
- Vineyards: irregular parcels on the real outline, hedge rows on posts with grapes, on grass.
- No junction plates down in the sunken street (its cross streets pass over on bridges).
- Debug views now use the terrain detail of their own camera (coarse far tiles hid roads in the pictures).
Also done after feedback (22 Nov, morning):
- The tower ("The Twist"): 80 m, a twisting stack of glass storeys, a spiral gallery ramp from the round sky deck
  to the plaza (ride it down; its parapet top is the grind, nothing above it). The red pipe helix is gone.
- Docks: two container trails (single lines of stacks rising and falling, short gaps, pads at the turns, grinds
  only along the trail so a jump isn't pulled sideways), ramps up, a gantry crane with a high grind beam.
- Grapes on the vines; stone houses outside the wall get windows; the Old Town station's stairs come up inside
  the walls; quay paving never under the grass; paved forecourts under the elevated stations; the mountains
  across the lake taper away at both ends.
Second tour (22 Nov, 11:00), fixed: ground outside downtown was sand (now grass-green); white paving scraps
and straight allotment strips from the old strip fill (gone); the carousel had vanished (canal houses took its
lawn: built first now); brick boxes on the rail siding (now goods wagons); dark bands across the sunken street
(downtown's street ribbons draped into the cut: streets now stop at its rim); music garden gravel darker.
Still to fix:
- The stone bridge at the canal mouth: its underside reads as folded white planes from the quay.
- Docks: check in play that the trail's gaps are all jumpable and the sawtooth roofs ride well (three sheds,
  loading ramps up; about twenty loose containers now scattered about the yard).
- The tower's gallery: check in play that riding down never drops through between two slope pieces.
- Market: stalls irregular (waving rows, uneven spacing, some turned across, small squares with fountains and
  crate piles); things to ride by trade: spice heaps (soft kickers), barrel lines (grinds) and pyramids, marble
  fish/cheese counters (low ledges), bunting zig-zagging over the aisles (grinds), a loading yard east of the hall
  (sloped bay, dock edge grind, a truck to ride onto). Not yet ridden in play: check the heaps' slopes and the bunting.
- Canal quarter: three rows of houses now follow the winding canal; a few white paving scraps remain on the north
  quay west of the stone bridge; the allotment strips north of the canal still lie on old straight lines.
- Forest: the western strip is wooded now (its trees are smaller than the main forest's); the trails connect the
  glasshouse, the crag, the station and the pond.

### Checks (tools/geom.py, after the fixes below)
- Walkers through walls: 116 → 3; cars through walls: 24 → 2 (downtown loop at z 218, x −150/−183: something
  stands on the street by the building site); people standing in walls: 235 → 26 (mostly canal quarter quays).
  Rails: 92 flagged, 19 running under things: go through them.
- Fixed on the way: walker and stander paths of moved districts are now cut to their district (some ran off
  the map's west edge); the cross street's ribbon no longer dives into the sunken street (the bridge carries
  it, and cars follow bridge decks); every street is reserved before the districts are built (a house and the
  church's square stood on the old town's ring street); the church's square moved north-east of the ring.

### Lido (new)
- The lido's deck is a terrace 2 m above the lawn behind it (it must clear the ground at its back): the brick
  retaining wall faces the cable car's station; a few steps or a lawn bank on that side would soften it.
- The pool is shallow (you skate through it in a spray); deep water is the lake off the diving tower.
- Its record (surf, 138 bpm) takes over within about 60 m; check the crossfade from the lakeshore's 92 bpm.

### Bugs found and fixed in this review
- The move-as-a-block code re-processed every list on every group (a length was compared as an array), so each
  group trimmed away what the earlier groups had registered: most collision boxes, lamps, sounds and spots of
  the city were gone (only the last groups' remained). Fixed: buildings are solid again, 736 sound spots.
- The ferris wheel (and anything else that a builder both added to the scene and registered) was moved twice by
  the move-as-a-block code: a second wheel stood by downtown. Fixed; instanced meshes now stay at the origin.
- Turning circles were drawn where a street ends at a place (station, terrace, lido). Fixed.

## Compact city: still to place
- Docks and lakeshore along the new shore (they still follow the old one; the lakeshore's pier things sit in
  the water)
- Done: animals (herds, rabbits, fireflies, kites, fisherman, balloon, hat), birds, sailboats, ducks on the
  canal, the pier zone, the carousel (by the ferris wheel), the music garden. Still old: debug.js jump list
  (sunken street, vineyards, covered lane, music garden, skatepark, beach huts).

## Fixes and checks
- Pedestrians on the metro rails: seen in Central station and again near the forest (three walkers sit at platform
  depth near Central; cause not found yet)
- Central station exits need cleaning up: passageways too narrow, handrails not visible, and you can still fall
  through gaps between walls
- Check the new district music on a phone speaker (basses now have harmonics); retune the per-district move sounds (grind, tricks) to the new styles if they clash
- Turning circles at road ends look a bit blobby (make them true circles)
- Physics/camera bot (`tools/bot.py`) not run yet on the latest build

## Old town & market: life at roof level
- Ways up to the roofs, and pathways at roof level to grind along and rest on
- Bouncy fabric shades over the shops: arrange them as stepping stones, so you can bounce from one to the next up to roof level (alongside the other ways up). No trampolines.
- More grindable things at height, e.g. balconies
- Washing lines (with clothes pegs) and other links between houses at roof level, to grind on
- More natural ways to ride up buildings generally (the old sky-rail pipe was too odd)

## Street-level variety (and easier to find your way)
- Downtown: look over every ground-floor kind on a phone (arcades, stilts, lobbies, plinths, cut corners, forecourts)
- Old town & market: rebuilt (see Done). Still to do: ride them end to end on a phone; thin out anything that
  crowds the lanes; check the far view of the market's domes and wind towers

## Old town & market: life at roof level — what's left
- Shades set out as steps up a wall (`shadeSteps` in roofs.js, tagged `kick`): landing on one does not bounce you
  up yet (tested headless: the player stops on it). Look at `land()` in game.js: probably the ground found
  under the player is not the shade box
- The roof slides (`catslide`) are drawn by the far copy only, like every roof: check they look right close up
- Roof links (plank bridges, washing lines, lanterns): check none crosses a tower or a chapel roof

## Graphics: model sheets (models/)
In the game since Nov 13 (models/kit*.js are part of the city build; src/city/models.js turns them into geometry):
traffic (city car, saloon, taxi, van, pickup), Nao's body and skates, pedestrians (all variants), bench, lamps
(lantern / double street lamp with banner), litter bin, and the street fronts of 701 old-town houses (light version).
Not yet used:
- finger posts at crossroads (one board per neighbouring district: helps finding the way), kiosk, tram shelter,
  café table with parasol, bike rack, bollards, post box, hydrant, traffic lights, tree in a planter
- bus and scooter; the skater's radio / headphones look (kitOpts); house roofs and back faces from the kit
- market and other districts' houses (flatHouse in oldmarket.js) still have painted windows
- memory after all this: 323 MB of vertex data, 422 MB JS heap at the title screen (was 1,655 MB before Nov 13).
  Measure on a phone before adding more

## Music: move sounds (music/)
- `src/city/moves.js`: grinds, tricks, landings, pushes and runs sound per district (written licks on the district's
  own grid, a figure per trick, cadences, bass riffs). In the game; `music/preview.html` compares with the old code.
  Never listened to: levels are guesses, check on a phone (list in `music/README.md`)

## World
- More relief: only the sunken street so far. More streets at different heights, more bridges

## New places: to check
- Forest crag, building site, tower: built and looked at once each; not yet ridden end to end (path, zip line and
  cliff rail on the crag; ramps, crane and girder on the site; the pipe and the cable down from the tower)
- Their music (crag, site, skydeck in music.js) has not been listened to or balanced
- The cliff rail dips into the rock for a few metres near (-886, -701)
- `tools/geom.py` reports walkers through 'retain' boxes: those are bridges and the sunken street's walls, which
  walkers cross on the decks (the tool does not know that yet)

## Done
- Old town: five quarters with their own colours and house kinds (gabled, timbered, crow-stepped, stone, towers,
  flat terraces); nine open places (chapel, two playgrounds, well, fountain square, two walled gardens, boules,
  a courtyard block); courtyard blocks with galleries and stairs
- Market: one great market round the hall (cloth, spice, fruit, flower rows) under a clock tower; covered lanes
  to the north; three courtyard inns; the dyers' yard; flat roofs with terraces, pergolas, domes, wind towers
- Roof level: outside stairs and low-swept roofs up; plank bridges, washing lines (clothes on pegs) and lanterns
  between roofs, all grindable; galleries on the fronts
- Downtown: library and baths placed; the bank's plinth rail stays off its steps; kit ramps draw in the city
- Sunken street through downtown (twelve metres down, brick walls, three street bridges over it, slide rails, a ramp up)
- Metro crossings: two streets bridge the cutting north of downtown; the line clears the avenue and the street by Hilltop
- Downtown street level: ground floors of seven kinds, landmark fronts with signs (cinema, theatre, opera, hotel, bank,
  diner, museum, post, arcade, Roller Radio), shop awnings and signs
- New places with their own music: forest crag (path with rail, zip line, cliff rail), building site (frame, scaffold,
  crane, girder), the Needle (lift to a sky deck, a pipe five times round the tower, a cable to Central)
- New music in every district: jazz-funk downtown, 5/4 forest, highlife market, arranged dub canals, manouche old town,
  electro breaks docks, bossa lakeshore, phasing mallets at the observatory (A/B page: tools/music_ab)
- Central station: solid walls, safety net if you fall out of the world, entrances on the square with red
  roofs and totems, closer camera indoors
- Record shop: a real roofed cellar, giant record on the roof, RECORDS board and a sign over the door
- Buskers: on little stages with a visible instrument, amp, case and pennant
- Mountains carry on down both lake shores instead of stopping dead
- Canal comes out of a tunnel at its west end
- Streets stay visible in the far view (title screen)
