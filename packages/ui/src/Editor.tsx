'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ClipItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  duration: number;
  text?: string;
}

const TABS = ['Media', 'Stock Media', 'Audio', 'Titles', 'Transitions', 'Effects', 'Stickers', 'Templates'];
const SAMPLES = [
  { name: 'Neon Abstract', grad: 'linear-gradient(135deg, #0ea5e9, #6366f1)', duration: 5 },
  { name: 'Studio Silhouette', grad: 'linear-gradient(135deg, #10b981, #065f46)', duration: 4 },
  { name: 'Typography Reel', grad: 'linear-gradient(135deg, #f59e0b, #78350f)', duration: 6 },
  { name: 'Cyber Prism', grad: 'linear-gradient(135deg, #ec4899, #4f46e5)', duration: 5 },
  { name: 'Sunset Palms', grad: 'linear-gradient(135deg, #f43f5e, #8b5cf6)', duration: 7 },
  { name: 'Minimal Arch', grad: 'linear-gradient(135deg, #64748b, #1e293b)', duration: 4 },
];

export function Editor() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [clips, setClips] = useState<ClipItem[]>([
    { id: 'c1', name: 'Intro Scene', type: 'video', duration: 5 },
    { id: 'c2', name: 'Main Cut', type: 'video', duration: 6 },
  ]);
  const [history, setHistory] = useState<ClipItem[][]>([]);
  const [future, setFuture] = useState<ClipItem[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>('c1');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalDuration = Math.max(1, clips.filter((c) => c.type !== 'audio').reduce((s, c) => s + c.duration, 0));

  const commit = (next: ClipItem[]) => {
    setHistory((h) => [...h, clips]);
    setFuture([]);
    setClips(next);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime((t) => (t + 0.1 >= totalDuration ? (setIsPlaying(false), 0) : Number((t + 0.1).toFixed(1))));
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, totalDuration]);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const f = Math.floor((sec % 1) * 30).toString().padStart(2, '0');
    return `00:${m}:${s}:${f}`;
  };

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const active = clips.find((item) => item.id === selectedId) || clips[0];
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(0.5, '#1e1b4b');
    g.addColorStop(1, '#064e3b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(active ? active.text || active.name : 'No Clip Selected', c.width / 2, c.height / 2 - 8);
    ctx.fillStyle = '#16d9a3';
    ctx.font = '14px monospace';
    ctx.fillText(`Time: ${fmt(currentTime)}`, c.width / 2, c.height / 2 + 22);
  }, [clips, selectedId, currentTime]);

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const item: ClipItem = { id: `c-${Date.now()}`, name: file.name, type: file.type.startsWith('audio/') ? 'audio' : 'video', duration: 5 };
    commit([...clips, item]);
    setSelectedId(item.id);
  };

  const onAddSample = (name: string, duration: number) => {
    const item: ClipItem = { id: `s-${Date.now()}`, name, type: 'video', duration };
    commit([...clips, item]);
    setSelectedId(item.id);
  };

  const onAddText = () => {
    const text = window.prompt('Enter overlay text:', 'Title Overlay');
    if (!text) return;
    const item: ClipItem = { id: `t-${Date.now()}`, name: `Text: ${text}`, type: 'text', duration: 4, text };
    commit([...clips, item]);
    setSelectedId(item.id);
  };

  const onSplit = () => {
    const target = clips.find((c) => c.id === selectedId);
    if (!target || target.duration <= 1) return;
    const half = Number((target.duration / 2).toFixed(1));
    const idx = clips.findIndex((c) => c.id === selectedId);
    const next = [...clips];
    next.splice(idx, 1, { ...target, id: `${target.id}-1`, name: `${target.name} (1)`, duration: half }, { ...target, id: `${target.id}-2`, name: `${target.name} (2)`, duration: half });
    commit(next);
  };

  const onDelete = () => {
    if (!selectedId) return;
    commit(clips.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

  const onExport = () => {
    const buf = new ArrayBuffer(44 + 44100 * 2);
    const v = new DataView(buf);
    const w = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + 88200, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, 88200, true);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    a.download = 'project-audio.wav';
    a.click();
  };

  const videoClips = clips.filter((c) => c.type !== 'audio');
  const audioClips = clips.filter((c) => c.type === 'audio');

  return (
    <div className="nle-app">
      <header className="nle-menubar">
        <div className="menu-left">
          <div className="app-logo">V</div>
          <span className="menu-item">File</span><span className="menu-item">Edit</span><span className="menu-item">Tools</span><span className="menu-item">View</span>
        </div>
        <div className="project-title">My Project 1</div>
        <div className="menu-right">
          <button type="button" className="btn-export" onClick={onExport}>Export WAV</button>
        </div>
      </header>

      <section className="nle-upper">
        <div className="media-panel">
          <div className="category-tabs">
            {TABS.map((tab, i) => (
              <div key={tab} onClick={() => setActiveTab(i)} className={`cat-tab ${activeTab === i ? 'active' : ''}`}><span>{tab}</span></div>
            ))}
          </div>
          <div className="media-body">
            <aside className="folder-tree">
              <div className="folder-item active">Project Media</div>
              <div className="folder-item" style={{ paddingLeft: 18 }}>Sample Video</div>
              <div className="folder-item" style={{ paddingLeft: 18 }}>Audio Tracks</div>
            </aside>
            <div className="media-browser-content">
              <div className="search-bar-row">
                <input className="search-input" placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <label className="btn-import-pill">+ Import<input type="file" accept="video/*,audio/*" hidden onChange={onImport} /></label>
              </div>
              <div className="section-label">Sample Video & Clips</div>
              <div className="media-grid">
                {SAMPLES.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).map((card) => (
                  <div key={card.name} className="media-card" onClick={() => onAddSample(card.name, card.duration)}>
                    <div className="media-thumb" style={{ background: card.grad }}>ADD</div>
                    <span className="media-card-title">{card.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="player-panel">
          <div className="player-header">PLAYER</div>
          <div className="player-viewport"><canvas ref={canvasRef} width={640} height={360} /></div>
          <div className="player-controls">
            <div className="scrubber-row">
              <input type="range" className="mint-slider" min={0} max={totalDuration} step={0.1} value={currentTime} onChange={(e) => setCurrentTime(Number(e.target.value))} />
              <span className="timecode-display">{fmt(currentTime)}</span>
            </div>
            <div className="transport-buttons">
              <div className="icon-btn-group">
                <button type="button" className="tool-icon-btn" onClick={() => setIsPlaying((p) => !p)}>{isPlaying ? 'Pause' : 'Play'}</button>
                <button type="button" className="tool-icon-btn" onClick={() => { setIsPlaying(false); setCurrentTime(0); }}>Stop</button>
              </div>
              <span className="quality-badge">Full Quality</span>
            </div>
          </div>
        </div>
      </section>

      <section className="timeline-panel">
        <div className="timeline-actionbar">
          <div className="icon-btn-group">
            <button type="button" className="tool-icon-btn" disabled={!history.length} onClick={() => { setFuture((f) => [clips, ...f]); setClips(history[history.length - 1]); setHistory((h) => h.slice(0, -1)); }}>Undo</button>
            <button type="button" className="tool-icon-btn" disabled={!future.length} onClick={() => { setHistory((h) => [...h, clips]); setClips(future[0]); setFuture((f) => f.slice(1)); }}>Redo</button>
            <button type="button" className="tool-icon-btn" disabled={!selectedId} onClick={onSplit}>Split</button>
            <button type="button" className="tool-icon-btn" onClick={onAddText}>+ Add Text</button>
            <button type="button" className="tool-icon-btn" disabled={!selectedId} onClick={onDelete}>Delete</button>
          </div>
        </div>

        <div className="timeline-body">
          <div className="track-headers">
            <div className="track-header-item">Video V1</div>
            <div className="track-header-item">Audio A1</div>
          </div>
          <div className="timeline-lanes">
            <div className="timecode-ruler"><span>00:00:00:00</span><span>00:00:05:00</span><span>00:00:10:00</span><span>00:00:15:00</span></div>
            <div className="playhead-needle" style={{ left: `${Math.min(100, (currentTime / totalDuration) * 100)}%` }}><div className="playhead-cap" /></div>
            <div className="tracks-container">
              <div className="track-lane">
                {videoClips.map((c, i) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: `${c.duration * 36}px` }} className={`nle-clip clip-color-${i % 4} ${selectedId === c.id ? 'selected' : ''}`}>{c.name}</div>
                ))}
              </div>
              <div className="track-lane">
                {audioClips.map((c) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: `${c.duration * 36}px` }} className={`nle-clip clip-color-audio ${selectedId === c.id ? 'selected' : ''}`}>{c.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Editor;
