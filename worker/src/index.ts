export interface Env {
  SNAPSHOTS: R2Bucket;
  META: D1Database;
  SYNC_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Simple auth — header must match secret
    const auth = request.headers.get("X-Sync-Key");
    if (auth !== env.SYNC_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // --- Tree endpoints ---
    if (path === "/tree" && request.method === "GET") {
      const row = await env.META.prepare(
        "SELECT data, updated_at FROM tree WHERE id = 'main' LIMIT 1"
      ).first<{ data: string; updated_at: string }>();
      if (!row) return Response.json({ tree: null, updated_at: null });
      return Response.json({ tree: JSON.parse(row.data), updated_at: row.updated_at });
    }

    if (path === "/tree" && request.method === "PUT") {
      const body = await request.json<{ tree: unknown }>();
      const data = JSON.stringify(body.tree);
      const now = new Date().toISOString();
      await env.META.prepare(
        "INSERT OR REPLACE INTO tree (id, data, updated_at) VALUES ('main', ?, ?)"
      ).bind(data, now).run();
      return Response.json({ ok: true, updated_at: now });
    }

    // --- Snapshot endpoints ---
    if (path.startsWith("/snapshot/") && request.method === "GET") {
      const docId = path.replace("/snapshot/", "");
      const obj = await env.SNAPSHOTS.get(`snap_${docId}`);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/snapshot/") && request.method === "PUT") {
      const docId = path.replace("/snapshot/", "");
      const data = await request.text();
      await env.SNAPSHOTS.put(`snap_${docId}`, data, {
        httpMetadata: { contentType: "application/json" },
      });
      return Response.json({ ok: true });
    }

    if (path.startsWith("/snapshot/") && request.method === "DELETE") {
      const docId = path.replace("/snapshot/", "");
      await env.SNAPSHOTS.delete(`snap_${docId}`);
      return Response.json({ ok: true });
    }

    // --- List all snapshot keys (for full sync) ---
    if (path === "/snapshots" && request.method === "GET") {
      const list = await env.SNAPSHOTS.list({ prefix: "snap_" });
      const keys = list.objects.map((o) => o.key.replace("snap_", ""));
      return Response.json({ keys });
    }

    return new Response("Not found", { status: 404 });
  },
};
