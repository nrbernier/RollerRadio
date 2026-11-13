# Downtone — to do

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
- `models/kit.js` + `models/preview.html`: a house kit (windows, doors, shop front, balcony, timbering, tiled roof,
  dormer, chimney; five houses) and eight pedestrians, as data. Not in the game yet. `models/README.md` says how
  to wire them in and what they cost. Start with the light version on one quarter and measure on a phone
- `models/kit-street.js`: the skater redrawn on the present rig (three colour sets), fourteen pieces of street
  furniture (finger post for finding your way, lamps, kiosk, tram shelter, bike rack…) and seven vehicles. Not in
  the game yet; README has the wiring. Looked at once in the preview, front three-quarter view only

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
