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
