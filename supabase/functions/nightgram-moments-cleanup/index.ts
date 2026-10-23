import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Allow": "POST" },
    });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server configuration is incomplete" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: expectedSecret, error: secretError } = await admin.rpc("get_nightgram_moments_cleanup_secret");
  const suppliedSecret = req.headers.get("x-cleanup-secret") || "";
  if (secretError || typeof expectedSecret !== "string" || suppliedSecret.length < 32 || suppliedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cutoff = new Date().toISOString();
  const { data: expired, error: selectError } = await admin
    .from("nightgram_moments")
    .select("id,storage_path")
    .lte("expires_at", cutoff)
    .order("expires_at", { ascending: true })
    .limit(100);

  if (selectError) {
    return new Response(JSON.stringify({ error: "Could not find expired Moments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!expired?.length) {
    return new Response(JSON.stringify({ success: true, removed: 0, message: "No expired Moments to clean up." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const paths = expired.map((row) => row.storage_path);
  const { error: storageError } = await admin.storage.from("nightgram-moments").remove(paths);
  if (storageError) {
    return new Response(JSON.stringify({ error: "Expired media cleanup failed", count: expired.length }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ids = expired.map((row) => row.id);
  const { error: deleteError } = await admin.from("nightgram_moments").delete().in("id", ids);
  if (deleteError) {
    return new Response(JSON.stringify({ error: "Media was removed but expired Moment records could not be deleted", count: expired.length }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, removed: expired.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
