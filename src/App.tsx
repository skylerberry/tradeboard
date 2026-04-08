import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import Sidebar from "./components/Sidebar";
import CustomMenuPanel from "./components/CustomMenuPanel";
import { checkForUpdates, onToast, onUpdatePrompt } from "./updater";
import { listen } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import {
  DocNode,
  loadTree,
  saveTree,
  loadActiveId,
  saveActiveId,
  saveSnapshot,
  loadSnapshot,
  createFolder,
  createDocument,
  findNode,
  findParent,
} from "./store";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem("tradeboard_theme") as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [tree, setTree] = useState<DocNode[]>(loadTree);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = loadActiveId();
    if (saved) return saved;
    const first = findFirstDoc(loadTree());
    return first?.id ?? null;
  });
  const SIDEBAR_DEFAULT = 240;
  const SIDEBAR_MIN = 180;
  const SIDEBAR_MAX = 480;

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("tradeboard_sidebar_width");
    return saved ? Number(saved) : SIDEBAR_DEFAULT;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, width: 0 });
  const editorRef = useRef<Editor | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  // Persist sidebar width
  useEffect(() => {
    if (!sidebarCollapsed) {
      localStorage.setItem("tradeboard_sidebar_width", String(sidebarWidth));
    }
  }, [sidebarWidth, sidebarCollapsed]);

  // Drag resize handlers
  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarCollapsed ? 0 : sidebarWidth;
      dragStartRef.current = { x: startX, width: startWidth };
      setIsDragging(true);

      let didDrag = false;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        if (Math.abs(delta) > 3) didDrag = true;
        const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta));
        setSidebarWidth(newWidth);
        setSidebarCollapsed(false);
      };

      const onMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (!didDrag) {
          setSidebarCollapsed((c) => !c);
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth, sidebarCollapsed],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tradeboard_theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  const [toast, setToast] = useState("");
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    onToast((msg) => {
      setToast(msg);
      if (msg && !msg.includes("Downloading") && !msg.includes("Checking") && !msg.includes("Restarting")) {
        setTimeout(() => setToast(""), 3000);
      }
    });
    onUpdatePrompt((ver, onConfirm) => {
      setUpdateInfo({ version: ver, onConfirm });
    });
    checkForUpdates();
    const unlisten = listen("menu-check-updates", () => {
      checkForUpdates(true);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const persistTree = useCallback((next: DocNode[]) => {
    setTree(next);
    saveTree(next);
  }, []);

  const saveCurrentSnapshot = useCallback(() => {
    const editor = editorRef.current;
    const id = activeIdRef.current;
    if (editor && id) {
      const snapshot = editor.getSnapshot();
      saveSnapshot(id, snapshot);
    }
  }, []);

  // Auto-save on interval
  useEffect(() => {
    const interval = setInterval(saveCurrentSnapshot, 5000);
    return () => clearInterval(interval);
  }, [saveCurrentSnapshot]);

  const handleSelect = useCallback(
    (id: string) => {
      saveCurrentSnapshot();
      setActiveId(id);
      saveActiveId(id);
    },
    [saveCurrentSnapshot],
  );

  const handleNewFolder = useCallback(
    (parentId: string | null) => {
      const next = structuredClone(tree);
      const folder = createFolder("New Folder");
      if (parentId) {
        const parent = findNode(next, parentId);
        if (parent && parent.type === "folder") {
          parent.children = parent.children || [];
          parent.children.push(folder);
        }
      } else {
        next.push(folder);
      }
      persistTree(next);
    },
    [tree, persistTree],
  );

  const handleNewDocument = useCallback(
    (parentId: string | null) => {
      const next = structuredClone(tree);
      const doc = createDocument("Untitled");
      if (parentId) {
        const parent = findNode(next, parentId);
        if (parent && parent.type === "folder") {
          parent.children = parent.children || [];
          parent.children.push(doc);
        }
      } else {
        next.push(doc);
      }
      persistTree(next);
      setActiveId(doc.id);
      saveActiveId(doc.id);
    },
    [tree, persistTree],
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      const next = structuredClone(tree);
      const node = findNode(next, id);
      if (node) node.name = name;
      persistTree(next);
    },
    [tree, persistTree],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const next = structuredClone(tree);
      const parent = findParent(next, id);
      if (parent) {
        const idx = parent.findIndex((n) => n.id === id);
        if (idx !== -1) parent.splice(idx, 1);
      }
      persistTree(next);
      if (activeId === id) {
        const first = findFirstDoc(next);
        const newId = first?.id ?? null;
        setActiveId(newId);
        if (newId) saveActiveId(newId);
      }
    },
    [tree, activeId, persistTree],
  );

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      editor.user.updateUserPreferences({ colorScheme: theme });
    },
    [theme],
  );

  // Sync theme changes to an already-mounted editor
  useEffect(() => {
    editorRef.current?.user.updateUserPreferences({ colorScheme: theme });
  }, [theme]);

  const tldrawComponents = useMemo(
    () => ({
      MenuPanel: () => (
        <CustomMenuPanel collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      ),
    }),
    [sidebarCollapsed, toggleSidebar],
  );

  // Load snapshot for active document
  const snapshot = activeId ? loadSnapshot(activeId) : null;

  return (
    <div className={`app ${isDragging ? "dragging" : ""}`}>
      <div
        className={`sidebar-container ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{
          width: sidebarCollapsed ? 0 : sidebarWidth,
          minWidth: sidebarCollapsed ? 0 : sidebarWidth,
          transition: isDragging ? "none" : undefined,
        }}
      >
        <Sidebar
          tree={tree}
          activeId={activeId}
          theme={theme}
          onSelect={handleSelect}
          onNewFolder={handleNewFolder}
          onNewDocument={handleNewDocument}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggleTheme={toggleTheme}
          onCheckUpdates={() => checkForUpdates(true)}
          toast={toast}
          version={version}
          width={sidebarWidth}
          onToggleSidebar={toggleSidebar}
        />
      </div>
      <div
        className={`sidebar-divider ${sidebarCollapsed ? "collapsed" : ""}`}
        onMouseDown={handleDividerMouseDown}
      />
      <div className="canvas-container">
        {updateInfo && (
          <div className="update-banner">
            <span>TradeBoard {updateInfo.version} is available</span>
            <button onClick={() => { setUpdateInfo(null); updateInfo.onConfirm(); }}>
              Update now
            </button>
            <button className="dismiss" onClick={() => setUpdateInfo(null)}>
              Later
            </button>
          </div>
        )}
        {activeId ? (
          <Tldraw
            key={activeId}
            onMount={handleMount}
            snapshot={snapshot ?? undefined}
            components={tldrawComponents}
          />
        ) : (
          <div className="empty-state">
            <p>Create a document to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function findFirstDoc(tree: DocNode[]): DocNode | null {
  for (const node of tree) {
    if (node.type === "document") return node;
    if (node.children) {
      const found = findFirstDoc(node.children);
      if (found) return found;
    }
  }
  return null;
}

