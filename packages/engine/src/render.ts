import { locate, transitionAlpha, type Clip, type Project } from '@editor/core';

/** What the renderer needs from an imported file. The app owns the element and its lifetime. */
export interface PlayableMedia {
  id: string;
  name: string;
  kind: 'video' | 'audio';
  element: HTMLVideoElement;
}

export const FILTER_CSS: Record<Clip['filter'], string> = {
  none: '',
  gray: 'grayscale(1)',
  sepia: 'sepia(1)',
  warm: 'sepia(.25) saturate(1.3) hue-rotate(-8deg)',
  cool: 'saturate(1.1) hue-rotate(18deg)',
  vivid: 'saturate(1.6) contrast(1.1)',
  vintage: 'sepia(.4) contrast(.9) brightness(1.1)',
};

export function clipFilterCss(c: Clip): string {
  const brightness = c.brightness !== 100 ? `brightness(${c.brightness}%)` : '';
  return `${FILTER_CSS[c.filter]} ${brightness}`.trim() || 'none';
}

/** True when the browser supports ctx.filter (Safari does not). */
export const supportsCanvasFilter = () => typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;

/** Draw the frame at timeline time t into any 2D context, at any size. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  project: Project,
  getMedia: (mediaId: string) => PlayableMedia | undefined,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const L = locate(project, t);
  const m = L ? getMedia(L.clip.mediaId) : undefined;
  if (L && m) {
    const el = m.element;
    if (m.kind === 'video' && el.videoWidth) {
      const scale = Math.min(w / el.videoWidth, h / el.videoHeight);
      const dw = el.videoWidth * scale;
      const dh = el.videoHeight * scale;
      ctx.save();
      ctx.globalAlpha = transitionAlpha(L.clip, L.local, L.length);
      ctx.filter = clipFilterCss(L.clip);
      try {
        ctx.drawImage(el, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } catch {
        /* frame not ready yet */
      }
      ctx.restore();
    } else if (m.kind === 'audio') {
      ctx.fillStyle = '#16231e';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3ecf8e';
      ctx.font = `600 ${Math.round(h / 12)}px system-ui`;
      ctx.fillText('Audio only', w / 2, h / 2 - h / 14);
      ctx.fillStyle = '#9aa1ad';
      ctx.font = `${Math.round(h / 20)}px system-ui`;
      ctx.fillText(m.name, w / 2, h / 2 + h / 14);
    }
  }

  for (const tx of project.texts) {
    if (t < tx.start || t > tx.end) continue;
    const px = Math.round((tx.size * h) / 720);
    ctx.save();
    ctx.font = `700 ${px}px system-ui, "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, px / 8);
    ctx.strokeStyle = 'rgba(0,0,0,.75)';
    ctx.strokeText(tx.text, (tx.x / 100) * w, (tx.y / 100) * h);
    ctx.fillStyle = tx.color;
    ctx.fillText(tx.text, (tx.x / 100) * w, (tx.y / 100) * h);
    ctx.restore();
  }
}
