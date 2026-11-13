# Model sheets

Models are designed here as data, looked at in `preview.html`, and only then wired into the game.
`kit.js` (houses, pedestrians) and `kit-street.js` (skater, street furniture, vehicles; load it after `kit.js`) have no three.js and no game code in them: they are lists of primitives and a few pure functions.
Open `preview.html` in a browser to see everything (it loads three r149 from cdnjs).

**Status: in the game since Nov 13** for traffic, Nao, pedestrians, bench, lamps, bins and old-town house fronts (see TODO.md for what is not used yet). `src/city/models.js` turns primitives into geometry; `H.kitPut` (districts.js) puts a piece into the cell batch.

## The format

One primitive:

```js
{ s, size, at, rot, col, seg, scale, tag }
```

| `s`     | `size`             | `at` is                         | in the game                                   |
|---------|--------------------|---------------------------------|-----------------------------------------------|
| `box`   | `[w, h, d]`        | the centre                      | `H.SH.BOX` / `K.box`                          |
| `cyl`   | `[rTop, rBot, h]`  | the centre                      | `H.SH.CYL` (needs a taper: see below)         |
| `cone`  | `[r, h]`           | the centre                      | `H.SH.CONE`                                   |
| `sph`   | `[r]`              | the centre                      | `K.sphere`                                    |
| `dome`  | `[r]`              | the centre of its flat base     | half a sphere                                 |
| `ico`   | `[r]`              | the centre                      | `H.SH.ICO`                                    |
| `prism` | `[len, h, base]`   | the centre of its base          | `prismGeo` (ridge along x, `len` long)        |
| `cap`   | `[r, len]`         | the centre                      | `CapsuleGeometry(r, len, 3, 8)` (skater only) |
| `torus` | `[R, r]`           | the centre; ring in the x–y plane | `TorusGeometry(R, r, 5, seg)`               |

