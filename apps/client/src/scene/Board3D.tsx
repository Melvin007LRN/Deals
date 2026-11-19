import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { BOARD, DISTRICTS, type PlayerView } from "@deals/engine";
import { DICE_MS, STEP_MS, useGame, type Fx } from "../game/store.ts";
import { CELL, TILE, mulberry, pawnOffset, tilePos, tileRot } from "./layout.ts";
import { feltTexture, moveFace, resourceFace, windowsTexture } from "./textures.ts";

const FONT = "/fonts/inter-latin-600-normal.woff";
const FONT_BOLD = "/fonts/inter-latin-800-normal.woff";
const GOLD = "#d9a92b";
const districtColor = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.color])) as Record<string, string>;

const SPECIAL: Record<string, { icon: string; color: string; label: string }> = {
  start: { icon: "GO", color: GOLD, label: "DÉPART" },
  chance: { icon: "?", color: "#a78bfa", label: "CHANCE" },
  market: { icon: "$", color: "#38bdf8", label: "MARCHÉ" },
  event: { icon: "!", color: "#f472b6", label: "ÉVÉNEMENT" },
  tax: { icon: "%", color: "#f87171", label: "TAXE 15 D" },
};

/* ---------------------------------------------------------------- */

function Table() {
  const felt = useMemo(() => feltTexture(), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.32} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={felt} roughness={0.95} />
      </mesh>
      {/* socle du plateau : bois laqué + liseré or */}
      <RoundedBox args={[CELL * 7 + 0.7, 0.4, CELL * 7 + 0.7]} radius={0.12} position-y={-0.2}>
        <meshStandardMaterial color="#0d1633" metalness={0.3} roughness={0.35} />
      </RoundedBox>
      <mesh position-y={0.005} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[CELL * 3.5 + 0.18, CELL * 3.5 + 0.3, 4, 1, Math.PI / 4]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */

const Tile = memo(function Tile({ i, owner, mortgaged, selected, active }: { i: number; owner: string | null; mortgaged: boolean; selected: boolean; active: boolean }) {
  const s = BOARD[i]!;
  const [x, z] = tilePos(i);
  const setSelected = useGame((st) => st.setSelected);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return;
    setSelected(i);
  };
  const special = SPECIAL[s.type];
  const band = s.district ? districtColor[s.district] : special?.color;
  const glow = selected ? "#ffe7a3" : active ? "#7dd3fc" : "#000000";
  return (
    <group position={[x, 0, z]} rotation-y={tileRot(i)}>
      <RoundedBox args={[TILE, 0.16, TILE]} radius={0.05} position-y={0.08} onClick={onClick}>
        <meshStandardMaterial
          color={mortgaged ? "#2a2f3d" : "#f3ead8"}
          roughness={0.55}
          emissive={glow}
          emissiveIntensity={selected ? 0.35 : active ? 0.18 : 0}
        />
      </RoundedBox>
      {/* bandeau de quartier côté intérieur */}
      <mesh position={[0, 0.165, -TILE / 2 + 0.17]}>
        <boxGeometry args={[TILE - 0.06, 0.02, 0.3]} />
        <meshStandardMaterial color={band ?? "#999"} roughness={0.4} metalness={0.15} />
      </mesh>
      {special && (
        <Text font={FONT_BOLD} fontSize={0.42} position={[0, 0.17, 0.02]} rotation-x={-Math.PI / 2} color={special.color} anchorX="center" anchorY="middle">
          {special.icon}
        </Text>
      )}
      <Text
        font={FONT}
        fontSize={special ? 0.13 : 0.115}
        maxWidth={TILE - 0.14}
        textAlign="center"
        lineHeight={1.05}
        position={[0, 0.17, special ? 0.42 : 0.18]}
        rotation-x={-Math.PI / 2}
        color={mortgaged ? "#9aa3b8" : "#1b2340"}
        anchorX="center"
        anchorY="middle"
      >
        {special ? special.label : s.name.toUpperCase()}
      </Text>
      {s.price && (
        <Text font={FONT_BOLD} fontSize={0.14} position={[0, 0.17, 0.5]} rotation-x={-Math.PI / 2} color={mortgaged ? "#9aa3b8" : "#7a5512"} anchorX="center" anchorY="middle">
          {mortgaged ? "HYPOTHÉQUÉE" : `${s.price} D`}
        </Text>
      )}
      {owner && <OwnerFlag color={owner} />}
    </group>
  );
});

