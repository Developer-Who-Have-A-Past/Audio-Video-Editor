export type FilterName = 'none' | 'gray' | 'sepia' | 'warm' | 'cool' | 'vivid' | 'vintage';
export type TransitionName = 'none' | 'in' | 'out' | 'both';

/** What the core needs to know about an imported file. The file itself lives in the engine/UI layer. */
export interface MediaInfo {
  id: string;
  name: string;
  kind: 'video' | 'audio';
  duration: number;
}

/** A piece of a media file placed on the single video track. Times are in seconds. */
export interface Clip {
  id: string;
  mediaId: string;
  in: number;
  out: number;
  /** 1 = 100%, up to 2 */
  volume: number;
  fadeIn: number;
  fadeOut: number;
  filter: FilterName;
  /** percent, 100 = unchanged */
  brightness: number;
  transition: TransitionName;
}

export interface TextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  /** position as percent of frame width and height */
  x: number;
  y: number;
  /** pixel size at 720p */
  size: number;
  color: string;
}

export interface Project {
  clips: Clip[];
  texts: TextOverlay[];
}

export interface PlacedClip {
  clip: Clip;
  start: number;
  length: number;
}

export interface Located extends PlacedClip {
  index: number;
  /** seconds from the start of the clip */
  local: number;
}

export const emptyProject = (): Project => ({ clips: [], texts: [] });
