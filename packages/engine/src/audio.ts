import { layout, totalDuration, type Project } from '@editor/core';

/**
 * Mix every clip's audio into one stereo buffer, faster than real time.
 * `getFile` returns the original file for a media id; undecodable files are skipped.
 */
export async function mixdown(
  project: Project,
  getFile: (mediaId: string) => Blob | undefined,
  decodeContext: BaseAudioContext,
  sampleRate = 44100,
): Promise<AudioBuffer> {
  const seconds = totalDuration(project);
  const oc = new OfflineAudioContext(2, Math.max(1, Math.ceil(seconds * sampleRate)), sampleRate);
  const decoded = new Map<string, AudioBuffer>();

  for (const r of layout(project.clips)) {
    const c = r.clip;
    let buf = decoded.get(c.mediaId);
    if (!buf) {
      const file = getFile(c.mediaId);
      if (!file) continue;
      try {
        buf = await decodeContext.decodeAudioData(await file.arrayBuffer());
      } catch {
        continue; // for example a video with no audio track
      }
      decoded.set(c.mediaId, buf);
    }
    const src = oc.createBufferSource();
    src.buffer = buf;
    const g = oc.createGain();
    const fadeIn = Math.min(c.fadeIn, r.length);
    const fadeOut = Math.min(c.fadeOut, r.length);
    g.gain.setValueAtTime(fadeIn > 0 ? 0 : c.volume, r.start);
    if (fadeIn > 0) g.gain.linearRampToValueAtTime(c.volume, r.start + fadeIn);
    if (fadeOut > 0) {
      g.gain.setValueAtTime(c.volume, Math.max(r.start + fadeIn, r.start + r.length - fadeOut));
      g.gain.linearRampToValueAtTime(0, r.start + r.length);
    }
    src.connect(g);
    g.connect(oc.destination);
    src.start(r.start, c.in, r.length);
  }
  return oc.startRendering();
}

/** 16-bit PCM WAV file from an AudioBuffer. */
export function encodeWav(buf: AudioBuffer): Blob {
  const channels = buf.numberOfChannels;
  const frames = buf.length;
  const bytes = frames * channels * 2;
  const ab = new ArrayBuffer(44 + bytes);
  const v = new DataView(ab);
  const text = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  text(0, 'RIFF');
  v.setUint32(4, 36 + bytes, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, bytes, true);
  const data = Array.from({ length: channels }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}
