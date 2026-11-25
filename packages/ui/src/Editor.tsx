const TABS = ['Media', 'Stock Media', 'Audio', 'Titles', 'Transitions', 'Effects', 'Stickers', 'Templates'];
const SAMPLE_CARDS = [
  { name: 'Neon Abstract', grad: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
  { name: 'Studio Silhouette', grad: 'linear-gradient(135deg, #10b981, #065f46)' },
  { name: 'Typography Reel', grad: 'linear-gradient(135deg, #f59e0b, #78350f)' },
  { name: 'Cyber Prism', grad: 'linear-gradient(135deg, #ec4899, #4f46e5)' },
  { name: 'Sunset Palms', grad: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' },
  { name: 'Minimal Arch', grad: 'linear-gradient(135deg, #64748b, #1e293b)' },
];

// Inside your Editor component return:
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
        <button className="btn-export" /* onClick={yourExportWavHandler} */>
          Export WAV
        </button>
      </div>
    </header>

    {/* 2. UPPER SPLIT: MEDIA BROWSER + PLAYER */}
    <section className="nle-upper">
      {/* Left: Filmora-style Asset Library */}
      <div className="media-panel">
        <div className="category-tabs">
          {TABS.map((tab, i) => (
            <div key={tab} className={`cat-tab ${i === 0 ? 'active' : ''}`}>
              <span>{tab}</span>
            </div>
          ))}
        </div>

        <div className="media-body">
          <aside className="folder-tree">
            <div className="folder-item active">▾ Project Media</div>
            <div className="folder-item" style={{ paddingLeft: 18 }}>📁 Sample Video</div>
            <div className="folder-item" style={{ paddingLeft: 18 }}>📁 Audio Tracks</div>
            <div className="folder-item" style={{ paddingLeft: 18 }}>📁 Text Layers</div>
          </aside>

          <div className="media-browser-content">
            <div className="search-bar-row">
              <input className="search-input" placeholder="Search media..." />
              <label className="btn-import-pill">
                + Import
                <input type="file" hidden /* onChange={yourImportHandler} */ />
              </label>
            </div>

            <div className="section-label">Sample Video & Clips</div>
            <div className="media-grid">
              {SAMPLE_CARDS.map((card) => (
                <div key={card.name} className="media-card">
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
          {/* Place your existing <canvas ref={canvasRef} /> here */}
        </div>

        <div className="player-controls">
          <div className="scrubber-row">
            <input
              type="range"
              className="mint-slider"
              /* value={currentTime} max={duration} onChange={yourSeekHandler} */
            />
            <span className="timecode-display">00:00:00:00</span>
          </div>

          <div className="transport-buttons">
            <div className="icon-btn-group">
              <button className="tool-icon-btn" /* onClick={yourPlayPauseHandler} */>▶</button>
              <button className="tool-icon-btn" /* onClick={yourStopHandler} */>⏹</button>
            </div>
            <span className="quality-badge">Full Quality</span>
          </div>
        </div>
      </div>
    </section>

    {/* 3. BOTTOM MULTI-TRACK TIMELINE */}
    <section className="timeline-panel">
      <div className="timeline-actionbar">
        <div className="icon-btn-group">
          <button className="tool-icon-btn" /* onClick={yourUndoHandler} */>↶ Undo</button>
          <button className="tool-icon-btn" /* onClick={yourRedoHandler} */>↷ Redo</button>
          <button className="tool-icon-btn" /* onClick={yourSplitHandler} */>✂ Split</button>
          <button className="tool-icon-btn" /* onClick={yourAddTextHandler} */>T+ Add Text</button>
          <button className="tool-icon-btn" /* onClick={yourDeleteHandler} */>🗑 Delete</button>
        </div>
        <div className="icon-btn-group">
          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Zoom</span>
          <input type="range" className="mint-slider" style={{ width: 90 }} />
        </div>
      </div>

      <div className="timeline-body">
        <div className="track-headers">
          <div className="track-header-item">🎬 V1</div>
          <div className="track-header-item">🎵 A1</div>
        </div>

        <div className="timeline-lanes">
          <div className="timecode-ruler">
            <span>00:00:00:00</span>
            <span>00:00:05:00</span>
            <span>00:00:10:00</span>
            <span>00:00:15:00</span>
            <span>00:00:20:00</span>
          </div>

          {/* Red Playhead */}
          <div className="playhead-needle" style={{ left: '32%' }}>
            <div className="playhead-cap" />
          </div>

          <div className="tracks-container">
            {/* Video Track: Map your state clips here */}
            <div className="track-lane">
              {/* Example of how your mapped clips will look:
                  clips.map((clip, idx) => (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedId(clip.id)}
                      className={`nle-clip clip-color-${idx % 4} ${selectedId === clip.id ? 'selected' : ''}`}
                    >
                      {clip.name}
                    </div>
                  ))
              */}
            </div>

            {/* Audio / Overlay Track */}
            <div className="track-lane">
              {/* Map audio or text clips here with className="nle-clip clip-color-audio" */}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);
