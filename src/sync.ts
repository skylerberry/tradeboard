const SYNC_URL = "https://tradeboard-sync.skylerpberry.workers.dev";
const SYNC_KEY = "03e3ba6584a1db0f4ac90d6f91b41cd9c06a683cc74880a5a4b4741ddb763340";

const headers = {
  "X-Sync-Key": SYNC_KEY,
  "Content-Type": "application/json",
};

export async function fetchTree(): Promise<{ tree: unknown; updated_at: string | null }> {
  const res = await fetch(`${SYNC_URL}/tree`, { headers });
  return res.json();
}

export async function pushTree(tree: unknown): Promise<void> {
  await fetch(`${SYNC_URL}/tree`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ tree }),
  });
}

export async function fetchSnapshot(docId: string): Promise<unknown | null> {
  const res = await fetch(`${SYNC_URL}/snapshot/${docId}`, { headers });
  if (res.status === 404) return null;
  return res.json();
}

export async function pushSnapshot(docId: string, snapshot: unknown): Promise<void> {
  await fetch(`${SYNC_URL}/snapshot/${docId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(snapshot),
  });
}

export async function deleteSnapshot(docId: string): Promise<void> {
  await fetch(`${SYNC_URL}/snapshot/${docId}`, {
    method: "DELETE",
    headers,
  });
}

export async function listSnapshotKeys(): Promise<string[]> {
  const res = await fetch(`${SYNC_URL}/snapshots`, { headers });
  const data = await res.json() as { keys: string[] };
  return data.keys;
}
