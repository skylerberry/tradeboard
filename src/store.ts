import { TLEditorSnapshot } from "tldraw";

export type DocNode = {
  id: string;
  name: string;
  type: "folder" | "document";
  children?: DocNode[];
};

const STORAGE_KEY = "tradeboard_tree";
const ACTIVE_KEY = "tradeboard_active";

let nextId = Date.now();
function genId() {
  return String(nextId++);
}

export function createFolder(name: string): DocNode {
  return { id: genId(), name, type: "folder", children: [] };
}

export function createDocument(name: string): DocNode {
  return { id: genId(), name, type: "document" };
}

export function loadTree(): DocNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: "default-folder",
      name: "Journal",
      type: "folder",
      children: [{ id: "default-doc", name: "Untitled", type: "document" }],
    },
  ];
}

export function saveTree(tree: DocNode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function saveSnapshot(docId: string, snapshot: TLEditorSnapshot) {
  localStorage.setItem(`tradeboard_snap_${docId}`, JSON.stringify(snapshot));
}

export function loadSnapshot(docId: string): TLEditorSnapshot | null {
  try {
    const raw = localStorage.getItem(`tradeboard_snap_${docId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function findNode(
  tree: DocNode[],
  id: string,
): DocNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParent(
  tree: DocNode[],
  id: string,
): DocNode[] | null {
  for (const node of tree) {
    if (node.id === id) return tree;
    if (node.children) {
      const found = findParent(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function isDescendant(node: DocNode, id: string): boolean {
  if (node.id === id) return true;
  if (node.children) {
    return node.children.some((c) => isDescendant(c, id));
  }
  return false;
}

export function moveNode(
  tree: DocNode[],
  dragId: string,
  targetId: string,
  position: "before" | "after" | "inside",
): DocNode[] {
  const next = structuredClone(tree);
  const dragNode = findNode(next, dragId);
  if (!dragNode) return tree;

  // Prevent dropping a folder into itself
  if (dragNode.type === "folder" && isDescendant(dragNode, targetId)) return tree;

  // Remove from old position
  const oldParent = findParent(next, dragId);
  if (oldParent) {
    const idx = oldParent.findIndex((n) => n.id === dragId);
    if (idx !== -1) oldParent.splice(idx, 1);
  }

  if (position === "inside") {
    const target = findNode(next, targetId);
    if (target && target.type === "folder") {
      target.children = target.children || [];
      target.children.push(dragNode);
    }
  } else {
    const targetParent = findParent(next, targetId);
    if (targetParent) {
      const idx = targetParent.findIndex((n) => n.id === targetId);
      if (idx !== -1) {
        const insertIdx = position === "after" ? idx + 1 : idx;
        targetParent.splice(insertIdx, 0, dragNode);
      }
    }
  }

  return next;
}
