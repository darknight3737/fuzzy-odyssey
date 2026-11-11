import payload from "./payload.json" with { type: "json" };

const TARGET = "https://cnagsmkfjkxyxlefrkhu.supabase.co";
const TOKEN_SHA256 = "__TOKEN_SHA256__";
const EXPIRES_AT = "__EXPIRES_AT__";
const BATCH = 25;
const PAGE = 1000;

function newCounts() {
  return { categories: 0, locations: 0, businesses: 0, skipped_existing_id: 0, skipped_website: 0, business_categories: 0, business_locations: 0 };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function sha256Hex(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function emptyBody(request) {
  if (!request.body) return true;
  const reader = request.body.getReader();
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return total === 0;
    total += value.byteLength;
    if (total > 1024) { await reader.cancel(); return false; }
  }
}
function validatePayload() {
  const lists = ["categories", "locations", "businesses", "business_categories", "business_locations"];
  if (!payload || lists.some((key) => !Array.isArray(payload[key]))) throw new Error("invalid bundled payload");
  if (payload.businesses.length > 600) throw new Error("business limit exceeded");
  const ids = new Set();
  for (const business of payload.businesses) {
    if (!business || !/^[0-9a-f-]{36}$/i.test(business.id) || ids.has(business.id)) throw new Error("invalid business ids");
    if (business.account_id !== null || business.tier !== "unclaimed" || business.verification_status !== "pending" || business.domain_rating !== 0) throw new Error("business safety fields invalid");
    ids.add(business.id);
  }
  for (const key of ["categories", "locations"]) {
    const rowIds = new Set();
    const slugs = new Set();
    for (const row of payload[key]) {
      if (!row || !/^[0-9a-f-]{36}$/i.test(row.id) || !/^[a-z0-9-]+$/.test(row.slug) || rowIds.has(row.id) || slugs.has(row.slug)) throw new Error(`invalid ${key} id/slug pairs`);
      rowIds.add(row.id);
      slugs.add(row.slug);
    }
  }
  for (const [key, foreignKey] of [["business_categories", "category_id"], ["business_locations", "location_id"]]) {
    for (const link of payload[key]) {
      if (!link || !ids.has(link.business_id) || !link[foreignKey]) throw new Error(`invalid ${key} reference`);
    }
  }
}
function host(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function untouchedImport(existing, proposed) {
  if (existing.account_id !== null || existing.tier !== "unclaimed" || !existing.created_at || existing.created_at !== existing.updated_at) return false;
  return Object.keys(proposed).filter((key) => !["created_at", "updated_at"].includes(key)).every((key) =>
    JSON.stringify(canonical(existing[key])) === JSON.stringify(canonical(proposed[key])));
}
  let apiKey;
async function rest(method, path, body, prefer, range) {
  const headers = { apikey: apiKey, authorization: `Bearer ${apiKey}`, accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (prefer) headers.prefer = prefer;
  if (range) { headers.range = range; headers["range-unit"] = "items"; }
  const response = await fetch(`${TARGET}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    const text = await response.text();
    let detail = "";
    try {
      const error = JSON.parse(text);
      detail = [error.code, error.message].filter((value) => typeof value === "string").join(": ").slice(0, 240);
    } catch { /* keep status-only diagnostic */ }
    throw new Error(`REST ${method} failed (${response.status})${detail ? ` ${detail}` : ""}`);
  }
  if (response.status === 204) return [];
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}
async function readAll(table, select) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const page = await rest("GET", `${table}?select=${select}&order=id.asc&limit=${PAGE}&offset=${from}`);
    if (!Array.isArray(page)) throw new Error(`invalid ${table} response`);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}
async function insertBatches(table, rows, conflict, onInserted) {
  const inserted = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const result = await rest("POST", `${table}?on_conflict=${conflict}`, rows.slice(i, i + BATCH), "resolution=ignore-duplicates,return=representation");
    if (!Array.isArray(result)) throw new Error(`${table} insert response invalid`);
    inserted.push(...result);
    if (onInserted) onInserted(result);
  }
  return inserted;
}
async function run(progress, counts) {
  validatePayload();
  apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || Deno.env.get("SUPABASE_URL") !== TARGET) throw new Error("server configuration invalid");

  progress.stage = "preflight";
  const [oldBusinesses, oldCategories, oldLocations] = await Promise.all([
    readAll("businesses", "*"),
    readAll("categories", "id,slug"),
    readAll("locations", "id,slug"),
  ]);
  const categoryById = new Map(oldCategories.map((row) => [row.id, row.slug]));
  const categoryBySlug = new Map(oldCategories.map((row) => [row.slug, row.id]));
  const locationById = new Map(oldLocations.map((row) => [row.id, row.slug]));
  const locationBySlug = new Map(oldLocations.map((row) => [row.slug, row.id]));
  for (const [rows, byId, bySlug, label] of [[payload.categories, categoryById, categoryBySlug, "category"], [payload.locations, locationById, locationBySlug, "location"]]) {
    for (const row of rows) {
      if ((byId.has(row.id) && byId.get(row.id) !== row.slug) || (bySlug.has(row.slug) && bySlug.get(row.slug) !== row.id)) throw new Error(`${label} id/slug conflict`);
    }
  }

  progress.stage = "categories";
  const newCategories = payload.categories.filter((row) => !categoryBySlug.has(row.slug));
  await insertBatches("categories", newCategories, "slug", (rows) => { counts.categories += rows.length; });
  const categories = await readAll("categories", "id,slug");
  const finalCategoryIds = new Map(categories.map((row) => [row.slug, row.id]));
  for (const row of payload.categories) if (finalCategoryIds.get(row.slug) !== row.id) throw new Error("category resolution conflict");
  progress.stage = "locations";
  const newLocations = payload.locations.filter((row) => !locationBySlug.has(row.slug));
  await insertBatches("locations", newLocations, "slug", (rows) => { counts.locations += rows.length; });
  const locations = await readAll("locations", "id,slug");
  const finalLocationIds = new Map(locations.map((row) => [row.slug, row.id]));
  for (const row of payload.locations) if (finalLocationIds.get(row.slug) !== row.id) throw new Error("location resolution conflict");
  const categoryIds = new Set(finalCategoryIds.values());
  const locationIds = new Set(finalLocationIds.values());
  for (const link of payload.business_categories) if (!categoryIds.has(link.category_id)) throw new Error("business category reference missing");
  for (const link of payload.business_locations) if (!locationIds.has(link.location_id)) throw new Error("business location reference missing");
  progress.stage = "business preflight";
  const oldIds = new Set(oldBusinesses.map((row) => row.id));
  const oldById = new Map(oldBusinesses.map((row) => [row.id, row]));
  const oldHosts = new Set(oldBusinesses.map((row) => host(row.website)).filter(Boolean));
  const candidates = [];
  const resumableIds = new Set();
  for (const business of payload.businesses) {
    if (oldIds.has(business.id)) {
      counts.skipped_existing_id++;
      if (untouchedImport(oldById.get(business.id), business)) resumableIds.add(business.id);
    }
    else if (host(business.website) && oldHosts.has(host(business.website))) counts.skipped_website++;
    else candidates.push(business);
  }
  progress.stage = "businesses";
  const insertedIds = new Set();
  for (let i = 0; i < candidates.length; i += BATCH) {
    const inserted = await rest(
      "POST",
      "businesses?on_conflict=id",
      candidates.slice(i, i + BATCH),
      "resolution=ignore-duplicates,return=representation",
    );
    if (!Array.isArray(inserted) || inserted.some((row) => !row.id)) throw new Error("business insert response invalid");
    counts.businesses += inserted.length;
    for (const row of inserted) insertedIds.add(row.id);
  }
  const [oldCategoryLinks, oldLocationLinks] = await Promise.all([
    readAll("business_categories", "business_id,category_id"),
    readAll("business_locations", "business_id,location_id"),
  ]);
  const categoryKeys = new Set(oldCategoryLinks.map((row) => `${row.business_id}:${row.category_id}`));
  const locationKeys = new Set(oldLocationLinks.map((row) => `${row.business_id}:${row.location_id}`));
  const eligible = new Set([...insertedIds, ...resumableIds]);
  const categoryLinks = payload.business_categories.filter((row) => eligible.has(row.business_id) && !categoryKeys.has(`${row.business_id}:${row.category_id}`));
  const locationLinks = payload.business_locations.filter((row) => eligible.has(row.business_id) && !locationKeys.has(`${row.business_id}:${row.location_id}`));
  progress.stage = "business_categories";
  await insertBatches("business_categories", categoryLinks, "business_id,category_id", (rows) => { counts.business_categories += rows.length; });
  progress.stage = "business_locations";
  await insertBatches("business_locations", locationLinks, "business_id,location_id", (rows) => { counts.business_locations += rows.length; });
  return { ok: true, complete: true, counts };
}
Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ ok: false, error: "POST required" }, 405);
  if (TOKEN_SHA256 === "__TOKEN_SHA256__" || EXPIRES_AT === "__EXPIRES_AT__") return json({ ok: false, error: "authorization unavailable" }, 503);
  const expiry = Date.parse(EXPIRES_AT);
  if (!Number.isFinite(expiry) || Date.now() >= expiry) return json({ ok: false, error: "import authorization expired" }, 403);
  const supplied = request.headers.get("x-import-token") || "";
  if (!equal(await sha256Hex(supplied), TOKEN_SHA256)) return json({ ok: false, error: "unauthorized" }, 401);
  try {
    if (!(await emptyBody(request))) return json({ ok: false, error: "request body must be empty" }, 400);
  } catch {
    return json({ ok: false, error: "invalid request body" }, 400);
  }
  const progress = { stage: "configuration" };
  const counts = newCounts();
  try {
    const result = await run(progress, counts);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "import failed";
    return json({ ok: false, complete: false, stage: progress.stage, error: message, counts }, 500);
  }
});
