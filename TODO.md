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
- Downtown, still to do: look over every ground-floor kind on a phone (arcades, stilts, lobbies, plinths, cut corners,
  forecourts); the library and the baths found no lot and are missing; a plinth rail by the bank runs through its steps
- Old town & market: much more variety in the buildings, and more open spaces between them:
  inner courtyards, small playgrounds, squares (the ground for nine of them is levelled: `OLD_PADS` in relief.js; nothing built yet)
- Market: too self-similar. One real big market instead of several similar ones; vary the rest of the
  district, and make it less like the old town (idea: flat roofs, covered lanes, courtyard inns, a dyers' yard)

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
