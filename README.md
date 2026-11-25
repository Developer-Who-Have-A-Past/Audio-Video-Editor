# Video & Audio Editor: Next.js monorepo

One codebase for the website, an Android app (Capacitor) and a Windows app (Tauri). Editing runs on the device; nothing is uploaded.

```
apps/
  web/        Next.js app, exported as static files (output: 'export')
  android/    Capacitor wrapper around apps/web/out
  desktop/    Tauri wrapper around apps/web/out
packages/
  core/       timeline model, edit commands, undo history (pure TypeScript, tested)
  engine/     preview renderer, audio mixdown and WAV, real-time recorder, fast-export placeholder
  ui/         React editor component
```

## Status: what was checked and what was not

| Part | Status |
| --- | --- |
| `packages/core` | 12 tests pass (`npm test`) |
| `packages/core`, `packages/engine` | Typecheck clean with `tsc` |
| `packages/ui`, `apps/web` | Written but never compiled: Next.js and React types could not be installed where this was written |
| `apps/android`, `apps/desktop` | Configuration written from the Capacitor 7 and Tauri 2 docs, never run |
| Fast export (`engine/src/exportFast.ts`) | Not implemented; the file explains the plan |

Expect to fix small compile errors on first run.

## First run

```
npm install
npm test                      # core tests
npm run typecheck             # core and engine
npm run dev                   # web app at http://localhost:3000
```

## Android

```
npm run build:web                      # creates apps/web/out
npm run add -w @editor/android         # once: creates the android project
npm run android:sync
npm run android:open                   # opens Android Studio
```

Test export on a real phone early: MediaRecorder format support in the Android WebView depends on the Android version.

## Windows

Needs Rust (rustup) and the Microsoft C++ Build Tools. Make an app icon first (a square PNG, 1024 px):

```
npx tauri icon path/to/logo.png    # run inside apps/desktop; creates src-tauri/icons
npm run desktop:dev
npm run desktop:build              # installer in apps/desktop/src-tauri/target/release/bundle
```

## What to build next

1. Port the playback loop, timeline canvas (drag to trim, waveforms) and real-time video export from the single-file prototype (`index.html`) into `packages/ui`.
2. Project save and open (the prototype stores a `.vedit` file and autosaves to IndexedDB).
3. Fast export in `packages/engine/src/exportFast.ts` with mp4box and mp4-muxer in a worker.
