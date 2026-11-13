// ============================================================
//  The model sheets (models/kit.js, models/kit-street.js) turned into game geometry.
//  A primitive { s, size, at, rot, scale, col, seg } becomes [geometry, matrix, colour].
// ============================================================
const Models = (() => {
  const geoCache = new Map();
  function prism(len, h, base) {
    const g = new THREE.BufferGeometry(), x = len / 2, z = base / 2, v = [[-x, 0, -z], [-x, 0, z], [-x, h, 0], [x, 0, -z], [x, 0, z], [x, h, 0]], f = [0, 1, 2, 3, 5, 4, 1, 4, 5, 1, 5, 2, 3, 0, 2, 3, 2, 5, 0, 3, 4, 0, 4, 1];
    g.setAttribute('position', new THREE.Float32BufferAttribute(f.flatMap(i => v[i]), 3)); g.computeVertexNormals(); return g;
  }
  // one geometry per shape and size (many parts repeat)
  function geo(p) {
    const s = p.size, sg = p.seg, key = p.s + s.join(',') + '/' + (sg || '');
    let g = geoCache.get(key); if (g) return g;
    g = p.s === 'box' ? new THREE.BoxGeometry(s[0], s[1], s[2]) : p.s === 'cyl' ? new THREE.CylinderGeometry(s[0], s[1], s[2], sg || 8) : p.s === 'cone' ? new THREE.ConeGeometry(s[0], s[1], sg || 6)
      : p.s === 'sph' ? new THREE.SphereGeometry(s[0], sg || 8, 6) : p.s === 'dome' ? new THREE.SphereGeometry(s[0], sg || 8, 4, 0, Math.PI * 2, 0, Math.PI / 2) : p.s === 'ico' ? new THREE.IcosahedronGeometry(s[0], 0)
      : p.s === 'cap' ? new THREE.CapsuleGeometry(s[0], s[1], 3, 8) : p.s === 'torus' ? new THREE.TorusGeometry(s[0], s[1], 5, sg || 12) : prism(s[0], s[1], s[2]);
    geoCache.set(key, g); return g;
  }
  const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  function mat(p, mirror) {
    const r = p.rot || [0, 0, 0]; _e.set(r[0], mirror ? -r[1] : r[1], mirror ? -r[2] : r[2], 'YXZ');
    return new THREE.Matrix4().compose(_v.set(mirror ? -p.at[0] : p.at[0], p.at[1], p.at[2]), _q.setFromEuler(_e), p.scale ? _s.fromArray(p.scale) : _s.set(1, 1, 1));
  }
  // parts → [geometry, matrix, colour]; colour: a palette slot, '#hex', or null for 'paint' (tinted per instance)
  function parts(list, pal = {}, o = {}) {
    return list.map(p => [geo(p), o.pre ? o.pre.clone().multiply(mat(p, o.mirror && p.side)) : mat(p, o.mirror && p.side), p.col === 'paint' ? null : p.col[0] === '#' ? p.col : (pal[p.col] || '#ff00ff')]);
  }
  return { geo, mat, parts };
})();
