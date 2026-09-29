/* VERDOR — real-time 3D bottle (Three.js)
   Poses are computed every frame from section rects (hero / pour), so the bottle
   is scroll-scrubbed like a product film without competing tweens. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const S = window.__verdor || (window.__verdor = { intro: 0 });
const canvas = document.getElementById("gl");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  canvas.remove();
  S.ready && S.ready();
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
camera.position.set(0, 0, 12);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* lights: warm key + two golden rims so dark glass reads on a dark hero */
scene.add(new THREE.AmbientLight(0xfff4dd, 0.25));
const key = new THREE.DirectionalLight(0xfff1d6, 1.3); key.position.set(3, 4, 6); scene.add(key);
const rimL = new THREE.DirectionalLight(0xffd27a, 3.2); rimL.position.set(-5, 2, -4); scene.add(rimL);
const rimR = new THREE.DirectionalLight(0xffe6a8, 2.4); rimR.position.set(5, 1, -3); scene.add(rimR);

/* ---------------- bottle ---------------- */
const BOTTLE_H = 3.18;
const bottle = new THREE.Group();
const model = new THREE.Group();
model.position.y = -1.6;
bottle.add(model);
scene.add(bottle);

const profile = new THREE.SplineCurve([
  new THREE.Vector2(0.0, 0.0), new THREE.Vector2(0.44, 0.0), new THREE.Vector2(0.515, 0.06),
  new THREE.Vector2(0.52, 0.3), new THREE.Vector2(0.52, 1.95), new THREE.Vector2(0.49, 2.18),
  new THREE.Vector2(0.36, 2.42), new THREE.Vector2(0.22, 2.6), new THREE.Vector2(0.175, 2.74),
  new THREE.Vector2(0.17, 2.98), new THREE.Vector2(0.205, 3.02), new THREE.Vector2(0.2, 3.1), new THREE.Vector2(0.0, 3.1)
]).getPoints(140);

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x1d3510, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
  transparent: true, opacity: 0.62, envMapIntensity: 3.2, depthWrite: false
});
const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), glassMat);
glass.renderOrder = 2;
model.add(glass);

const oilMat = new THREE.MeshPhysicalMaterial({
  color: 0x6e6512, emissive: 0x3a2e00, emissiveIntensity: 0.35, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 0.9
});
const oilProfile = [
  new THREE.Vector2(0, 0.06), new THREE.Vector2(0.48, 0.06), new THREE.Vector2(0.495, 0.12),
  new THREE.Vector2(0.495, 1.98), new THREE.Vector2(0, 1.98)
];
const oil = new THREE.Mesh(new THREE.LatheGeometry(oilProfile, 72), oilMat);
model.add(oil);

const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a227, metalness: 1, roughness: 0.28, clearcoat: 0.5, envMapIntensity: 1.6 });
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.218, 0.36, 64), gold);
cap.position.y = 3.02;
model.add(cap);
const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.02, 64), gold);
capTop.position.y = 3.21;
model.add(capTop);
const band = new THREE.Mesh(new THREE.TorusGeometry(0.182, 0.018, 16, 64), gold);
band.rotation.x = Math.PI / 2; band.position.y = 2.72;
model.add(band);

