import { useState, useCallback, useRef, useEffect } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import Sidebar from "./components/Sidebar";
import { checkForUpdates } from "./updater";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const editorRef = useRef<Editor | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tradeboard_theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  useEffect(() => {
    checkForUpdates();
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

  // Load snapshot for active document
  const snapshot = activeId ? loadSnapshot(activeId) : null;

  return (
    <div className="app">
      <div className={`sidebar-container ${sidebarOpen ? "open" : "closed"}`}>
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
        />
      </div>
      <div className="canvas-container">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </button>
        {activeId ? (
          <Tldraw
            key={activeId}
            onMount={handleMount}
            snapshot={snapshot ?? undefined}
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

function PanelLeftClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 9l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PanelLeftOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 9l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
