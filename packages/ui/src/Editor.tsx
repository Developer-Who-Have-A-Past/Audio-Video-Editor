'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  addClip, addText, duplicateClip, emptyProject, History, locate, moveClip, removeClip, removeText,
  splitAt, totalDuration, updateClip, updateText,
  type Clip, type Project,
} from '@editor/core';
import { drawFrame, encodeWav, mixdown, type PlayableMedia } from '@editor/engine';

type Imported = PlayableMedia & { file: File; duration: number };
type Selection = { type: 'clip' | 'text'; id: string } | null;

const uid = () => crypto.randomUUID();
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

function loadMedia(file: File): Promise<Imported> {
  return new Promise((resolve, reject) => {
    const element = document.createElement('video');
    element.preload = 'auto';
    element.playsInline = true;
    element.src = URL.createObjectURL(file);
    element.onloadedmetadata = () =>
      resolve({
        id: uid(),
        name: file.name,
        kind: file.type.startsWith('audio') && !element.videoWidth ? 'audio' : 'video',
        element,
        file,
        duration: element.duration,
      });
    element.onerror = () => reject(new Error(`This browser cannot read ${file.name}`));
  });
}

/**
 * Starter editor: import, scrub preview, split, trim by clip list, text, undo/redo, WAV export.
 * Still to port from the prototype (index.html): the playback loop, timeline canvas with drag trim,
 * and real-time video export (see engine/record.ts).
 */
export function Editor() {
  const history = useRef(new History<Project>(emptyProject()));
  const media = useRef(new Map<string, Imported>());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [project, setProject] = useState<Project>(history.current.present);
  const [mediaCount, setMediaCount] = useState(0);
  const [time, setTime] = useState(0);
  const [selection, setSelection] = useState<Selection>(null);
  const [message, setMessage] = useState('');

  const total = totalDuration(project);
  const apply = (next: Project) => setProject(history.current.push(next));
  const selectedClip = selection?.type === 'clip' ? project.clips.find((c) => c.id === selection.id) : undefined;
  const selectedText = selection?.type === 'text' ? project.texts.find((t) => t.id === selection.id) : undefined;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const paint = () => drawFrame(ctx, 1280, 720, time, project, (id) => media.current.get(id));
    const L = locate(project, time);
    const m = L ? media.current.get(L.clip.mediaId) : undefined;
    if (L && m) {
      const target = L.clip.in + L.local;
      if (Math.abs(m.element.currentTime - target) > 0.02) {
        m.element.addEventListener('seeked', paint, { once: true });
        m.element.currentTime = target;
        return;
      }
    }
    paint();
  }, [project, time, mediaCount]);

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of files) {
      try {
        const m = await loadMedia(file);
        media.current.set(m.id, m);
        setMediaCount(media.current.size);
        apply(addClip(history.current.present, m, uid()));
      } catch (err) {
        setMessage((err as Error).message);
      }
    }
  }

  function split() {
    const r = splitAt(project, time, uid());
    if (r) {
      apply(r.project);
      setSelection({ type: 'clip', id: r.newClipId });
    } else setMessage('Move the playhead inside a clip to split it');
  }

  function remove() {
    if (!selection) return;
    apply(selection.type === 'clip' ? removeClip(project, selection.id) : removeText(project, selection.id));
    setSelection(null);
  }

  function addCaption() {
    const id = uid();
    apply(addText(project, time, id));
    setSelection({ type: 'text', id });
  }

  const undo = () => setProject(history.current.undo());
  const redo = () => setProject(history.current.redo());

  async function exportWav() {
    if (!project.clips.length) return;
    setMessage('Mixing audio...');
    const ctx = new AudioContext();
    const buf = await mixdown(project, (id) => media.current.get(id)?.file, ctx);
    const url = URL.createObjectURL(encodeWav(buf));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'edited-audio.wav' });
    a.click();
    setMessage('Audio exported');
  }

  const patchClip = (patch: Partial<Clip>) => selectedClip && apply(updateClip(project, selectedClip.id, patch));

  return (
    <div className="editor">
      <header className="bar">
        <strong>Video &amp; Audio Editor</strong>
        <label className="btn">
          Import
          <input type="file" accept="video/*,audio/*" multiple hidden onChange={onImport} />
        </label>
        <button onClick={undo} disabled={!history.current.canUndo}>Undo</button>
        <button onClick={redo} disabled={!history.current.canRedo}>Redo</button>
        <button onClick={split}>Split</button>
        <button onClick={addCaption}>Add text</button>
        <button onClick={remove} disabled={!selection}>Delete</button>
        <button onClick={exportWav}>Export audio (WAV)</button>
        <span className="msg">{message}</span>
      </header>

      <main className="main">
        <section className="stage">
          <canvas ref={canvasRef} width={1280} height={720} />
          <input
            type="range" min={0} max={Math.max(total, 0.1)} step={0.01} value={time}
            onChange={(e) => setTime(Number(e.target.value))} aria-label="Playhead"
          />
          <div className="time">{fmt(time)} / {fmt(total)}</div>
        </section>

        <aside className="side">
          <h2>Clips</h2>
          <ol>
            {project.clips.map((c) => (
              <li key={c.id} className={selection?.id === c.id ? 'sel' : ''}>
                <button onClick={() => setSelection({ type: 'clip', id: c.id })}>
                  {media.current.get(c.mediaId)?.name ?? 'clip'} ({fmt(c.out - c.in)})
                </button>
                <button onClick={() => apply(moveClip(project, c.id, -1))} aria-label="Move earlier">&lt;</button>
                <button onClick={() => apply(moveClip(project, c.id, 1))} aria-label="Move later">&gt;</button>
                <button onClick={() => apply(duplicateClip(project, c.id, uid()))}>Copy</button>
              </li>
            ))}
          </ol>

          {selectedClip && (
            <div className="inspector">
              <label>Volume {Math.round(selectedClip.volume * 100)}%
                <input type="range" min={0} max={2} step={0.05} value={selectedClip.volume} onChange={(e) => patchClip({ volume: Number(e.target.value) })} />
              </label>
              <label>Fade in {selectedClip.fadeIn.toFixed(1)}s
                <input type="range" min={0} max={5} step={0.1} value={selectedClip.fadeIn} onChange={(e) => patchClip({ fadeIn: Number(e.target.value) })} />
              </label>
              <label>Fade out {selectedClip.fadeOut.toFixed(1)}s
                <input type="range" min={0} max={5} step={0.1} value={selectedClip.fadeOut} onChange={(e) => patchClip({ fadeOut: Number(e.target.value) })} />
              </label>
              <label>Filter
                <select value={selectedClip.filter} onChange={(e) => patchClip({ filter: e.target.value as Clip['filter'] })}>
                  {['none', 'gray', 'sepia', 'warm', 'cool', 'vivid', 'vintage'].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
              <label>Transition
                <select value={selectedClip.transition} onChange={(e) => patchClip({ transition: e.target.value as Clip['transition'] })}>
                  {['none', 'in', 'out', 'both'].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            </div>
          )}

          {selectedText && (
            <div className="inspector">
              <label>Text
                <input type="text" value={selectedText.text} onChange={(e) => apply(updateText(project, selectedText.id, { text: e.target.value }))} />
              </label>
              <label>Start (s)
                <input type="number" step={0.1} value={selectedText.start} onChange={(e) => apply(updateText(project, selectedText.id, { start: Number(e.target.value) }))} />
              </label>
              <label>End (s)
                <input type="number" step={0.1} value={selectedText.end} onChange={(e) => apply(updateText(project, selectedText.id, { end: Number(e.target.value) }))} />
              </label>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
