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
- Junctions are overlapping ribbons: where two streets meet, sidewalks and asphalt from both stack up, lane dashes
  run through the junction, and sidewalk corners stick out into the road (very visible at the old town's ring
  street where the radial streets join, at the ring's south gate, and at downtown's ring corners). Wanted: one
  junction piece per crossing (asphalt square, kerb radii, dashes stopping at the stop line).
- Ground patches trimmed by the district outlines have zig-zag triangle edges (downtown's pale ground and its
  sidewalk patches round the ring street, the market's sand ground). Give every district a clean edge (kerb,
  verge, or a hedge) and stop trimming patches triangle by triangle.
- The main street starts on a huge asphalt area at the observatory's terrace (with painted arrows): make the
  terrace a proper end (a little square, steps, the main street's last bend into it).
- Forest station: the cross street just stops under the viaduct. It needs a forecourt and a visible way up to the
  platforms (stairs or ramps) — same check for every elevated station.
- Old park trails (pale lines in the forest) start and end nowhere; reconnect them to the cross street, the pond,
  the glasshouse, the crag and the cable car's top station, or remove them.
- Old canal-quarter fill (benches, planters, paths from the old straight canal) is still placed on old lines
  across the new canal quarter: the quarter's fill should be redone along the winding canal.
- The arch spot's low ledge under the main street's stone bridge looks like loose white triangles from the quay.

### Districts
- Old town: still empty patches inside the wall where the blocks meet the curve of the wall and round the
  station's two stairways; fill them with houses that follow the wall. The rows round the open places outside
  the wall (terraceRow) are still tall town houses: make them village houses too. Big shop windows on the
  medieval houses are too large (shopFront glass); make them small medieval shop fronts.
- Between the old town and the market (south-east of the wall) the market's houses are tall flat-roofed town
  houses with modern-looking windows: next to the medieval town they look out of place.
- Market: a huge sand-coloured paved field with stalls scattered over it; it reads as empty. Give it a real
  layout (stall rows along lanes, the hall, the clock tower square) at the compact size.
- Docks: an enormous grey yard with containers scattered at random. Make proper container stacks in rows,
  sheds, rail sidings, and fewer of them.
- Vineyards: the rows read as flat green slabs and the terrace walls are broken into short pieces by the main
  street. Rebuild as irregular terraces following the contours, with visible vines (phase 6).
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

### Bugs found and fixed in this review
- The ferris wheel (and anything else that a builder both added to the scene and registered) was moved twice by
  the move-as-a-block code: a second wheel stood by downtown. Fixed; instanced meshes now stay at the origin.
- Turning circles were drawn where a street ends at a place (station, terrace, lido). Fixed.

## Compact city: still to place
- Docks and lakeshore along the new shore (they still follow the old one; the lakeshore's pier things sit in
  the water)
- People, animals, music spots and ambiences that still use old positions (life.js, fauna.js, music.js,
  game.js zones, debug.js jump list)

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
- Vineyards: improve them, make the grapes visible
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