- Metres, y up. `rot` is `[rx, ry, rz]` applied **Y, then X, then Z** (three's `'YXZ'`). Check the order `H.put` uses before trusting a part that has more than one angle.
- `seg` is the number of sides of a round shape (default 8; 6 for cones). `scale` squashes a `sph`, `dome` or `ico`.
- `col` is a palette slot (`wall`, `trim`, `roof`, `shutter`…) or a `#hex`. Each house in `KIT.HOUSES` carries the palette it was drawn in; in the old town, `wall`, `roof`, `roof2`, `roof3` and `shutter` should come from the quarter (`OLD_Q` in `roofs.js`).
- `tag` says what the part is to the player: `solid` (collide), `roof` (a slope to skate: use `K.ramp`, not a box), `grind` (put a hidden rail along its top), `bounce` (taut canvas). No tag: decoration only, no collision.
- `sign: true` marks the board a shop's name goes on (`wallSign`).

## Houses

`KIT.house(spec)` returns `{ parts, size, eave }` with the origin at the middle of the footprint on the ground and the street front on +z.
`spec`: `{ w, d, floors, kind, bays, rise, lite }`, `kind` one of `town`, `timber`, `stone`, `shop`, `market`.

Wiring it in (`oldHouse` and `flatHouse` in `src/city/roofs.js` and `oldmarket.js` are the places):

1. **Walls must lose their painted windows.** The game's `house` wall texture has windows in it; with real windows the wall has to be `plain`. This is the change that makes houses stop looking like apartment blocks.
2. Rotate the parts so +z points at the lane (`o.front`), move them to the house's place, and stand them on `bb.hi` (the high side of the lot). The game's own box already reaches down to `bb.lo`.
3. The game's collision and roof stay as they are (`H.bldg`, `H.roof`, the ridge rail). Take from the kit only what is drawn: skip the parts tagged `solid` and `roof` except where noted below, and skip the `prism`.
4. Roofs: the game draws a roof only as its far copy (`F.add` of a prism). Add the kit's roof slabs, tile courses, eave boards and ridge cap to the near batch on top of it.
5. Awnings and pergola shades tagged `bounce` need their collider (`W.boxes.push({... tag: 'bounce'})`), as `shopFront` does today. Balcony floors need a thin `K.box`, their top bar a `K.rail`: `gallery()` already does both, so the kit's balcony can replace its look only.

**Budget.** A house is about 40 triangles today. The full kit house is 1,500 to 2,600; `lite: true` is 560 to 890 (front only, plain windows, no tile courses). With about 1,100 houses in the old town, `lite` everywhere is roughly 700,000 triangles more than today. So:

- use `lite` by default, and only on houses that face a lane or a square;
- use the full version only for cells near the player, if the cell batch can swap detail in and out; otherwise not at all;
- measure the frame rate on a phone after the first quarter is done, before doing the others.

`H.put` has no tapered cylinder: the kit's tapered `cyl` parts (chimney pots, plant pots) can be drawn straight.

## Pedestrians

People in the game are instanced meshes, one per body part, coloured per instance (`personMeshes` in `src/city/life.js`). The kit keeps that scheme and adds variants. `KIT.BODY` holds, per slot, lists of primitives in which `sh` (0 to 1) is a shade of the instance colour, and `col` is a fixed colour (give that instance white).

| slot      | variants                                            | instance colour | frame                           |
|-----------|-----------------------------------------------------|-----------------|---------------------------------|
| `torso`   | jacket, coat, dress, hoodie                         | top             | body (origin at the feet)       |
| `leg`     | trousers, bare                                      | trousers / skin | hip `[±0.1, 0.84, 0]`           |
| `arm`     | sleeve                                              | top (skin with a dress) | shoulder `[±0.27, 1.38, 0]` |
| `hand`    | one                                                 | skin            | same matrix as its arm          |
| `head`    | one (with eyes and a nose)                          | skin            | body                            |
| `hair`    | short, long, bun, bob                               | hair            | body                            |
| `hat`     | cap, sunhat, beanie, hardhat                        | its own         | body                            |
| `acc`     | backpack, bag, apron, scarf, headphones, vest, cane, shopping, phone | its own | body, or an arm (`at`) |

Merge each variant's primitives into one geometry with `mergeParts` (vertex colour = `sh` as a grey, or `col`), make one `InstancedMesh` per variant, and give each person an index into each slot. A variant a person does not wear gets a zero-scale matrix, as the legs of sitting people do now. The pivots are the ones the walk animation already uses, moved slightly (hip 0.84, was 0.8): check feet still touch the ground.

`KIT.PEOPLE` lists eight people as choices of variants with the colours they were drawn in. In the game, keep choosing colours from `STYLE`, `PANTS`, `SKIN` and `HAIR`, and choose variants by district (the `where` field is a suggestion). Children are the same parts at 0.68.

**Budget.** A person is about 400 triangles today, 800 to 1,100 here, and the variants need about 25 instanced meshes where there are 9 now. The sitting pose (`PM.sit`) is not redrawn: keep it, or hide the legs of a seated dress or coat as today.

## The skater

`KIT.SKATER` redraws the player on the joints `class Rig` (`src/characters.js`) already has, so no animation changes. It holds one list of primitives per joint, each in that joint's own frame at scale 1: `hips`, `torso`, `head`, `arm`, `fore`, `leg`, `shin`, `skate`. `KIT.SKATER.pivots` repeats the Rig's offsets for reference; they are unchanged.

- In `Rig`, replace the meshes made by `part(...)` in each group with that joint's list (multiply sizes and positions by `s`). Left and right use the same list; where a part has `side: true`, flip its x on the other side.
- Colours are slots: `jacket`, `jacket2`, `sleeve`, `accent`, `shirt`, `pants`, `pants2`, `boot`, `boot2`, `frame`, `wheels`, `radio`, `radio2`, `hair`, `skin`, `glove`, `ink`, `glow`. `KIT.SKATER.looks` has three sets; "Signal" is the present character. The Rig's `spec.colors` has fewer slots, so the spec needs the new ones.
- Keep from the Rig, not from the kit: the drawn face (it goes on the part with `id: 'skull'`), the CRT head, the chest sign, `spec.prop`, and `antTip` (the part with `id: 'antTip'`, which the game makes glow).
- The hair, headphones and radio here replace `spec.hair` and the backpack for the main character only. Other characters that share `Rig` keep their own specs: make the new look a spec option, not the default.
- 3,300 triangles, about what the capsule-and-sphere rig is now. There is one skater, so this is not a cost.

## Street furniture

`KIT.FURNITURE` is a list of `[name, build, note]`; `build()` returns primitives with the origin on the ground and the front on +z. Colours are slots of `KIT.STREET_PAL`. Tags as for houses, plus `light`: a lamp face, to be drawn with the game's glowing material and given a pool of light at night as `H.lamp` does.

- These are meant to replace or join what `H.bench`, `H.lamp`, `H.planter` and `H.cafe` draw. Emit the parts with `H.put` (near batch only; nothing here needs a far copy except the street lamp and the kiosk).
- Collision: one box per piece is enough (the bounding box of its `solid` parts). Do not add a collider per primitive.
- `grind` parts get a `K.rail` along their top (bench back, bike hoops, planter rim). `bounce` parts (parasol, kiosk awning) get a `tag: 'bounce'` box, as `shopFront` does.
- The finger post's four boards are placeholders: give it one board per neighbouring district, turned to point there and painted in that district's colour, with the name on it (`sign: true`). This is the piece that helps with finding your way.
- The street lamp's banner and the tram shelter's panel are `sign: true` too.
- 80 to 450 triangles each. The bike rack and the café table are the heavy ones: use them in ones and twos.

## Vehicles

`KIT.VEHICLES` is a list of `{ name, build, box, paints, note }`. They fit `instKit` in `src/city/life.js` as it is: a part whose `col` is `'paint'` goes in the tinted mesh (colour `null` in `instKit`'s terms), every other part has its fixed colour. Origin on the road under the middle, nose to +z, as the present car.

- One `instKit` per vehicle kind. Share the 24 cars between city car, saloon, taxi, van and pickup; pick the body colour from that kind's `paints`.
- `box` is `[w, h, l]` for collision and for spacing in traffic. The bus is 10 m long: it needs its own following distance and wider turns, so start with it only on straight avenues, or leave it parked at tram shelters.
- The scooter has no rider: park it, do not drive it.
- Parts tagged `light` are head lamps and the taxi sign: brighter at night if the game does that for cars.
- A car today is about 200 triangles; these are 300 to 700. With 24 on the road that is under 15,000 triangles in all.
