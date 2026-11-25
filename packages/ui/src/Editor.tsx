'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ClipItem {
  id: string;
  name: string;
  track: 'v2' | 'v1' | 'a1';
  duration: number;
  text?: string;
}

const NAV_TABS = ['Media', 'Audio', 'Titles', 'Transitions', 'Effects', 'Elements', 'Split Screen'];
const SIDEBAR_ITEMS = [
  { label: 'Favorite', count: '(0)' },
  { label: 'Included', count: '(287)' },
  { label: 'Filters', count: '(160)' },
  { label: 'Overlays', count: '(90)', active: true },
  { label: 'Light Leaks', count: '(8)' },
  { label: 'Bokeh Blurs', count: '(10)' },
  { label: 'Old Film', count: '(9)' },
  { label: 'LUT', count: '(28)' },
];

const CARDS = [
  { name: 'Silent Film', bg: 'linear-gradient(135deg, #3b5249, #1f2d27)', dur: 4 },
  { name: 'Bokeh Blur 1', bg: 'linear-gradient(135deg, #4b6cb7, #182848)', dur: 5 },
  { name: 'Light Leak 4', bg: 'linear-gradient(135deg, #c97b63, #3a231c)', dur: 4 },
  { name: 'Light Leak 1', bg: 'linear-gradient(135deg, #2c5364, #0f2027)', dur: 6 },
  { name: "90's Viewfinder", bg: 'linear-gradient(135deg, #434343, #1c1c1c)', dur: 5 },
  { name: 'Static 2', bg: 'linear-gradient(135deg, #355c7d, #2a363b)', dur: 4 },
  { name: 'Silent Film 2', bg: 'linear-gradient(135deg, #616161, #2b2b2b)', dur: 5 },
  { name: 'Film 4', bg: 'linear-gradient(135deg, #5c4d3c, #262019)', dur: 4 },
  { name: 'Disco', bg: 'linear-gradient(135deg, #8e44ad, #2c3e50)', dur: 5 },
];

