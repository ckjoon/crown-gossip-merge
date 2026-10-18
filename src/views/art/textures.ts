// textures.ts — SVG 아이템 그림을 Pixi 텍스처로 래스터화해 캐시 (v3.1에서 같은 키로 새 아트를 넣으면 교체됨)

import { Texture } from "pixi.js";
import { getCrateSVG, getEventSVG, getItemSVG } from "./sprites";

export const TEX_PX = 160;
const cache = new Map<string, Texture>();
const pending = new Map<string, Promise<Texture | null>>();
const readyListeners = new Set<() => void>();

export type TexKey = string; // "item:potion:3" | "gen:tea:2" | "crate" | "event:2" | "eventGen"

export function itemKey(chain: string, level: number, isGenerator: boolean): TexKey {
  return `${isGenerator ? "gen" : "item"}:${chain}:${level}`;
}

function svgFor(key: TexKey): string {
  if (key === "crate") return getCrateSVG();
  if (key === "eventGen") return getEventSVG(1, true);
  const [kind, a, b] = key.split(":");
  if (kind === "event") return getEventSVG(Number(a), false);
  return getItemSVG(a, Number(b), kind === "gen");
}

async function rasterize(svg: string, size: number): Promise<Texture | null> {
  const sized = svg.replace('width="100%" height="100%"', `width="${size}" height="${size}"`);
  const img = new Image();
  img.decoding = "async";
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sized);
  try {
    await img.decode();
  } catch {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")!.drawImage(img, 0, 0, size, size);
  return Texture.from(canvas);
}

function load(key: TexKey): Promise<Texture | null> {
  let p = pending.get(key);
  if (!p) {
    p = rasterize(svgFor(key), TEX_PX).then((t) => {
      if (t) {
        cache.set(key, t);
        for (const fn of readyListeners) fn();
      }
      return t;
    });
    pending.set(key, p);
  }
  return p;
}

// 캐시에 있으면 바로 돌려주고, 없으면 굽기 시작하고 null (구워지면 onTexturesReady 리스너 호출)
export function getTexture(key: TexKey): Texture | null {
  const t = cache.get(key);
  if (t) return t;
  void load(key);
  return null;
}

export function onTexturesReady(fn: () => void): () => void {
  readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}

export async function preloadTextures(): Promise<void> {
  const keys: TexKey[] = ["crate", "eventGen"];
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea", "gem"]) for (let l = 1; l <= 8; l++) keys.push(itemKey(c, l, false));
  for (const c of ["potion", "grimoire", "herb", "bakery", "tea"]) for (let l = 1; l <= 3; l++) keys.push(itemKey(c, l, true));
  for (const c of ["coin", "energy"]) for (let l = 1; l <= 4; l++) keys.push(itemKey(c, l, false));
  for (let l = 1; l <= 5; l++) keys.push(`event:${l}`);
  await Promise.all(keys.map(load));
}