function OwnerFlag({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (ref.current) ref.current.rotation.y = Math.sin(st.clock.elapsedTime * 1.5) * 0.15;
  });
  return (
    <group position={[TILE / 2 - 0.16, 0.16, TILE / 2 - 0.16]}>
      <mesh position-y={0.01}>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 20]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position-y={0.24}>
        <cylinderGeometry args={[0.012, 0.012, 0.46, 6]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
      </mesh>
      <group ref={ref} position-y={0.4}>
        <mesh position-x={0.09}>
          <boxGeometry args={[0.18, 0.11, 0.01]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- */

const winTex = (() => {
  let t: THREE.Texture | null = null;
  return () => (t ??= windowsTexture(3));
})();

function BuildingModel({ level, color }: { level: number; color: string }) {
  const tex = winTex();
  const glass = (
    <meshStandardMaterial color="#1e3a6e" metalness={0.6} roughness={0.25} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.9} />
  );
  if (level === 1)
    return (
      <group>
        <mesh position-y={0.17}>
          <boxGeometry args={[0.42, 0.34, 0.36]} />
          <meshStandardMaterial color="#efe6d2" roughness={0.6} />
        </mesh>
        <mesh position-y={0.43} rotation-y={Math.PI / 4}>
          <coneGeometry args={[0.36, 0.2, 4]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 0.185]}>
          <boxGeometry args={[0.1, 0.16, 0.01]} />
          <meshStandardMaterial color="#3a2a1a" />
        </mesh>
      </group>
    );
  if (level === 2)
    return (
      <group>
        <mesh position-y={0.38}>
          <boxGeometry args={[0.46, 0.76, 0.42]} />
          {glass}
        </mesh>
        <mesh position-y={0.78}>
          <boxGeometry args={[0.5, 0.05, 0.46]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    );
  return (
    <group>
      <mesh position-y={0.5}>
        <boxGeometry args={[0.5, 1.0, 0.46]} />
        {glass}
      </mesh>
      <mesh position-y={1.18}>
        <boxGeometry args={[0.36, 0.36, 0.32]} />
        {glass}
      </mesh>
      <mesh position-y={1.42}>
        <cylinderGeometry args={[0.02, 0.12, 0.16, 8]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} emissive={GOLD} emissiveIntensity={0.4} />
      </mesh>
      <mesh position-y={1.02}>
        <boxGeometry args={[0.54, 0.04, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Bâtiment d'une propriété ; « pousse » à chaque nouveau niveau. */
function PropertyBuilding({ i, level }: { i: number; level: number }) {
  const [x, z] = tilePos(i);
  const ref = useRef<THREE.Group>(null);
  const born = useRef(performance.now());
  const lastLevel = useRef(level);
  if (lastLevel.current !== level) {
    lastLevel.current = level;
    born.current = performance.now();
  }
  useFrame(() => {
    if (!ref.current) return;
    const t = Math.min(1, (performance.now() - born.current) / 600);
    const e = 1 - Math.pow(1 - t, 3);
    ref.current.scale.set(1, Math.max(0.01, e * (1 + 0.12 * Math.sin(t * Math.PI))), 1);
  });
  if (level === 0) return null;
  const color = districtColor[BOARD[i]!.district!]!;
  const r = tileRot(i);
  // le bâtiment se place côté bandeau (intérieur) pour ne pas cacher le texte
  const off = -0.12;
  return (
    <group ref={ref} position={[x, 0.16, z]} rotation-y={r}>
      <group position={[-0.36, 0, off - 0.05]} scale={0.95}>
        <BuildingModel level={level} color={color} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- */

/** Ville centrale : îlots, immeubles instanciés, parc, hôtel de ville. */
const City = memo(function City() {
  const { boxes, trees } = useMemo(() => {
    const rnd = mulberry(2026);
    const boxes: { p: [number, number, number]; s: [number, number, number]; c: THREE.Color }[] = [];
    const trees: [number, number, number][] = [];
    const span = CELL * 2.05;
    const blocks = 4;
    const step = (span * 2) / blocks;
    for (let bx = 0; bx < blocks; bx++)
      for (let bz = 0; bz < blocks; bz++) {
        const cx = -span + step * (bx + 0.5);
        const cz = -span + step * (bz + 0.5);
        const central = (bx === 1 || bx === 2) && (bz === 1 || bz === 2);
        if (central) {
          for (let k = 0; k < 7; k++) trees.push([cx + (rnd() - 0.5) * step * 0.7, 0, cz + (rnd() - 0.5) * step * 0.7]);
          continue;
        }
        for (let k = 0; k < 4; k++) {
          const ox = (k % 2 ? 1 : -1) * step * 0.2;
          const oz = (k < 2 ? 1 : -1) * step * 0.2;
          const h = 0.3 + rnd() * rnd() * 1.25;
          const w = step * (0.2 + rnd() * 0.1);
          boxes.push({ p: [cx + ox, h / 2 + 0.05, cz + oz], s: [w, h, w], c: new THREE.Color().setHSL(0.6 + rnd() * 0.05, 0.45, 0.22 + rnd() * 0.12) });
        }
      }
    return { boxes, trees };
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const treeRef = useRef<THREE.InstancedMesh>(null);
  const tex = winTex();
  useMemo(() => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }, [tex]);
  const ready = useRef(false);
  useFrame(() => {
    if (ready.current || !ref.current || !treeRef.current) return;
    const m = new THREE.Matrix4();
    boxes.forEach((b, k) => {
      m.compose(new THREE.Vector3(...b.p), new THREE.Quaternion(), new THREE.Vector3(...b.s));
      ref.current!.setMatrixAt(k, m);
      ref.current!.setColorAt(k, b.c);
    });
    trees.forEach((t, k) => {
      m.compose(new THREE.Vector3(t[0], 0.25, t[2]), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
      treeRef.current!.setMatrixAt(k, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    treeRef.current.instanceMatrix.needsUpdate = true;
    ready.current = true;
  });
  return (
    <group>
      {/* chaussée */}
      <mesh position-y={0.01} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[CELL * 5 - 0.1, CELL * 5 - 0.1]} />
        <meshStandardMaterial color="#1b2233" roughness={0.9} />
      </mesh>
      {/* parc central */}
      <mesh position-y={0.03} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[CELL * 1.05, 40]} />
        <meshStandardMaterial color="#2f6b3a" roughness={1} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, boxes.length]} castShadow>
        <boxGeometry />
        <meshStandardMaterial metalness={0.55} roughness={0.3} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} />
      </instancedMesh>
      <instancedMesh ref={treeRef} args={[undefined, undefined, trees.length]}>
        <coneGeometry args={[0.16, 0.5, 7]} />
        <meshStandardMaterial color="#3f9b4f" roughness={0.8} />
      </instancedMesh>
      {/* hôtel de ville */}
      <group position={[0, 0.03, 0]}>
        <mesh position-y={0.2}>
          <boxGeometry args={[1.1, 0.4, 0.7]} />
          <meshStandardMaterial color="#efe6d2" roughness={0.5} />
        </mesh>
        <mesh position-y={0.5}>
          <sphereGeometry args={[0.26, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
        </mesh>
        {[-0.4, -0.2, 0, 0.2, 0.4].map((cx) => (
          <mesh key={cx} position={[cx, 0.2, 0.37]}>
            <cylinderGeometry args={[0.03, 0.03, 0.38, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
    </group>
  );
});

/* ---------------------------------------------------------------- */

function PawnShape({ kind, color }: { kind: number; color: string }) {
  const mat = <meshPhysicalMaterial color={color} metalness={0.35} roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} />;
  const base = (
    <mesh position-y={0.04}>
      <cylinderGeometry args={[0.17, 0.19, 0.08, 28]} />
      <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} />
    </mesh>
  );
  if (kind === 0)
    return (
      <group>
        {base}
        <mesh position-y={0.26}>
          <cylinderGeometry args={[0.06, 0.13, 0.36, 24]} />
          {mat}
        </mesh>
        <mesh position-y={0.5}>
          <sphereGeometry args={[0.11, 24, 16]} />
          {mat}
        </mesh>
      </group>
    );
  if (kind === 1)
    return (
      <group>
        {base}
        <mesh position-y={0.3}>
          <boxGeometry args={[0.2, 0.44, 0.2]} />
          {mat}
        </mesh>
        <mesh position-y={0.56}>
          <coneGeometry args={[0.15, 0.14, 4]} />
          {mat}
        </mesh>
      </group>
    );
  if (kind === 2)
    return (
      <group>
        {base}
        <mesh position-y={0.36}>
          <octahedronGeometry args={[0.2]} />
          {mat}
        </mesh>
      </group>
    );
  return (
    <group>
      {base}
      <mesh position-y={0.25}>
        <cylinderGeometry args={[0.12, 0.14, 0.34, 6]} />
        {mat}
      </mesh>
      <mesh position-y={0.46} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.1, 0.035, 10, 24]} />
        {mat}
      </mesh>
    </group>
  );
}

function Pawn({ seat, playerId, position, color, isActive }: { seat: number; playerId: string; position: number; color: string; isActive: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const reduced = useGame((s) => s.reducedMotion);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const anim = useGame.getState().pawns[playerId];
    let idx = position;
    let hop = 0;
    let frac = 0;
    let fromIdx = position;
    const now = performance.now();
    const stepMs = reduced ? 60 : STEP_MS;
    if (anim && now < anim.start + anim.path.length * stepMs) {
      if (now < anim.start) {
        idx = anim.from;
        fromIdx = anim.from;
      } else {
        const k = Math.floor((now - anim.start) / stepMs);
        frac = ((now - anim.start) % stepMs) / stepMs;
        fromIdx = k === 0 ? anim.from : anim.path[k - 1]!;
        idx = anim.path[k]!;
        hop = Math.sin(frac * Math.PI) * 0.45;
      }
    } else {
      fromIdx = idx;
      frac = 1;
    }
    const [ax, az] = tilePos(fromIdx);
    const [bx, bz] = tilePos(idx);
    const [ox, oz] = pawnOffset(seat, idx);
    const e = frac < 1 ? frac * frac * (3 - 2 * frac) : 1;
    g.position.set(ax + (bx - ax) * e + ox, 0.16 + hop, az + (bz - az) * e + oz);
    if (ring.current) {
      ring.current.visible = isActive;
      ring.current.scale.setScalar(1 + Math.sin(st.clock.elapsedTime * 4) * 0.08);
    }
  });
  return (
    <group ref={ref}>
      <PawnShape kind={seat} color={color} />
      <mesh ref={ring} position-y={0.012} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.22, 0.27, 32]} />
        <meshBasicMaterial color="#ffe7a3" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- */

const MOVE_FACES = [1, 2, 2, 3, 3, 4];
const RES_FACES = ["credits", "credits", "materials", "materials", "energy", "choice"];
const NORMALS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function Die({ faces, value, kind, x, start, seed }: { faces: (string | number)[]; value: string | number; kind: "move" | "res"; x: number; start: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const reduced = useGame((s) => s.reducedMotion);
  const mats = useMemo(
    () => faces.map((f) => new THREE.MeshStandardMaterial({ map: kind === "move" ? moveFace(f as number) : resourceFace(f as string), roughness: 0.35, metalness: 0.15 })),
    [faces, kind],
  );
  const target = useMemo(() => {
    const idx = faces.findIndex((f) => f === value);
    const q = new THREE.Quaternion().setFromUnitVectors(NORMALS[Math.max(0, idx)]!, new THREE.Vector3(0, 1, 0));
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ((seed % 7) - 3) * 0.12);
    return yaw.multiply(q);
  }, [faces, value, seed]);
  const spinAxis = useMemo(() => new THREE.Vector3(Math.sin(seed), 1, Math.cos(seed * 1.7)).normalize(), [seed]);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const dur = reduced ? 300 : DICE_MS;
    const t = Math.min(1, Math.max(0, (performance.now() - start) / dur));
    const y = 1.0 + (t < 0.8 ? Math.abs(Math.sin(t * Math.PI * 2.6)) * (1 - t) * 1.6 : 0);
    g.position.set(x + (1 - t) * 1.4, y, CELL * 1.1 - (1 - t) * 2.2);
    if (t < 0.78) {
      const spin = new THREE.Quaternion().setFromAxisAngle(spinAxis, (1 - t) * 22);
      g.quaternion.copy(spin.multiply(target));
    } else {
      const k = (t - 0.78) / 0.22;
      const spin = new THREE.Quaternion().setFromAxisAngle(spinAxis, (1 - 0.78) * 22 * (1 - k));
      g.quaternion.copy(spin.multiply(target));
    }
  });
  return (
    <group ref={ref}>
      {/* BoxGeometry : 6 groupes de faces → un matériau par face */}
      <mesh material={mats}>
        <boxGeometry args={[0.62, 0.62, 0.62]} />
      </mesh>
    </group>
  );
}

function Dice() {
  const dice = useGame((s) => s.dice);
  if (!dice) return null;
  return (
    <group>
      <Die faces={MOVE_FACES} value={dice.movement} kind="move" x={-0.45} start={dice.start} seed={dice.id * 3 + 1} />
      <Die faces={RES_FACES} value={dice.resource} kind="res" x={0.45} start={dice.start + 60} seed={dice.id * 5 + 2} />
    </group>
  );
}

/* ---------------------------------------------------------------- */

function FxItem({ fx }: { fx: Fx }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const [x, z] = fx.index !== undefined ? tilePos(fx.index) : [0, 0];
  const color = { coins: GOLD, build: "#7dd3fc", buy: "#ffe7a3", attack: "#ef4444", shield: "#60a5fa", card: "#a78bfa", start: GOLD, deal: "#22c55e" }[fx.kind];
  useFrame(() => {
    const t = (performance.now() - fx.start) / 1100;
    if (!ref.current || !mat.current) return;
    ref.current.visible = t >= 0 && t <= 1;
    ref.current.scale.setScalar(0.4 + t * 1.6);
    ref.current.position.y = 0.25 + t * (fx.kind === "coins" || fx.kind === "start" ? 1.2 : 0.3);
    mat.current.opacity = Math.max(0, 1 - t);
  });
  return (
    <group ref={ref} position={[x, 0.25, z]} visible={false}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.35, 0.5, 40]} />
        <meshBasicMaterial ref={mat} color={color} transparent opacity={1} depthWrite={false} />
      </mesh>
      {(fx.kind === "coins" || fx.kind === "start") && fx.amount !== undefined && (
        <Text font={FONT_BOLD} fontSize={0.32} position-y={0.4} color={color} anchorX="center" outlineWidth={0.015} outlineColor="#3b2a05">
          {`+${fx.amount}`}
        </Text>
      )}
    </group>
  );
}

function Effects() {
  const fx = useGame((s) => s.fx);
  return (
    <>
      {fx.slice(-12).map((f) => (
        <FxItem key={f.id} fx={f} />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- */

function Pieces({ view }: { view: PlayerView }) {
  const seats = useGame((s) => s.seats);
  const active = view.turnOrder[view.activeIndex];
  return (
    <>
      {view.turnOrder.map((id, seat) => (
        <Pawn key={id} seat={seat} playerId={id} position={view.players[id]!.position} color={seats.find((x) => x.id === id)?.color ?? "#fff"} isActive={id === active && view.phase !== "FINISHED"} />
      ))}
    </>
  );
}

/** Cadre le plateau entier quelle que soit l'orientation de l'écran (portrait mobile compris). */
function CameraRig() {
  const { camera, size, controls } = useThree();
  const last = useRef("");
  useFrame(() => {
    const key = `${size.width}x${size.height}`;
    if (key === last.current) return;
    last.current = key;
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    cam.fov = aspect < 0.8 ? 52 : 40;
    cam.updateProjectionMatrix();
    const half = CELL * 3.5 + 0.5;
    const vt = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const dW = half / (vt * aspect);
    const dH = (half * 1.15) / vt;
    const d = Math.max(dW, dH) * 1.07;
    const dir = new THREE.Vector3(0, 0.86, 0.51).normalize();
    cam.position.copy(dir.multiplyScalar(d));
    const c = controls as unknown as { target: THREE.Vector3; maxDistance: number; minDistance: number; update: () => void } | null;
    if (c) {
      c.target.set(0, 0, 0.25);
      c.maxDistance = d * 1.25;
      c.minDistance = Math.min(9, d * 0.45);
      c.update();
    } else cam.lookAt(0, 0, 0.25);
  });
  return null;
}

export default function Board3D() {
  const view = useGame((s) => s.view);
  const seats = useGame((s) => s.seats);
  const selected = useGame((s) => s.selected);
  const setSelected = useGame((s) => s.setSelected);
  if (!view) return null;
  const colorOf = (id: string | null) => (id ? seats.find((x) => x.id === id)?.color ?? null : null);
  const activePos = view.players[view.turnOrder[view.activeIndex]!]!.position;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 15.5, 12.5], fov: 38, near: 0.5, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => setSelected(null)}
    >
      <color attach="background" args={["#05070f"]} />
      <fog attach="fog" args={["#05070f", 26, 48]} />
      <hemisphereLight args={["#bcd3ff", "#1a1408", 0.55]} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} color="#fff1d6" />
      <directionalLight position={[-9, 6, -8]} intensity={0.45} color="#7aa2ff" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, 4]} scale={[6, 2, 1]} color="#ffd89a" />
        <Lightformer form="rect" intensity={0.8} position={[-6, 2, -4]} scale={[6, 2, 1]} color="#8fb4ff" />
      </Environment>
      <Table />
      <City />
      {BOARD.map((s) => {
        const pr = view.properties[s.index];
        return (
          <Tile
            key={s.index}
            i={s.index}
            owner={colorOf(pr?.ownerId ?? null)}
            mortgaged={pr?.mortgaged ?? false}
            selected={selected === s.index}
            active={activePos === s.index}
          />
        );
      })}
      {Object.values(view.properties).map((pr) => (
        <PropertyBuilding key={pr.index} i={pr.index} level={pr.level} />
      ))}
      <Pieces view={view} />
      <Dice />
      <Effects />
      <ContactShadows position-y={0.17} scale={CELL * 7.2} resolution={512} blur={2.4} opacity={0.55} far={3} frames={Infinity} />
      <OrbitControls makeDefault enablePan={false} enableDamping minPolarAngle={0.15} maxPolarAngle={1.15} />
      <CameraRig />
    </Canvas>
  );
}