/* label: canvas texture wrapped on the front of the body */
const LABEL_THETA = Math.PI * 0.92;
const lc = document.createElement("canvas");
lc.width = 1024; lc.height = 760;
const labelTex = new THREE.CanvasTexture(lc);
labelTex.colorSpace = THREE.SRGBColorSpace;
labelTex.anisotropy = 8;
function drawLabel() {
  const c = lc.getContext("2d"), W = lc.width, H = lc.height;
  c.fillStyle = "#f3efe4"; c.fillRect(0, 0, W, H);
  c.strokeStyle = "#c9a227"; c.lineWidth = 3; c.strokeRect(34, 34, W - 68, H - 68);
  c.lineWidth = 1; c.strokeRect(46, 46, W - 92, H - 92);
  c.fillStyle = "#1b2113"; c.textAlign = "center";
  // olive sprig
  c.save(); c.translate(W / 2, 150); c.fillStyle = "#6f8a3e";
  [[-1, -0.5], [1, 0.5], [-1, 0.3], [1, -0.3]].forEach(([s, r], i) => {
    c.save(); c.rotate(s * (0.9 + i * 0.12)); c.beginPath(); c.ellipse(0, -34, 11, 34, 0, 0, Math.PI * 2); c.fill(); c.restore();
  });
  c.fillStyle = "#3b2a3a"; c.beginPath(); c.ellipse(0, 8, 13, 16, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  c.fillStyle = "#1b2113";
  c.font = '400 150px "Fraunces", Georgia, serif';
  if ("letterSpacing" in c) c.letterSpacing = "18px";
  c.fillText("VERDOR", W / 2 + 9, 360);
  if ("letterSpacing" in c) c.letterSpacing = "10px";
  c.font = '400 30px "Space Mono", monospace';
  c.fillStyle = "#6b7051";
  c.fillText("EXTRA VIRGIN OLIVE OIL", W / 2 + 5, 430);
  c.fillStyle = "#c9a227"; c.fillRect(W / 2 - 90, 470, 180, 3);
  c.fillStyle = "#1b2113";
  c.font = 'italic 300 46px "Fraunces", Georgia, serif';
  if ("letterSpacing" in c) c.letterSpacing = "0px";
  c.fillText("First harvest · 2026", W / 2, 555);
  if ("letterSpacing" in c) c.letterSpacing = "8px";
  c.font = '400 24px "Space Mono", monospace'; c.fillStyle = "#6b7051";
  c.fillText("FINCA VERDOR · 500 ML", W / 2 + 4, 650);
  labelTex.needsUpdate = true;
}
drawLabel();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(drawLabel);

const label = new THREE.Mesh(
  new THREE.CylinderGeometry(0.526, 0.526, 1.12, 96, 1, true, -LABEL_THETA / 2, LABEL_THETA),
  new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.75, metalness: 0 })
);
label.position.y = 1.12;
model.add(label);

/* ---------------- hero glow (additive) ---------------- */
function radialTex(r, g, b, peak) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d"), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (let i = 0; i <= 12; i++) { const t = i / 12; gr.addColorStop(t, `rgba(${r},${g},${b},${(peak * Math.exp(-t * t * 5)).toFixed(4)})`); }
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
const glow = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: radialTex(201, 162, 39, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
);
glow.position.z = -2.5;
scene.add(glow);

/* ---------------- floating leaves + olives ---------------- */
const leafShape = new THREE.Shape();
leafShape.moveTo(0, -1); leafShape.quadraticCurveTo(0.24, 0, 0, 1); leafShape.quadraticCurveTo(-0.24, 0, 0, -1);
const leafGeo = new THREE.ShapeGeometry(leafShape, 12);
leafGeo.scale(0.42, 0.42, 0.42);
// slight bend along the length
{ const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, -x * x * 1.8); } leafGeo.computeVertexNormals(); }
const LEAVES = 34;
const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05 }), LEAVES);
const leafData = [];
const cA = new THREE.Color(0x6f8a3e), cB = new THREE.Color(0xa7b07c), tmpC = new THREE.Color();
for (let i = 0; i < LEAVES; i++) {
  leafData.push({
    x: (Math.random() - 0.5) * 2.2, y: (Math.random() - 0.5) * 1.6, z: -3.5 + Math.random() * 5,
    rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6,
    sp: 0.2 + Math.random() * 0.5, ph: Math.random() * 10, s: 0.7 + Math.random() * 0.7, par: 0.6 + Math.random() * 1.2
  });
  leaves.setColorAt(i, tmpC.copy(cA).lerp(cB, Math.random()));
}
scene.add(leaves);

const OLIVES = 9;
const olives = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.13, 24, 16).scale(1, 1.28, 1),
  new THREE.MeshPhysicalMaterial({ roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }),
  OLIVES
);
const oliveData = [];
const oCols = [0x3b2a3a, 0x5a3a4a, 0x6b7a2a, 0x2c2230];
for (let i = 0; i < OLIVES; i++) {
  oliveData.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 1.4, z: -2 + Math.random() * 3.5, ph: Math.random() * 10, par: 0.8 + Math.random() });
  olives.setColorAt(i, new THREE.Color(oCols[i % oCols.length]));
}
scene.add(olives);

