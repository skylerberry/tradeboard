import { DefaultMenuPanel } from "tldraw";

export default function CustomMenuPanel({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {collapsed && (
        <button
          className="sidebar-btn sidebar-toggle-inline"
          onClick={onToggle}
          title="Show sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
      <DefaultMenuPanel />
    </div>
  );
}
