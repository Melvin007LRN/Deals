import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

function canvasTexture(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** Fenêtres éclairées (map émissive) pour les immeubles. */
export function windowsTexture(seed = 1): THREE.Texture {
  return canvasTexture(`win${seed}`, 128, 256, (c) => {
    c.fillStyle = "#000";
    c.fillRect(0, 0, 128, 256);
    let s = seed * 9301;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let y = 8; y < 248; y += 16) {
      for (let x = 8; x < 120; x += 18) {
        const on = rnd() > 0.38;
        c.fillStyle = on ? `rgba(255,${200 + Math.floor(rnd() * 40)},${120 + Math.floor(rnd() * 60)},${0.65 + rnd() * 0.35})` : "rgba(40,60,90,0.25)";
        c.fillRect(x, y, 11, 9);
      }
    }
  });
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function dieBase(c: CanvasRenderingContext2D, bg: string) {
  const g = c.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, bg);
  g.addColorStop(1, "#050914");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  c.strokeStyle = "#e9c46a";
  c.lineWidth = 12;
  roundRect(c, 14, 14, 228, 228, 34);
  c.stroke();
}

const goldFill = (c: CanvasRenderingContext2D) => {
  const g = c.createLinearGradient(0, 40, 0, 220);
  g.addColorStop(0, "#fff1b8");
  g.addColorStop(0.5, "#e0b23c");
  g.addColorStop(1, "#9a6a12");
  return g;
};

/** Face du dé de mouvement. */
export function moveFace(n: number): THREE.Texture {
  return canvasTexture(`mv${n}`, 256, 256, (c) => {
    dieBase(c, "#14306b");
    c.fillStyle = goldFill(c);
    c.font = "800 150px Inter, Arial, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(String(n), 128, 138);
  });
}

/** Face du dé de ressources. */
export function resourceFace(kind: string): THREE.Texture {
  return canvasTexture(`rs${kind}`, 256, 256, (c) => {
    dieBase(c, "#0f2a3f");
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (kind === "credits") {
      c.fillStyle = goldFill(c);
      c.beginPath();
      c.arc(128, 128, 70, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#6b4708";
      c.font = "800 84px Inter, Arial, sans-serif";
      c.fillText("D", 128, 134);
    } else if (kind === "materials") {
      // parpaings empilés
      const brick = (x: number, y: number) => {
        c.fillStyle = "#c98b4f";
        c.fillRect(x, y, 64, 34);
        c.fillStyle = "#7a4a22";
        c.fillRect(x + 10, y + 9, 16, 16);
        c.fillRect(x + 38, y + 9, 16, 16);
      };
      brick(62, 140); brick(130, 140); brick(96, 100); brick(64, 180 - 80);
    } else if (kind === "energy") {
      c.fillStyle = "#59d4ff";
      c.shadowColor = "#59d4ff";
      c.shadowBlur = 26;
      c.beginPath();
      c.moveTo(142, 40); c.lineTo(78, 140); c.lineTo(122, 140); c.lineTo(104, 216); c.lineTo(178, 108); c.lineTo(132, 108);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = goldFill(c);
      c.font = "800 140px Inter, Arial, sans-serif";
      c.fillText("?", 128, 136);
    }
  });
}

/** Sol de table : feutre bleu nuit avec vignettage. */
export function feltTexture(): THREE.Texture {
  return canvasTexture("felt", 512, 512, (c) => {
    const g = c.createRadialGradient(256, 256, 40, 256, 256, 360);
    g.addColorStop(0, "#16224a");
    g.addColorStop(1, "#04060f");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) {
      c.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
      c.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }
  });
}