/* ---------------- pour: dish, stream, pool ---------------- */
const dish = new THREE.Group();
const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f1e6, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
const dishProfile = new THREE.SplineCurve([
  new THREE.Vector2(0, 0), new THREE.Vector2(0.55, 0), new THREE.Vector2(0.62, 0.03),
  new THREE.Vector2(1.05, 0.2), new THREE.Vector2(1.12, 0.24), new THREE.Vector2(1.08, 0.26),
  new THREE.Vector2(0.62, 0.1), new THREE.Vector2(0, 0.08)
]).getPoints(60);
dish.add(new THREE.Mesh(new THREE.LatheGeometry(dishProfile, 96), ceramic));
const oilGold = new THREE.MeshPhysicalMaterial({ color: 0xa27a0e, emissive: 0x3d2a00, emissiveIntensity: 0.4, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.1 });
const pool = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.02, 64), oilGold);
pool.position.y = 0.1;
dish.add(pool);
dish.rotation.x = 0.32;
scene.add(dish);

class PartCurve extends THREE.Curve {
  constructor(base) { super(); this.base = base; this.a = 0; this.b = 1; }
  getPoint(t, out = new THREE.Vector3()) { return this.base.getPoint(this.a + (this.b - this.a) * t, out); }
}
const streamBase = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
const streamCurve = new PartCurve(streamBase);
const stream = new THREE.Mesh(new THREE.BufferGeometry(), oilGold);
scene.add(stream);

/* ---------------- layout helpers ---------------- */
let vw = innerWidth, vh = innerHeight, visH = 1, visW = 1, mobile = false;
function resize() {
  vw = innerWidth; vh = innerHeight;
  renderer.setSize(vw, vh, false);
  camera.aspect = vw / vh; camera.updateProjectionMatrix();
  visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  visW = visH * camera.aspect;
  mobile = camera.aspect < 0.85;
}
resize();
addEventListener("resize", resize);

const wx = (sx) => (sx - 0.5) * visW;
const wy = (sy) => (0.5 - sy) * visH;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const hero = document.getElementById("hero");
const pourSec = document.getElementById("pour");

const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => { ptr.tx = e.clientX / vw - 0.5; ptr.ty = e.clientY / vh - 0.5; });

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const v3 = new THREE.Vector3();
const e3 = new THREE.Euler();
const one = new THREE.Vector3(1, 1, 1);
const mouth = new THREE.Vector3();
const dir = new THREE.Vector3();

let firstFrame = true;
const clock = new THREE.Clock();

