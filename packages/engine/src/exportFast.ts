import type { Project } from '@editor/core';

/**
 * NOT IMPLEMENTED. Placeholder for the faster-than-real-time export.
 *
 * Plan (needs `npm i mp4box mp4-muxer`; run it in a Web Worker):
 *  1. Demux each source file with mp4box.js to get encoded video samples and the codec config.
 *  2. Decode the samples with a WebCodecs VideoDecoder, in timeline order, one clip at a time.
 *  3. For every output frame: draw the decoded VideoFrame into an OffscreenCanvas with drawFrame()
 *     so filters, text and transitions apply, then `new VideoFrame(canvas, { timestamp })`.
 *  4. Encode with a VideoEncoder (avc1 or vp09), and the mixdown() audio with an AudioEncoder (mp4a.40.2).
 *  5. Mux the chunks with mp4-muxer and return the file.
 *
 * Seeking a <video> element frame by frame is NOT a substitute: browsers return stale frames after 'seeked'.
 */
export interface FastExportOptions {
  width: number;
  height: number;
  videoKbps: number;
  onProgress?: (fraction: number) => void;
}

export async function exportFast(_project: Project, _options: FastExportOptions): Promise<Blob> {
  throw new Error('Fast export is not implemented yet. Use the real-time export in record.ts.');
}
