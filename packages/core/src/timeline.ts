import type { Clip, Located, MediaInfo, PlacedClip, Project, TextOverlay } from './types.ts';

/** Shortest clip the editor allows, in seconds. */
export const MIN_CLIP = 0.1;
/** Length of the dip-to-black transition, in seconds. */
export const TRANSITION_SECONDS = 0.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const clipLength = (c: Clip) => c.out - c.in;

/** Clips are laid end to end on one track. */
export function layout(clips: Clip[]): PlacedClip[] {
  let start = 0;
  return clips.map((clip) => {
    const length = clipLength(clip);
    const placed = { clip, start, length };
    start += length;
    return placed;
  });
}

export const totalDuration = (p: Project) => p.clips.reduce((sum, c) => sum + clipLength(c), 0);

/** Find the clip playing at timeline time t. Past the end, returns the last clip at its end. */
export function locate(p: Project, t: number): Located | null {
  const placed = layout(p.clips);
  for (let i = 0; i < placed.length; i++) {
    const r = placed[i];
    if (t < r.start + r.length || i === placed.length - 1) {
      return { ...r, index: i, local: clamp(t - r.start, 0, r.length) };
    }
  }
  return null;
}

/** Audio gain multiplier from the fade in and fade out. */
export function fadeFactor(c: Clip, local: number, length: number): number {
  let f = 1;
  if (c.fadeIn > 0) f = Math.min(f, local / c.fadeIn);
  if (c.fadeOut > 0) f = Math.min(f, (length - local) / c.fadeOut);
  return clamp(f, 0, 1);
}

/** Picture opacity for the dip-to-black transition. */
export function transitionAlpha(c: Clip, local: number, length: number): number {
  const d = Math.min(TRANSITION_SECONDS, length / 2);
  let a = 1;
  if ((c.transition === 'in' || c.transition === 'both') && local < d) a = Math.min(a, local / d);
  if ((c.transition === 'out' || c.transition === 'both') && length - local < d) a = Math.min(a, (length - local) / d);
  return clamp(a, 0, 1);
}

// ---- edits: each returns a new Project and never mutates its input ----

export function addClip(p: Project, media: Pick<MediaInfo, 'id' | 'duration'>, id: string): Project {
  const clip: Clip = {
    id,
    mediaId: media.id,
    in: 0,
    out: media.duration,
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
    filter: 'none',
    brightness: 100,
    transition: 'none',
  };
  return { ...p, clips: [...p.clips, clip] };
}

export function updateClip(p: Project, id: string, patch: Partial<Omit<Clip, 'id' | 'mediaId'>>): Project {
  return { ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

/** Split the clip under time t in two. Returns null if t is too close to a clip edge. */
export function splitAt(p: Project, t: number, newId: string): { project: Project; newClipId: string } | null {
  const L = locate(p, t);
  if (!L || L.local < MIN_CLIP || L.length - L.local < MIN_CLIP) return null;
  const c = L.clip;
  const at = c.in + L.local;
  const first: Clip = {
    ...c,
    out: at,
    fadeOut: 0,
    transition: c.transition === 'both' ? 'in' : c.transition === 'out' ? 'none' : c.transition,
  };
  const second: Clip = {
    ...c,
    id: newId,
    in: at,
    fadeIn: 0,
    transition: c.transition === 'both' ? 'out' : c.transition === 'in' ? 'none' : c.transition,
  };
  const clips = [...p.clips];
  clips.splice(L.index, 1, first, second);
  return { project: { ...p, clips }, newClipId: newId };
}

/** Move a clip's in point or out point, keeping it inside the media and at least MIN_CLIP long. */
export function trimClip(p: Project, id: string, edge: 'in' | 'out', value: number, mediaDuration: number): Project {
  return {
    ...p,
    clips: p.clips.map((c) => {
      if (c.id !== id) return c;
      return edge === 'in'
        ? { ...c, in: clamp(value, 0, c.out - MIN_CLIP) }
        : { ...c, out: clamp(value, c.in + MIN_CLIP, mediaDuration) };
    }),
  };
}

export const removeClip = (p: Project, id: string): Project => ({ ...p, clips: p.clips.filter((c) => c.id !== id) });

export function moveClip(p: Project, id: string, delta: -1 | 1): Project {
  const i = p.clips.findIndex((c) => c.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= p.clips.length) return p;
  const clips = [...p.clips];
  [clips[i], clips[j]] = [clips[j], clips[i]];
  return { ...p, clips };
}

export function duplicateClip(p: Project, id: string, newId: string): Project {
  const i = p.clips.findIndex((c) => c.id === id);
  if (i < 0) return p;
  const clips = [...p.clips];
  clips.splice(i + 1, 0, { ...p.clips[i], id: newId });
  return { ...p, clips };
}

export function addText(p: Project, at: number, id: string): Project {
  const text: TextOverlay = { id, text: 'Your text', start: at, end: at + 3, x: 50, y: 85, size: 56, color: '#ffffff' };
  return { ...p, texts: [...p.texts, text] };
}

export function updateText(p: Project, id: string, patch: Partial<Omit<TextOverlay, 'id'>>): Project {
  return { ...p, texts: p.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
}

export const removeText = (p: Project, id: string): Project => ({ ...p, texts: p.texts.filter((t) => t.id !== id) });
