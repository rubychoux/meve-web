/* ============================================================
   MEVE — Pearl Ribbon Moon (N°04 Moon System)
   mother-of-pearl sphere · satin ribbon · orbiting pearls
   phase = light direction, driven by scroll (window.__mp)
   Desktop fine-pointer only. SVG remains as fallback.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const host = document.querySelector('.lune');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!host || reduced || !matchMedia('(pointer:fine)').matches) { /* keep SVG */ }
else init();

function init(){
  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
  }catch(e){ return; }

  const canvas = renderer.domElement;
  canvas.className = 'lune-gl';
  canvas.setAttribute('aria-hidden','true');
  host.appendChild(canvas);

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, .1, 40);
  camera.position.set(0, 0, 7.7);

  /* studio reflections — what makes nacre & satin read as materials */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .06).texture;
  scene.environmentIntensity = .22;   /* keep reflections, let the sun own the phase */

  const group = new THREE.Group();
  scene.add(group);

  /* ---------- the moon — mother of pearl ---------- */
  const moonGeo = new THREE.SphereGeometry(1, 128, 128);
  const moonMat = new THREE.MeshPhysicalMaterial({
    color: 0xfdf3f2,
    roughness: .3,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: .22,
    iridescence: .92,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [140, 460],
    sheen: .55,
    sheenColor: new THREE.Color(0xefb8c8),
    sheenRoughness: .5,
    envMapIntensity: .13,
  });
  moonMat.clearcoat = .45;
  moonMat.clearcoatRoughness = .3;
  moonMat.envMapIntensity = .5;
  /* faint nacre unevenness via procedural bump */
  moonMat.bumpMap = noiseTexture(256, 9);
  moonMat.bumpScale = .012;
  const moon = new THREE.Mesh(moonGeo, moonMat);
  group.add(moon);

  /* ---------- satin ribbon — wraps once, tail curls away ---------- */
  const ribbonPts = [];
  const wrapTilt = .62;                      /* radians — diagonal sash, not a Saturn ring */
  const rWrap = 1.05;
  for(let i = 0; i <= 120; i++){
    const t = i / 120;                       /* one wrap, seam tucked behind the moon */
    const a = (-Math.PI * 8/9) + t * Math.PI * 2;
    const y = Math.sin(a) * Math.sin(wrapTilt) * rWrap;
    const rr = Math.sqrt(Math.max(.0001, rWrap * rWrap - y * y)) + .014 + .04 * Math.sin(t * Math.PI);
    ribbonPts.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr));
  }
  /* tail: peel off from behind, sweep to the lower right, soft curl inside frame */
  const last = ribbonPts[ribbonPts.length - 1].clone();
  const tail = [
    last.clone().add(new THREE.Vector3(.4, -.22, .3)),
    last.clone().add(new THREE.Vector3(.85, -.55, .42)),
    last.clone().add(new THREE.Vector3(1.15, -.95, .28)),
    last.clone().add(new THREE.Vector3(1.1, -1.3, 0)),
    last.clone().add(new THREE.Vector3(.8, -1.42, -.25)),
  ];
  const curve = new THREE.CatmullRomCurve3([...ribbonPts, ...tail], false, 'centripetal', .12);

  const SEG = 340, W = .165;
  const frames = curve.computeFrenetFrames(SEG, false);
  const pos = new Float32Array((SEG + 1) * 2 * 3);
  const uv = new Float32Array((SEG + 1) * 2 * 2);
  const idx = [];
  const pt = new THREE.Vector3();
  for(let i = 0; i <= SEG; i++){
    const t = i / SEG;
    curve.getPointAt(t, pt);
    const bin = frames.binormals[Math.min(i, SEG - 1)];
    /* taper both ends to a point (head hides behind the moon) */
    const head = Math.min(1, t / .06);
    const tl = t < .82 ? 1 : Math.max(.05, 1 - (t - .82) / .19);
    const w = W * head * tl;
    const a = pt.clone().addScaledVector(bin, w);
    const b = pt.clone().addScaledVector(bin, -w);
    pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    uv.set([t, 0, t, 1], i * 4);
    if(i < SEG){
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const ribGeo = new THREE.BufferGeometry();
  ribGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  ribGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  ribGeo.setIndex(idx);
  ribGeo.computeVertexNormals();
  const ribMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8a0b8,
    roughness: .42,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color(0xffe4ec),
    sheenRoughness: .38,
    clearcoat: .35,
    clearcoatRoughness: .3,
    envMapIntensity: .4,
    side: THREE.DoubleSide,
  });
  ribMat.envMapIntensity = .9;
  ribMat.emissive = new THREE.Color(0x2a0f1a);   /* satin never goes fully dead in the dark */
  const ribbon = new THREE.Mesh(ribGeo, ribMat);
  ribbon.rotation.z = .34;                        /* diagonal sash, not a headband */
  ribbon.rotation.x = .12;
  group.add(ribbon);

  /* ---------- three drifting pearls ---------- */
  const pearlMat = moonMat.clone();
  pearlMat.iridescence = 1;
  pearlMat.envMapIntensity = .5;
  const pearls = [];
  [[1.34, .48, .055], [1.28, -.62, .04]].forEach(([r, y, s], i) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(s, 48, 48), pearlMat);
    p.userData = { r, y, a0: i * 2.4, sp: .12 + i * .05 };
    group.add(p);
    pearls.push(p);
  });

  /* ---------- lights: phase = where the sun stands ---------- */
  const sun = new THREE.DirectionalLight(0xfff4ee, 3.4);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xefb8c8, .12);      /* rose earthshine on the dark side */
  fill.position.set(-2.4, -1.2, 2.6);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x8e6a7d, .06));

  /* soft bloom halo behind the moon */
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTexture(), transparent: true, opacity: .5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  halo.scale.setScalar(5.4);
  halo.position.z = -1.6;
  scene.add(halo);

  /* ---------- sizing ---------- */
  const fit = () => {
    const s = host.clientWidth;
    if(!s) return;
    renderer.setSize(s, s, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  fit();
  addEventListener('resize', fit, { passive:true });

  /* ---------- pointer tilt ---------- */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => {
    tx = (e.clientX / innerWidth - .5) * .38;
    ty = (e.clientY / innerHeight - .5) * .26;
  }, { passive:true });

  /* ---------- render only while the chapter is on stage ---------- */
  let live = false, raf = null, tPrev = 0;
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      live = e.isIntersecting;
      if(live && raf === null) raf = requestAnimationFrame(tick);
    });
  }, { rootMargin: '10% 0px' });
  io.observe(host);

  let phase = 0;
  const tick = t => {
    if(!live){ raf = null; return; }
    const dt = Math.min(.05, (t - tPrev) / 1000 || .016);
    tPrev = t;

    /* scroll-driven phase — same progress the SVG HUD uses */
    const target = (window.__mp !== undefined) ? window.__mp : 1;
    phase += (target - phase) * .1;
    /* art-directed terminator: physical 15% is a hair-thin sliver, so ease the angle */
    const a = Math.PI * (1 - Math.pow(Math.max(0, phase), .62));
    sun.position.set(Math.sin(a) * 5, 1.35, Math.cos(a) * 5);
    sun.intensity = 4.4 + 1.2 * phase;
    halo.material.opacity = .1 + .42 * phase;

    /* idle grace: slow turn + pointer tilt */
    cx += (tx - cx) * .045;
    cy += (ty - cy) * .045;
    group.rotation.y = cx + Math.sin(t * .00012) * .1;
    group.rotation.x = cy * .8 + Math.cos(t * .00009) * .05;

    pearls.forEach(p => {
      const u = p.userData;
      const an = u.a0 + t * .001 * u.sp * .55;
      p.position.set(Math.cos(an) * u.r, u.y + Math.sin(t * .0004 + u.a0) * .06, Math.sin(an) * u.r);
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  host.classList.add('gl-on');

  /* ---------- procedural textures ---------- */
  function noiseTexture(size, scale){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for(let i = 0; i < img.data.length; i += 4){
      const v = 118 + Math.random() * 20;
      img.data[i] = img.data[i+1] = img.data[i+2] = v;
      img.data[i+3] = 255;
    }
    g.putImageData(img, 0, 0);
    /* soften */
    g.globalAlpha = .5;
    g.drawImage(c, 0, 0, size, size, -1, 0, size, size);
    g.drawImage(c, 0, 0, size, size, 0, -1, size, size);
    const tx2 = new THREE.CanvasTexture(c);
    tx2.wrapS = tx2.wrapT = THREE.RepeatWrapping;
    tx2.repeat.setScalar(scale);
    return tx2;
  }
  function haloTexture(){
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(128,128,0,128,128,128);
    gr.addColorStop(0, 'rgba(246,205,217,.85)');
    gr.addColorStop(.35, 'rgba(239,184,200,.34)');
    gr.addColorStop(.72, 'rgba(200,130,160,.09)');
    gr.addColorStop(1, 'rgba(200,130,160,0)');
    g.fillStyle = gr;
    g.fillRect(0,0,256,256);
    return new THREE.CanvasTexture(c);
  }
}
