'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ClipItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  duration: number;
  url?: string;
  text?: string;
}

const TABS = ['Media', 'Stock Media', 'Audio', 'Titles', 'Transitions', 'Effects', 'Stickers', 'Templates'];

const SAMPLE_CARDS = [
  { name: 'Neon Abstract', grad: 'linear-gradient(135deg, #0ea5e9, #6366f1)', duration: 5 },
  { name: 'Studio Silhouette', grad: 'linear-gradient(135deg, #10b981, #065f46)', duration: 4 },
  { name: 'Typography Reel', grad: 'linear-gradient(135deg, #f59e0b, #78350f)', duration: 6 },
  { name: 'Cyber Prism', grad: 'linear-gradient(135deg, #ec4899, #4f46e5)', duration: 5 },
  { name: 'Sunset Palms', grad: 'linear-gradient(135deg, #f43f5e, #8b5cf6)', duration: 7 },
  { name: 'Minimal Arch', grad: 'linear-gradient(135deg, #64748b, #1e293b)', duration: 4 },
];

export function Editor() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
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
  const totalDuration = Math.max(
    1,
    clips.filter((c) => c.type !== 'audio').reduce((acc, c) => acc + c.duration, 0)
  );

  // Push state to undo stack
  const commitClips = (next: ClipItem[]) => {
    setHistory((prev) => [...prev, clips]);
    setFuture([]);
    setClips(next);
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        if (t + 0.1 >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return Number((t + 0.1).toFixed(1));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  // Render preview frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeClip = clips.find((c) => c.id === selectedId) || clips[0];
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#064e3b');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      activeClip ? activeClip.text || activeClip.name : 'No Clip Selected',
      canvas.width / 2,
      canvas.height / 2 - 8
    );

    ctx.fillStyle = '#16d9a3';
    ctx.font = '14px monospace';
    ctx.fillText(`Time: ${formatTimecode(currentTime)}`, canvas.width / 2, canvas.height / 2 + 22);
  }, [clips, selectedId, currentTime]);

  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    const frames = Math.floor((sec % 1) * 30)
      .toString()
      .padStart(2, '0');
    return `00:${mins}:${secs}:${frames}`;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isAudio = file.type.startsWith('audio/');
    const newClip: ClipItem = {
      id: `clip-${Date.now()}`,
      name: file.name,
      type: isAudio ? 'audio' : 'video',
      duration: 5,
      url: URL.createObjectURL(file),
    };
    commitClips([...clips, newClip]);
    setSelectedId(newClip.id);
  };

  const handleAddSample = (name: string, duration: number) => {
    const newClip: ClipItem = {
      id: `sample-${Date.now()}`,
      name,
      type: 'video',
      duration,
    };
    commitClips([...clips, newClip]);
    setSelectedId(newClip.id);
  };

  const handleAddText = () => {
    const text = window.prompt('Enter overlay text:', 'Title Overlay');
    if (!text) return;
    const newClip: ClipItem = {
      id: `text-${Date.now()}`,
      name: `Text: ${text}`,
      type: 'text',
      duration: 4,
      text,
    };
    commitClips([...clips, newClip]);
    setSelectedId(newClip.id);
  };

  const handleSplit = () => {
    if (!selectedId) return;
    const target = clips.find((c) => c.id === selectedId);
    if (!target || target.duration <= 1) return;
    const half = Number((target.duration / 2).toFixed(1));
    const idx = clips.findIndex((c) => c.id === selectedId);
    const next = [...clips];
    next.splice(
      idx,
      1,
      { ...target, id: `${target.id}-a`, name: `${target.name} (1)`, duration: half },
      { ...target, id: `${target.id}-b`, name: `${target.name} (2)`, duration: half }
    );
    commitClips(next);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    commitClips(clips.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((f) => [clips, ...f]);
    setHistory((h) => h.slice(0, -1));
    setClips(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, clips]);
    setFuture((f) => f.slice(1));
    setClips(next);
  };

  const handleExportWav = () => {
    const sampleRate = 44100;
    const numSamples = sampleRate * 1;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'project-audio.wav';
    a.click();
  };

  const filteredSamples = SAMPLE_CARDS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const videoClips = clips.filter((c) => c.type !== 'audio');
  const audioClips = clips.filter((c) => c.type === 'audio');
  const playheadPercent = Math.min(100, (currentTime / totalDuration) * 100);

  return (
    <div className="nle-app">
      {/* 1. TOP MENU BAR */}
      <header className="nle-menubar">
        <div className="menu-left">
          <div className="app-logo">V</div>
          <span className="menu-item">File</span>
          <span className="menu-item">Edit</span>
          <span className="menu-item">Tools</span>
          <span className="menu-item">View</span>
          <span className="menu-item">Help</span>
        </div>

        <div className="project-title">My Project 1</div>

        <div className="menu-right">
          <button className="btn-export" onClick={handleExportWav}>
            Export WAV
          </button>
        </div>
      </header>

      {/* 2. UPPER SPLIT: MEDIA BROWSER + PLAYER */}
      <section className="nle-upper">
        <div className="media-panel">
          <div className="category-tabs">
            {TABS.map((tab, i) => (
              <div
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`cat-tab ${activeTab === i ? 'active' : ''}`}
              >
                <span>{tab}</span>
              </div>
            ))}
          </div>

          <div className="media-body">
            <aside className="folder-tree">
              <div className="folder-item active">▾ Project Media</div>
              <div className="folder-item" style={{ paddingLeft: 18 }}>
                📁 Sample Video
              </div>
              <div className="folder-item" style={{ paddingLeft: 18 }}>
                📁 Audio Tracks
              </div>
              <div className="folder-item" style={{ paddingLeft: 18 }}>
                📁 Text Layers
              </div>
            </aside>

            <div className="media-browser-content">
              <div className="search-bar-row">
                <input
                  className="search-input"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <label className="btn-import-pill">
                  + Import
                  <input type="file" accept="video/*,audio/*" hidden onChange={handleImport} />
                </label>
              </div>

              <div className="section-label">Sample Video & Clips (Click to Add)</div>
              <div className="media-grid">
                {filteredSamples.map((card) => (
                  <div
                    key={card.name}
                    className="media-card"
                    onClick={() => handleAddSample(card.name, card.duration)}
                  >
                    <div className="media-thumb" style={{ background: card.grad }}>
                      ▶
                    </div>
                    <span className="media-card-title">{card.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview Player */}
        <div className="player-panel">
          <div className="player-header">PLAYER</div>
          <div className="player-viewport">
            <canvas ref={canvasRef} width={640} height={360} />
          </div>

          <div className="player-controls">
            <div className="scrubber-row">
              <input
                type="range"
                className="mint-slider"
                min={0}
                max={totalDuration}
                step={0.1}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
              />
              <span className="timecode-display">{formatTimecode(currentTime)}</span>
            </div>

            <div className="transport-buttons">
              <div className="icon-btn-group">
                <button className="tool-icon-btn" onClick={() => setIsPlaying((p) => !p)}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                  className="tool-icon-btn"