export function Editor() {
  const [activeTab, setActiveTab] = useState(4);
  const [search, setSearch] = useState('');
  const [clips, setClips] = useState<ClipItem[]>([
    { id: 'v2-1', name: 'Title 14', track: 'v2', duration: 5 },
    { id: 'v2-2', name: 'Split Screen 26', track: 'v2', duration: 6 },
    { id: 'v2-3', name: 'Plating Food', track: 'v2', duration: 5 },
    { id: 'v1-1', name: 'Islands', track: 'v1', duration: 6 },
    { id: 'v1-2', name: 'Beach', track: 'v1', duration: 5 },
    { id: 'a1-1', name: 'Around The Corner', track: 'a1', duration: 16 },
  ]);
  const [history, setHistory] = useState<ClipItem[][]>([]);
  const [future, setFuture] = useState<ClipItem[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>('v2-1');
  const [currentTime, setCurrentTime] = useState(4.1);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalDuration = 20;

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
  }, [isPlaying]);

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
    g.addColorStop(0, '#1e3c40');
    g.addColorStop(0.55, '#2b585e');
    g.addColorStop(1, '#142629');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(active ? active.text || active.name : 'Preview Monitor', c.width / 2, c.height / 2 - 6);
    ctx.fillStyle = '#29d398';
    ctx.font = '13px monospace';
    ctx.fillText(fmt(currentTime), c.width / 2, c.height / 2 + 20);
  }, [clips, selectedId, currentTime]);

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isAudio = file.type.startsWith('audio/');
    const item: ClipItem = { id: `c-${Date.now()}`, name: file.name, track: isAudio ? 'a1' : 'v1', duration: 5 };
    commit([...clips, item]);
    setSelectedId(item.id);
  };

  const onAddCard = (name: string, dur: number) => {
    const item: ClipItem = { id: `fx-${Date.now()}`, name, track: 'v2', duration: dur };
    commit([...clips, item]);
    setSelectedId(item.id);
  };

  const onAddText = () => {
    const text = window.prompt('Enter overlay text:', 'Title 15');
    if (!text) return;
    const item: ClipItem = { id: `t-${Date.now()}`, name: text, track: 'v2', duration: 4, text };
    commit([...clips, item]);
    setSelectedId(item.id);
  };

  const onSplit = () => {
    const target = clips.find((c) => c.id === selectedId);
    if (!target || target.duration <= 1) return;
    const half = Number((target.duration / 2).toFixed(1));
    const idx = clips.findIndex((c) => c.id === selectedId);
    const next = [...clips];
    next.splice(idx, 1, { ...target, id: `${target.id}-1`, duration: half }, { ...target, id: `${target.id}-2`, duration: half });
    commit(next);
  };

  const onDelete = () => {
    if (!selectedId) return;
    commit(clips.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

  const onExport = () => {
    const buf = new ArrayBuffer(44 + 88200);
    const v = new DataView(buf);
    const w = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + 88200, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, 88200, true);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    a.download = 'project-export.wav';
    a.click();
  };

  return (
    <div className="fx-shell">
      <header className="fx-titlebar">
        <div className="fx-dots"><span className="fx-dot r" /><span className="fx-dot y" /><span className="fx-dot g" /></div>
        <div className="fx-title">Audio-Video Studio (My Project 1)</div>
        <div className="fx-top-actions">
          <button type="button" className="fx-pill-buy" onClick={onExport}>Export</button>
        </div>
      </header>

      <section className="fx-upper">
        <div className="fx-library">
          <div className="fx-nav-bar">
            <div className="fx-tabs">
              {NAV_TABS.map((t, i) => (
                <div key={t} onClick={() => setActiveTab(i)} className={`fx-tab ${activeTab === i ? 'active' : ''}`}><span>{t}</span></div>
              ))}
            </div>
            <button type="button" className="fx-btn-export" onClick={onExport}>Export</button>
          </div>

          <div className="fx-lib-body">
            <aside className="fx-sidebar">
              {SIDEBAR_ITEMS.map((item) => (
                <div key={item.label} className={`fx-tree-row ${item.active ? 'active' : ''}`}>
                  <span>{item.label}</span><span>{item.count}</span>
                </div>
              ))}
            </aside>

            <div className="fx-grid-area">
              <div className="fx-search-row">
                <label className="fx-import-btn">+ Import<input type="file" accept="video/*,audio/*" hidden onChange={onImport} /></label>
                <input className="fx-search" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className="fx-cards">
                {CARDS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).map((card) => (
                  <div key={card.name} className="fx-card" onClick={() => onAddCard(card.name, card.dur)}>
                    <div className="fx-thumb" style={{ background: card.bg }}>
                      <span className="fx-dl-badge">+</span>
                    </div>
                    <span className="fx-card-name">{card.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="fx-player">
          <div className="fx-stage"><canvas ref={canvasRef} width={640} height={360} /></div>
          <div className="fx-transport">
            <div className="fx-scrub-row">
              <input type="range" className="fx-slider" min={0} max={totalDuration} step={0.1} value={currentTime} onChange={(e) => setCurrentTime(Number(e.target.value))} />
              <span className="fx-tc">{fmt(currentTime)}</span>
            </div>
            <div className="fx-controls-row">
              <div className="fx-btn-row">
                <button type="button" className="fx-icon-btn" onClick={() => setIsPlaying((p) => !p)}>{isPlaying ? 'Pause' : 'Play'}</button>
                <button type="button" className="fx-icon-btn" onClick={() => { setIsPlaying(false); setCurrentTime(0); }}>Stop</button>
              </div>
              <span className="fx-res-box">1/2</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fx-timeline">
        <div className="fx-tl-toolbar">
          <div className="fx-btn-row">
            <button type="button" className="fx-icon-btn" disabled={!history.length} onClick={() => { setFuture((f) => [clips, ...f]); setClips(history[history.length - 1]); setHistory((h) => h.slice(0, -1)); }}>Undo</button>
            <button type="button" className="fx-icon-btn" disabled={!future.length} onClick={() => { setHistory((h) => [...h, clips]); setClips(future[0]); setFuture((f) => f.slice(1)); }}>Redo</button>
            <button type="button" className="fx-icon-btn" disabled={!selectedId} onClick={onDelete}>Delete</button>
            <button type="button" className="fx-icon-btn" disabled={!selectedId} onClick={onSplit}>Split</button>
            <button type="button" className="fx-icon-btn" onClick={onAddText}>+ Text</button>
          </div>
          <div className="fx-btn-row">
            <input type="range" className="fx-slider" style={{ width: 95 }} defaultValue={60} />
          </div>
        </div>

        <div className="fx-tl-grid">
          <div className="fx-track-labels">
            <div className="fx-tlabel"><span>V2</span></div>
            <div className="fx-tlabel"><span>V1</span></div>
            <div className="fx-tlabel"><span>A1</span></div>
          </div>

          <div className="fx-lanes">
            <div className="fx-ruler">
              <span>00:00:00:00</span><span>00:00:05:00</span><span>00:00:10:00</span><span>00:00:15:00</span><span>00:00:20:00</span>
            </div>
            <div className="fx-playhead" style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
            <div className="fx-lanes-body">
              <div className="fx-lane">
                {clips.filter((c) => c.track === 'v2').map((c) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: `${c.duration * 34}px` }} className={`fx-clip v2 ${selectedId === c.id ? 'selected' : ''}`}>{c.name}</div>
                ))}
              </div>
              <div className="fx-lane">
                {clips.filter((c) => c.track === 'v1').map((c) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: `${c.duration * 34}px` }} className={`fx-clip v1 ${selectedId === c.id ? 'selected' : ''}`}>{c.name}</div>
                ))}
              </div>
              <div className="fx-lane">
                {clips.filter((c) => c.track === 'a1').map((c) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} className={`fx-clip a1 ${selectedId === c.id ? 'selected' : ''}`}>{c.name}</div>
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