function frame() {
  const t = clock.getElapsedTime();
  ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
  const intro = reduced ? 1 : S.intro;

  const hr = hero.getBoundingClientRect();
  const hp = clamp(-hr.top / hr.height, 0, 1);          // hero scrolled-away progress
  const pr = pourSec.getBoundingClientRect();
  const enter = clamp(1 - pr.top / vh, 0, 1);             // pour section arriving
  const pinLen = Math.max(1, pr.height - vh);
  const pp = clamp(-pr.top / pinLen, 0, 1);              // pinned pour progress
  const leave = clamp(1 - pr.bottom / vh, 0, 1);          // pour section leaving

  const heroOn = hp < 1;
  const pourOn = enter > 0 && leave < 1;

  /* --- bottle pose --- */
  let sx, sy, h, rz, ry, rx;
  const s0 = BOTTLE_H;
  if (pourOn && !heroOn) {
    const e = smooth(0, 1, enter);
    const tilt = smooth(0.05, 0.3, pp) - smooth(0.82, 1, pp) * 0.72;
    sx = mobile ? 0.36 : 0.3;
    sy = (mobile ? 0.3 : 0.36) + (1 - e) * 0.9 - leave * 1.1;
    h = mobile ? 0.3 : 0.46;
    rz = -2.02 * tilt;
    ry = -0.35 + ptr.x * 0.2;
    rx = 0.08;
  } else {
    const drop = 1 - intro;
    sx = mobile ? 0.5 : 0.69;
    sy = (mobile ? 0.72 : 0.53) + drop * 0.55 - hp * 0.95;
    h = (mobile ? 0.42 : 0.7) * (1 - drop * 0.18);
    rz = hp * 0.35 - ptr.x * 0.06;
    ry = Math.sin(t * 0.45) * 0.75 + ptr.x * 0.6 + drop * 4.5;
    rx = ptr.y * 0.18;
  }
  const scale = (h * visH) / s0;
  bottle.position.set(wx(sx), wy(sy), 0);
  bottle.scale.setScalar(scale);
  bottle.rotation.set(rx, 0, rz);
  model.rotation.y = ry;
  bottle.visible = heroOn || pourOn;

  /* glow behind bottle in hero only */
  glow.visible = heroOn;
  glow.position.x = bottle.position.x; glow.position.y = bottle.position.y;
  glow.scale.setScalar(h * visH * 1.5);
  glow.material.opacity = intro * (1 - hp) * (0.8 + Math.sin(t * 0.9) * 0.2);

  /* --- leaves & olives (hero) --- */
  leaves.visible = olives.visible = heroOn;
  if (heroOn) {
    for (let i = 0; i < LEAVES; i++) {
      const d = leafData[i];
      v3.set(
        d.x * visW * 0.55 + Math.sin(t * d.sp + d.ph) * 0.25 - ptr.x * d.par * 0.4,
        d.y * visH * 0.6 + Math.cos(t * d.sp * 0.8 + d.ph) * 0.2 + hp * visH * d.par + (1 - intro) * -2,
        d.z
      );
      e3.set(d.rx + t * d.sp * 0.6, d.ry + t * d.sp * 0.4, d.rz);
      q.setFromEuler(e3);
      m4.compose(v3, q, one.clone().setScalar(d.s * intro));
      leaves.setMatrixAt(i, m4);
    }
    leaves.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < OLIVES; i++) {
      const d = oliveData[i];
      v3.set(
        d.x * visW * 0.5 + Math.sin(t * 0.3 + d.ph) * 0.15 - ptr.x * d.par * 0.5,
        d.y * visH * 0.55 + Math.sin(t * 0.5 + d.ph) * 0.18 + hp * visH * d.par,
        d.z
      );
      e3.set(t * 0.2 + d.ph, d.ph, 0.3);
      q.setFromEuler(e3);
      m4.compose(v3, q, one.clone().setScalar(intro));
      olives.setMatrixAt(i, m4);
    }
    olives.instanceMatrix.needsUpdate = true;
  }

  oil.scale.y = 1;
  /* --- pour: dish + stream + pool --- */
  dish.visible = pourOn && !heroOn;
  stream.visible = false;
  if (dish.visible) {
    bottle.updateMatrixWorld(true);
    mouth.set(0, 3.12, 0); model.localToWorld(mouth);
    dir.set(0, 1, 0).applyQuaternion(bottle.quaternion).normalize();

    const e = smooth(0, 1, enter);
    const dishY = Math.max(wy(0.86) , -visH / 2 + 0.5) - (1 - e) * visH * 0.9 - leave * visH * 1.1;
    const dishScale = scale * 1.35;
    const tipX = wx(mobile ? 0.36 : 0.3) + Math.sin(2.02) * 1.55 * scale;
    dish.position.set(tipX + 0.15 * scale, dishY, 0.2);
    dish.scale.setScalar(dishScale);

    const flow = smooth(0.22, 0.42, pp);
    const tail = smooth(0.8, 0.95, pp);
    const fill = smooth(0.3, 0.85, pp);
    pool.scale.set(0.05 + fill * 0.85, 1, 0.05 + fill * 0.85);
    pool.visible = fill > 0.001;
    oil.scale.y = 1 - fill * 0.55;

    if (flow > 0.001 && tail < 0.999) {
      const surf = dish.position.y + 0.12 * dishScale;
      const pts = streamBase.points;
      pts[0].copy(mouth);
      pts[1].copy(mouth).addScaledVector(dir, 0.22 * scale).add(v3.set(0, -0.08 * scale, 0));
      pts[2].set(lerp(pts[1].x, dish.position.x, 0.85), lerp(pts[1].y, surf, 0.45), 0.1);
      pts[3].set(dish.position.x, surf, 0.2);
      streamCurve.a = tail; streamCurve.b = flow;
      stream.geometry.dispose();
      stream.geometry = new THREE.TubeGeometry(streamCurve, 48, 0.034 * scale * (1 + Math.sin(t * 9) * 0.06), 10, false);
      stream.visible = true;
    }
  }

  if (bottle.visible || firstFrame) renderer.render(scene, camera);
  else if (!frame.cleared) renderer.clear();
  frame.cleared = !bottle.visible;

  if (firstFrame) { firstFrame = false; S.ready && S.ready(); }
}
renderer.setAnimationLoop(frame);
