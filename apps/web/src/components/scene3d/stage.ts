import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Fog,
  SRGBColorSpace,
  WebGLRenderer,
  type Object3D,
} from "three";
import type { Actor3D, Prop3D, Scene3D } from "@/lib/scene3d/types";

const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const SPEED = 2.6; // world units per second
const TURN = 10; // how quickly a figure turns, per second

/** Draws a rounded badge with a number or short word on it, as a texture. */
function badge(text: string, bg: string, fg: string, w = 128, h = 128): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(6, 6, w - 12, h - 12, 24);
  g.fill();
  g.fillStyle = fg;
  g.font = `bold ${Math.round(h * 0.52)}px system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

interface Figure {
  group: Group;
  legL: Group;
  legR: Group;
  armL: Group;
  armR: Group;
  body: Group;
  ticket: Mesh;
  label: Sprite | null;
  labelText: string;
  phase: number;
  yaw: number;
  target: { x: number; z: number };
  face: number;
  exiting: boolean;
  pose: "idle" | "serve";
  listed: boolean;
}

export interface Stage {
  update(scene: Scene3D, instant: boolean): void;
  setSize(w: number, h: number): void;
  setVisible(v: boolean): void;
  dispose(): void;
}

/** A small stage: floor, light, a camera that frames the scene, and procedural figures that walk to wherever the description puts them. */
export function createStage(canvas: HTMLCanvasElement, width: number, height: number): Stage {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, width / height, 0.1, 100);
  scene.add(new HemisphereLight(0xffffff, 0x8899aa, 1.15));
  scene.add(new AmbientLight(0xffffff, 0.35));
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(-4, 9, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  scene.add(sun);

  const rootStyle = () => getComputedStyle(document.documentElement);
  const floorColor = () => {
    const v = rootStyle().getPropertyValue("--surface-2").trim();
    try {
      return new Color(v || "#e8ebf5");
    } catch {
      return new Color(0xe8ebf5);
    }
  };
  const bgColor = () => {
    const v = rootStyle().getPropertyValue("--bg").trim();
    try {
      return new Color(v || "#f6f7fb");
    } catch {
      return new Color(0xf6f7fb);
    }
  };
  scene.background = bgColor();
  scene.fog = new Fog(bgColor(), 16, 38);
  const floor = new Mesh(new PlaneGeometry(90, 60), new MeshStandardMaterial({ color: floorColor(), roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // shared geometry
  const geo = {
    torso: new CapsuleGeometry(0.25, 0.42, 6, 12),
    head: new SphereGeometry(0.22, 20, 16),
    limbLeg: new BoxGeometry(0.15, 0.56, 0.17).translate(0, -0.28, 0),
    limbArm: new BoxGeometry(0.12, 0.5, 0.13).translate(0, -0.25, 0),
    ticket: new BoxGeometry(0.26, 0.16, 0.02),
    spot: new CircleGeometry(0.42, 28),
    counter: new BoxGeometry(0.7, 1.0, 2.1),
    top: new BoxGeometry(0.95, 0.08, 2.3),
    post: new CylinderGeometry(0.04, 0.04, 1.3, 8),
  };
  const mats = new Map<number, MeshStandardMaterial>();
  const mat = (c: number, rough = 0.7) => {
    const key = c * 10 + Math.round(rough * 5);
    let m = mats.get(key);
    if (!m) {
      m = new MeshStandardMaterial({ color: c, roughness: rough });
      mats.set(key, m);
    }
    return m;
  };
  const textures: CanvasTexture[] = [];
  const figures = new Map<string, Figure>();
  const propObjs = new Map<string, Object3D>();
  let visible = true;
  let raf = 0;
  let last = 0;
  let disposed = false;
  let target: Scene3D | null = null;
  let instantNext = false;
  let aim = { x: 0, dist: 11 };

  function makeFigure(a: Actor3D): Figure {
    const group = new Group();
    const body = new Group();
    group.add(body);
    const shirt = mat(a.color);
    const skin = mat(SKIN[Math.abs(a.id.length * 7 + a.id.charCodeAt(a.id.length - 1)) % SKIN.length]!, 0.6);
    const pants = mat(a.kind === "clerk" ? 0x1e293b : 0x475569);
    const torso = new Mesh(geo.torso, shirt);
    torso.position.y = 1.05;
    torso.castShadow = true;
    body.add(torso);
    const head = new Mesh(geo.head, skin);
    head.position.y = 1.74;
    head.castShadow = true;
    body.add(head);
    if (a.kind === "clerk") {
      const cap = new Mesh(new BoxGeometry(0.46, 0.1, 0.46), mat(0xdc2626));
      cap.position.y = 1.94;
      body.add(cap);
    }
    const leg = (x: number) => {
      const g = new Group();
      g.position.set(x, 0.58, 0);
      const m = new Mesh(geo.limbLeg, pants);
      m.castShadow = true;
      g.add(m);
      group.add(g);
      return g;
    };
    const arm = (x: number) => {
      const g = new Group();
      g.position.set(x, 1.42, 0);
      const m = new Mesh(geo.limbArm, skin);
      m.castShadow = true;
      g.add(m);
      body.add(g);
      return g;
    };
    const legL = leg(-0.1);
    const legR = leg(0.1);
    const armL = arm(-0.34);
    const armR = arm(0.34);
    const ticket = new Mesh(geo.ticket, mat(0xfacc15, 0.5));
    ticket.position.set(0, -0.52, 0.1);
    ticket.visible = false;
    armR.add(ticket);
    scene.add(group);
    const from = a.from ?? { x: a.x, z: a.z };
    group.position.set(from.x, 0, from.z);
    return { group, legL, legR, armL, armR, body, ticket, label: null, labelText: "", phase: 0, yaw: a.face ?? 0, target: { x: a.x, z: a.z }, face: a.face ?? 0, exiting: false, pose: "idle", listed: true };
  }

  function setLabel(f: Figure, text: string | undefined) {
    const t = text ?? "";
    if (f.labelText === t) return;
    f.labelText = t;
    if (f.label) {
      f.group.remove(f.label);
      f.label.material.map?.dispose();
      f.label.material.dispose();
      f.label = null;
    }
    if (!t) return;
    const tex = badge(t, "#ffffff", "#111827");
    textures.push(tex);
    const s = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    s.scale.set(0.62, 0.62, 1);
    s.position.y = 2.38;
    s.renderOrder = 10;
    f.label = s;
    f.group.add(s);
  }

  function makeProp(p: Prop3D): Object3D {
    const g = new Group();
    if (p.kind === "counter") {
      const base = new Mesh(geo.counter, mat(0x92400e, 0.8));
      base.position.set(0, 0.5, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);
      const top = new Mesh(geo.top, mat(0xd6a15c, 0.6));
      top.position.set(0, 1.04, 0);
      top.castShadow = true;
      g.add(top);
      if (p.sign) {
        const post = new Mesh(geo.post, mat(0x475569));
        post.position.set(0.05, 1.65, 0);
        g.add(post);
        const tex = badge(p.sign, "#2563eb", "#ffffff", 320, 110);
        textures.push(tex);
        const sign = new Mesh(new PlaneGeometry(1.7, 0.6), new MeshStandardMaterial({ map: tex, roughness: 0.6 }));
        sign.position.set(0.05, 2.15, 0.02);
        g.add(sign);
      }
    } else {
      const spot = new Mesh(geo.spot, new MeshStandardMaterial({ color: 0x94a3b8, roughness: 1, transparent: true, opacity: 0.55 }));
      spot.rotation.x = -Math.PI / 2;
      spot.position.y = 0.01;
      spot.receiveShadow = true;
      g.add(spot);
    }
    g.position.set(p.x, 0, p.z);
    scene.add(g);
    return g;
  }

  function frameCamera(s: Scene3D) {
    const span = s.maxX - s.minX + 2.2;
    const fov = (camera.fov * Math.PI) / 180;
    const dist = Math.max(6.2, span / (2 * Math.tan(fov / 2) * camera.aspect) + 0.8);
    aim = { x: (s.minX + s.maxX) / 2, dist };
  }

  function applyCamera() {
    camera.position.set(aim.x, 2.4 + aim.dist * 0.2, aim.dist * 0.97);
    camera.lookAt(aim.x, 1.0, 0);
  }

  function step(dt: number): boolean {
    let moving = false;
    for (const [id, f] of figures) {
      const dx = f.target.x - f.group.position.x;
      const dz = f.target.z - f.group.position.z;
      const dist = Math.hypot(dx, dz);
      const walking = dist > 0.02;
      if (walking) {
        const adv = Math.min(dist, SPEED * dt);
        f.group.position.x += (dx / dist) * adv;
        f.group.position.z += (dz / dist) * adv;
        moving = true;
      } else if (f.exiting) {
        scene.remove(f.group);
        figures.delete(id);
        continue;
      }
      const wantYaw = walking ? Math.atan2(dx, dz) : f.face;
      let dy = wantYaw - f.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      f.yaw += dy * Math.min(1, TURN * dt);
      if (Math.abs(dy) > 0.02) moving = true;
      f.group.rotation.y = f.yaw;
      if (walking) f.phase += dt * 10;
      else f.phase *= Math.max(0, 1 - dt * 12);
      const sw = Math.sin(f.phase) * (walking ? 0.75 : Math.abs(f.phase) < 0.05 ? 0 : 0.2);
      f.legL.rotation.x = sw;
      f.legR.rotation.x = -sw;
      f.armL.rotation.x = -sw * 0.8;
      f.armR.rotation.x = f.pose === "serve" ? -1.15 : sw * 0.8;
      f.body.position.y = walking ? Math.abs(Math.sin(f.phase)) * 0.05 : 0;
      if (Math.abs(f.phase) > 0.05) moving = true;
    }
    return moving;
  }

  function render() {
    applyCamera();
    renderer.render(scene, camera);
  }

  function loop(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const moving = step(dt);
    render();
    if (moving && visible) raf = requestAnimationFrame(loop);
    else last = 0;
  }
  const wake = () => {
    if (!raf && !disposed && visible) raf = requestAnimationFrame(loop);
  };

  function settle() {
    // jump every figure to its place (used for reduced motion, the first picture and when a scene is not visible)
    for (const [id, f] of figures) {
      if (f.exiting) {
        scene.remove(f.group);
        figures.delete(id);
        continue;
      }
      f.group.position.set(f.target.x, 0, f.target.z);
      f.yaw = f.face;
      f.group.rotation.y = f.yaw;
      f.phase = 0;
      f.legL.rotation.x = f.legR.rotation.x = f.armL.rotation.x = 0;
      f.armR.rotation.x = f.pose === "serve" ? -1.15 : 0;
    }
  }

  return {
    update(s, instant) {
      target = s;
      instantNext = instant;
      frameCamera(s);
      for (const f of figures.values()) f.listed = false;
      for (const a of s.actors) {
        let f = figures.get(a.id);
        if (!f) {
          f = makeFigure(a);
          figures.set(a.id, f);
        }
        f.listed = true;
        f.exiting = a.exit === true;
        f.target = { x: a.x, z: a.z };
        f.face = a.face ?? f.face;
        f.pose = a.pose ?? "idle";
        f.ticket.visible = a.holds === "ticket";
        setLabel(f, a.label);
      }
      // figures no longer listed that are already walking out finish their walk; anything else disappears
      for (const [id, f] of [...figures]) {
        if (!f.listed && !f.exiting) {
          scene.remove(f.group);
          figures.delete(id);
        }
      }
      const wanted = new Set(s.props.map((p) => p.id));
      for (const [id, o] of [...propObjs]) {
        if (!wanted.has(id)) {
          scene.remove(o);
          propObjs.delete(id);
        }
      }
      for (const p of s.props) if (!propObjs.has(p.id)) propObjs.set(p.id, makeProp(p));
      floor.position.x = (s.minX + s.maxX) / 2;
      (floor.material as MeshStandardMaterial).color.copy(floorColor());
      scene.background = bgColor();
      (scene.fog as Fog).color.copy(bgColor());
      if (instantNext || !visible) {
        settle();
        render();
      } else wake();
    },
    setSize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (target) frameCamera(target);
      render();
    },
    setVisible(v) {
      visible = v;
      if (v) {
        if (target) (floor.material as MeshStandardMaterial).color.copy(floorColor());
        wake();
      }
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      for (const t of textures) t.dispose();
      for (const g of Object.values(geo)) g.dispose();
      for (const m of mats.values()) m.dispose();
      floor.geometry.dispose();
      (floor.material as MeshStandardMaterial).dispose();
      renderer.dispose();
    },
  };
}
