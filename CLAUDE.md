# TradeBoard

A native macOS (Apple Silicon) trade journal app built with **tldraw SDK + Tauri v2 + React + TypeScript**.

## Architecture

```
tradeboard/
├── src/                    # React frontend
│   ├── App.tsx             # Main app — sidebar + tldraw canvas + theme + updater
│   ├── main.tsx            # React entry point
│   ├── store.ts            # Document tree persistence (localStorage), moveNode for drag-reorder
│   ├── updater.ts          # Auto-update check via GitHub Releases, toast-based UI feedback
│   ├── styles.css          # All styles — light/dark theme via CSS vars
│   └── components/
│       ├── Sidebar.tsx     # Folder tree, context menus, drag-reorder, search, theme toggle
│       ├── CustomMenuPanel.tsx   # tldraw MenuPanel override — sidebar toggle in toolbar
│       ├── CustomContextMenu.tsx # Minimal context menu: lock, duplicate, reorder
│       └── CustomToolbar.tsx     # Custom toolbar: no media, replaced with line tool
├── src-tauri/              # Rust backend (Tauri v2)
│   ├── src/lib.rs          # Plugin registration, custom menu bar (About, Check for Updates, Edit, Window)
│   ├── tauri.conf.json     # App config, updater endpoint, bundle settings
│   ├── capabilities/       # Permission declarations for plugins
│   └── Cargo.toml          # Rust dependencies
├── .github/workflows/
│   └── release.yml         # GitHub Actions: build + sign + publish on tag push (cached, Apple Silicon runner)
├── index.html              # Vite entry
├── vite.config.ts
└── tsconfig.json
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Canvas | tldraw SDK v4 (custom toolbar, context menu, menu panel overrides) |
| Frontend | React 19, TypeScript, Vite 8 |
| Desktop shell | Tauri v2 (Rust backend, WebView frontend) |
| Persistence | localStorage (snapshots per document, folder tree, theme, sidebar width) |
| Auto-update | tauri-plugin-updater → GitHub Releases (`latest.json`), in-app toast + banner |
| CI/CD | GitHub Actions on tag push (`v*`), Rust cache via Swatinem/rust-cache, macos-14 runner |

## Key Concepts

### Document Model
- **DocNode** (`store.ts`): tree of folders and documents stored in localStorage
- Each document gets its own tldraw canvas, persisted as a `TLEditorSnapshot`
- Snapshots saved to `localStorage` under key `tradeboard_snap_{docId}`
- Auto-save every 5 seconds + save on document switch
- Drag-and-drop reordering via `moveNode()` — supports before/after/inside positioning

### Sidebar
- Resizable via drag divider (180px–480px), width persisted in localStorage
- Click divider to collapse/expand with animation
- Sidebar toggle also appears in tldraw's MenuPanel when collapsed (via `CustomMenuPanel` using refs to avoid re-renders)
- Fuzzy search bar at top filters folders and documents by name
- Right-click context menu: rename, new folder/document, delete
- Double-click name to inline rename

### Theme System
- CSS custom properties on `[data-theme="light"]` / `[data-theme="dark"]`
- Synced to tldraw via `editor.user.updateUserPreferences({ colorScheme })`
- Defaults to system preference, persisted in localStorage as `tradeboard_theme`
- Toggle button in sidebar footer (bottom-left)

### tldraw Customizations
- **Toolbar** (`CustomToolbar.tsx`): select, hand, draw, eraser, arrow, text, note, line, rectangle, ellipse, arrow shapes, highlight, laser. No media tool.
- **Context menu** (`CustomContextMenu.tsx`): lock/unlock, duplicate, reorder (bring to front/forward, send backward/back). No cut/copy/paste/export (user prefers keyboard shortcuts).
- **MenuPanel** (`CustomMenuPanel.tsx`): adds sidebar toggle button inline with tldraw toolbar when sidebar is collapsed. Uses refs to keep tldraw components stable and prevent canvas flash on re-render.
- License watermark hidden via CSS

### Auto-updater
- Checks GitHub Releases endpoint on launch + manual button in sidebar footer
- Toast messages in sidebar footer show status (checking, latest version, error details)
- Update available → banner at top of canvas with "Update now" / "Later" buttons
- Menu bar "Check for Updates..." also triggers check via Tauri event system
- Repo is public so no auth token needed for release asset downloads

### Tauri Window
- `titleBarStyle: "Overlay"` with `hiddenTitle: true` — macOS traffic lights overlay on sidebar
- Sidebar header has `webkit-app-region: drag` so the titlebar area is draggable
- Custom menu bar: TradeBoard (About, Check for Updates, Quit), Edit, Window
- Min size 800x600, default 1400x900

### Performance Notes
- `tldrawComponents` is memoized with stable refs to prevent canvas re-renders when sidebar state changes
- Snapshot loading is memoized by `activeId` to avoid re-evaluation on unrelated state changes
- Canvas container uses `contain: layout` to isolate reflows during sidebar resize
- CI uses `Swatinem/rust-cache@v2` and npm cache for faster builds (~1-2 min with warm cache)

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
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
4. GitHub Actions builds, signs, and publishes to GitHub Releases
5. Running instances of TradeBoard will detect the update on next launch or manual check

### Signing
- Private key: `~/.tauri/tradeboard.key` (local only, never committed)
- Public key: embedded in `tauri.conf.json` under `plugins.updater.pubkey`
- GitHub secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## Planned Features (not yet built)
- Cloud sync (Cloudflare R2 + D1)
- Custom tldraw shapes for trade cards, chart annotations, signal logs
- Templates system
