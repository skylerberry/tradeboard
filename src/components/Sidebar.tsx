import { useState, useRef, useEffect } from "react";
import { DocNode } from "../store";

type Theme = "light" | "dark";

type SidebarProps = {
  tree: DocNode[];
  activeId: string | null;
  theme: Theme;
  onSelect: (id: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onNewDocument: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleTheme: () => void;
  onCheckUpdates: () => Promise<void>;
  toast: string;
  version: string;
  width: number;
  onToggleSidebar: () => void;
  onMove: (dragId: string, targetId: string, position: "before" | "after" | "inside") => void;
};

export default function Sidebar({
  tree,
  activeId,
  theme,
  onSelect,
  onNewFolder,
  onNewDocument,
  onRename,
  onDelete,
  onToggleTheme,
  onCheckUpdates,
  toast,
  version,
  width,
  onToggleSidebar,
  onMove,
}: SidebarProps) {
  return (
    <aside className="sidebar" style={{ width }}>
      <div className="sidebar-titlebar">
        <button
          className="sidebar-btn sidebar-collapse-btn"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          <PanelIcon />
        </button>
      </div>
      <div className="sidebar-header">
        <span className="sidebar-title">TradeBoard</span>
        <div className="sidebar-actions">
          <button
            className="sidebar-btn"
            onClick={() => onNewFolder(null)}
            title="New folder"
          >
            <FolderPlusIcon />
          </button>
          <button
            className="sidebar-btn"
            onClick={() => onNewDocument(null)}
            title="New document"
          >
            <DocPlusIcon />
          </button>
        </div>
      </div>
      <SearchBar tree={tree} onSelect={onSelect} />
      <SidebarTree
        tree={tree}
        activeId={activeId}
        onSelect={onSelect}
        onNewFolder={onNewFolder}
        onNewDocument={onNewDocument}
        onRename={onRename}
        onDelete={onDelete}
        onMove={onMove}
      />
      <div className="sidebar-footer">
        {toast ? (
          <span className="sidebar-toast">{toast}</span>
        ) : (
          <span className="sidebar-version">v{version}</span>
        )}
        <div className="sidebar-footer-actions">
          <UpdateButton onCheckUpdates={onCheckUpdates} />
          <button
            className="sidebar-btn"
            onClick={onToggleTheme}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarTree({
  tree,
  activeId,
  onSelect,
  onNewFolder,
  onNewDocument,
  onRename,
  onDelete,
  onMove,
}: {
  tree: DocNode[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onNewDocument: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragId: string, targetId: string, position: "before" | "after" | "inside") => void;
}) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [ctxMenu]);

  return (
    <>
      <nav
        className="sidebar-tree"
        onContextMenu={(e) => {
          if ((e.target as HTMLElement).closest(".tree-item")) return;
          e.preventDefault();
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            activeId={activeId}
            onSelect={onSelect}
            onNewFolder={onNewFolder}
            onNewDocument={onNewDocument}
            onRename={onRename}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </nav>
      {ctxMenu && (
        <div className="context-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }}>
          <button onClick={() => { onNewFolder(null); setCtxMenu(null); }}>
            New folder
          </button>
          <button onClick={() => { onNewDocument(null); setCtxMenu(null); }}>
            New document
          </button>
        </div>
      )}
    </>
  );
}

function flattenTree(nodes: DocNode[]): DocNode[] {
  const result: DocNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) result.push(...flattenTree(node.children));
  }
  return result;
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function SearchBar({
  tree,
  onSelect,
}: {
  tree: DocNode[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to focus search (won't conflict with tldraw tools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return;
      const el = document.activeElement as HTMLElement;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = query.length > 0
    ? flattenTree(tree).filter((n) => fuzzyMatch(n.name, query))
    : [];

  return (
    <div className="sidebar-search">
      <input
        ref={inputRef}
        className="sidebar-search-input"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            inputRef.current?.blur();
          }
          if (e.key === "Enter" && results.length > 0) {
            const exact = results.find(
              (n) => n.name.toLowerCase() === query.toLowerCase(),
            );
            const target = exact || (results.length === 1 ? results[0] : null);
            if (target) {
              onSelect(target.id);
              setQuery("");
              inputRef.current?.blur();
            }
          }
        }}
      />
      {focused && results.length > 0 && (
        <div className="sidebar-search-results">
          {results.map((node) => (
            <button
              key={node.id}
              className="sidebar-search-result"
              onMouseDown={() => {
                onSelect(node.id);
                setQuery("");
              }}
            >
              <span className="tree-icon">
                {node.type === "folder" ? <FolderIcon /> : <DocIcon />}
              </span>
              {node.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h4l1.5 1.5H14v8H2V4z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function TreeNode({
  node,
  depth,
  activeId,
  onSelect,
  onNewFolder,
  onNewDocument,
  onRename,
  onDelete,
  onMove,
}: {
  node: DocNode;
  depth: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onNewDocument: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragId: string, targetId: string, position: "before" | "after" | "inside") => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const isFolder = node.type === "folder";
  const isActive = node.id === activeId;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      onSelect(node.id);
    }
  };

  const commitRename = (value: string) => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== node.name) {
      onRename(node.id, trimmed);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const ratio = y / rect.height;
    if (isFolder && ratio > 0.25 && ratio < 0.75) {
      setDropPosition("inside");
    } else if (ratio < 0.5) {
      setDropPosition("before");
    } else {
      setDropPosition("after");
    }
  };

  const handleDragLeave = () => setDropPosition(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData("text/plain");
    if (dragId && dragId !== node.id && dropPosition) {
      onMove(dragId, node.id, dropPosition);
    }
    setDropPosition(null);
  };

  return (
    <>
      <div
        ref={itemRef}
        className={`tree-item ${isActive ? "active" : ""} ${dropPosition ? `drop-${dropPosition}` : ""}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={!editing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="tree-icon">
          {isFolder ? (expanded ? <ChevronDown /> : <ChevronRight />) : <DocIcon />}
        </span>
        {editing ? (
          <input
            ref={inputRef}
            className="tree-rename-input"
            defaultValue={node.name}
            onBlur={(e) => commitRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename(e.currentTarget.value);
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="tree-label"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {node.name}
          </span>
        )}
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => { setEditing(true); setContextMenu(null); }}>
            Rename
          </button>
          {isFolder && (
            <>
              <button onClick={() => { onNewFolder(node.id); setContextMenu(null); }}>
                New folder
              </button>
              <button onClick={() => { onNewDocument(node.id); setContextMenu(null); }}>
                New document
              </button>
            </>
          )}
          <button className="danger" onClick={() => {
            setContextMenu(null);
            if (window.confirm(`Delete "${node.name}"?`)) {
              onDelete(node.id);
            }
          }}>
            Delete
          </button>
        </div>
      )}

      {isFolder && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          activeId={activeId}
          onSelect={onSelect}
          onNewFolder={onNewFolder}
          onNewDocument={onNewDocument}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h5l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FolderPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h4l1.5 1.5H14v8H2V4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7.5v4M6 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function DocPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h5l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7v4M6 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function UpdateButton({ onCheckUpdates }: { onCheckUpdates: () => Promise<void> }) {
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await onCheckUpdates();
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      className={`sidebar-btn ${checking ? "spin" : ""}`}
      onClick={handleClick}
      title="Check for updates"
      disabled={checking}
    >
      <UpdateIcon />
    </button>
  );
}

function UpdateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8a5.5 5.5 0 019.3-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.5 8a5.5 5.5 0 01-9.3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 2.5l.8 1.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13.5l-.8-1.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 9.5a5.5 5.5 0 01-7-7 5.5 5.5 0 107 7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.75 3.75l1.06 1.06M11.19 11.19l1.06 1.06M12.25 3.75l-1.06 1.06M4.81 11.19l-1.06 1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
