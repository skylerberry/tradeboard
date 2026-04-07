# TradeBoard

A native macOS (Apple Silicon) trade journal app built with **tldraw SDK + Tauri v2 + React + TypeScript**.

## Architecture

```
tradeboard/
├── src/                    # React frontend
│   ├── App.tsx             # Main app — sidebar + tldraw canvas + theme + updater
│   ├── main.tsx            # React entry point
│   ├── store.ts            # Document tree persistence (localStorage)
│   ├── updater.ts          # Auto-update check via GitHub Releases
│   ├── styles.css          # All styles — light/dark theme via CSS vars
│   └── components/
│       └── Sidebar.tsx     # Folder tree, context menus, theme toggle
├── src-tauri/              # Rust backend (Tauri v2)
│   ├── src/lib.rs          # Plugin registration (updater, process, log)
│   ├── tauri.conf.json     # App config, updater endpoint, bundle settings
│   ├── capabilities/       # Permission declarations for plugins
│   └── Cargo.toml          # Rust dependencies
├── .github/workflows/
│   └── release.yml         # GitHub Actions: build + sign + publish on tag push
├── index.html              # Vite entry
├── vite.config.ts
└── tsconfig.json
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Canvas | tldraw SDK v4 (stock shapes, no custom shapes yet) |
| Frontend | React 19, TypeScript, Vite 8 |
| Desktop shell | Tauri v2 (Rust backend, WebView frontend) |
| Persistence | localStorage (snapshots per document, folder tree, theme) |
| Auto-update | tauri-plugin-updater → GitHub Releases (`latest.json`) |
| CI/CD | GitHub Actions on tag push (`v*`) |

## Key Concepts

### Document Model
- **DocNode** (`store.ts`): tree of folders and documents stored in localStorage
- Each document gets its own tldraw canvas, persisted as a `TLEditorSnapshot`
- Snapshots saved to `localStorage` under key `tradeboard_snap_{docId}`
- Auto-save every 5 seconds + save on document switch

### Theme System
- CSS custom properties on `[data-theme="light"]` / `[data-theme="dark"]`
- Synced to tldraw via `editor.user.updateUserPreferences({ colorScheme })`
- Defaults to system preference, persisted in localStorage as `tradeboard_theme`
- Toggle button in sidebar footer (bottom-left)

### Tauri Window
- `titleBarStyle: "Overlay"` with `hiddenTitle: true` — macOS traffic lights overlay on sidebar
- Sidebar header has `webkit-app-region: drag` so the titlebar area is draggable
- Min size 800x600, default 1400x900

## Development

```bash
# Run in dev mode (hot-reload, no copying to /Applications needed)
npm run tauri dev

# Build release .app
npm run tauri build
# Output: src-tauri/target/release/bundle/macos/TradeBoard.app
```

**Prerequisites:** Node.js (via Homebrew), Rust (via rustup). Both configured in `~/.zshrc`.

## Releasing a New Version

1. Bump `version` in `src-tauri/tauri.conf.json`
2. Commit and push to `main`
3. Tag and push:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
4. GitHub Actions builds, signs, and publishes to GitHub Releases
5. Running instances of TradeBoard will detect the update on next launch

### Signing
- Private key: `~/.tauri/tradeboard.key` (local only, never committed)
- Public key: embedded in `tauri.conf.json` under `plugins.updater.pubkey`
- GitHub secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## Planned Features (not yet built)
- Cloud sync (Cloudflare R2 + D1)
- Custom tldraw shapes for trade cards, chart annotations, signal logs
- Templates system
- Drag-and-drop folder reordering
