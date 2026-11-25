export interface ExportFormat {
  mime: string;
  label: string;
  extension: 'mp4' | 'webm';
}

const CANDIDATES: ExportFormat[] = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4 (H.264 + AAC)', extension: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', label: 'WebM (VP9 + Opus)', extension: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', label: 'WebM (VP8 + Opus)', extension: 'webm' },
];

/** Formats this browser's MediaRecorder can produce, best first. */
export function supportedFormats(): ExportFormat[] {
  if (typeof MediaRecorder === 'undefined') return [];
  return CANDIDATES.filter((f) => MediaRecorder.isTypeSupported(f.mime));
}

export const RESOLUTIONS = { '1080': [1920, 1080], '720': [1280, 720], '480': [854, 480] } as const;
export type ResolutionKey = keyof typeof RESOLUTIONS;

export interface Recording {
  /** Canvas to draw each export frame into while playback runs. */
  canvas: HTMLCanvasElement;
  /** Stop recording and get the finished file. */
  stop(): Promise<Blob>;
}

/**
 * Real-time export: records a canvas plus an audio stream with MediaRecorder.
 * The app plays the project from 0 to the end, calls drawFrame(recording.canvas) every frame, then calls stop().
 * `audio` is a MediaStreamAudioDestinationNode stream carrying the clips' audio.
 */
export function startRecording(opts: {
  width: number;
  height: number;
  audio?: MediaStream;
  format: ExportFormat;
  videoKbps: number;
}): Recording {
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  const stream = canvas.captureStream(30);
  opts.audio?.getAudioTracks().forEach((t) => stream.addTrack(t));
  const recorder = new MediaRecorder(stream, {
    mimeType: opts.format.mime,
    videoBitsPerSecond: opts.videoKbps * 1000,
    audioBitsPerSecond: 128000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.start(1000);
  return {
    canvas,
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: opts.format.mime.split(';')[0] }));
        recorder.stop();
      }),
  };
}

/** Rough output size in megabytes. */
export const estimateMegabytes = (seconds: number, videoKbps: number) => ((videoKbps + 128) * seconds) / 8 / 1024;
