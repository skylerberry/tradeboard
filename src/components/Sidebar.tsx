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
}: SidebarProps) {
  return (
    <aside className="sidebar" style={{ width }}>
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <button
            className="sidebar-btn sidebar-collapse-btn"
            onClick={onToggleSidebar}
            title="Toggle sidebar"
          >
            <PanelIcon />
          </button>
          <span className="sidebar-title">TradeBoard</span>
        </div>
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
      <nav className="sidebar-tree">
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
          />
        ))}
      </nav>
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

function TreeNode({
  node,
  depth,
  activeId,
  onSelect,
  onNewFolder,
  onNewDocument,
  onRename,
  onDelete,
}: {
  node: DocNode;
  depth: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onNewDocument: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <div
        className={`tree-item ${isActive ? "active" : ""}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
          <button className="danger" onClick={() => { onDelete(node.id); setContextMenu(null); }}>
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
