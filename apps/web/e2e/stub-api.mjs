/**
 * A tiny in-memory stand-in for the Spring Boot API, implementing the same HTTP contract (auth, catalog-free
 * learning endpoints, password reset, the Origin + X-AlgoVision-Client check, refresh-token rotation with reuse
 * detection). It lets the web app be exercised end to end where the real API cannot run (no Maven or Docker).
 * It is NOT the real backend and proves nothing about it.
 *
 *   node e2e/stub-api.mjs [port]      (default 8099)
 * Build the web app with API_INTERNAL_URL=http://127.0.0.1:8099 so /api/* is proxied here.
 * Reset links are printed to the console, like the real console mailer.
 */
import { createServer } from "node:http";
import { randomBytes, randomUUID, createHash } from "node:crypto";

const port = Number(process.argv[2] ?? 8099);
const ALLOWED = new Set(["http://localhost:3100", "http://127.0.0.1:3100"]);
const SLUGS = new Set(["linked-list-insert-head", "linear-search", "binary-search", "bubble-sort", "stack-push-pop", "queue-enqueue-dequeue", "binary-tree-inorder", "selection-sort", "insertion-sort", "linked-list-insert-tail"]);
const users = new Map(); // email -> user
const refresh = new Map(); // hash -> {userId, family, rotated, revoked}
const resets = new Map(); // hash -> {userId, used, expires}
const access = new Map(); // token -> {userId, exp}
const progress = new Map(); // userId -> Map(slug -> entry)
const bookmarks = new Map(); // userId -> Set(slug)
const GRACE_MS = 10_000; // mirrors auth.refresh-grace in the real API
const sha = (s) => createHash("sha256").update(s).digest("hex");
export const log = [];

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": status >= 400 ? "application/problem+json" : "application/json", "Cache-Control": "no-store", ...headers });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};
const problem = (res, status, code, detail, extra = {}, headers = {}) => send(res, status, { status, code, detail, ...extra }, headers);
const cookie = (value, maxAge) => `av_refresh=${value}; HttpOnly; SameSite=Lax; Path=/api/v1/auth; Max-Age=${maxAge}`;

function issue(res, status, user, family = randomUUID()) {
  const raw = randomBytes(32).toString("base64url");
  refresh.set(sha(raw), { userId: user.id, family, rotated: false, revoked: false });
  const token = "av1." + randomBytes(24).toString("base64url");
  const exp = Date.now() + (Number(process.env.STUB_ACCESS_MS) || 15 * 60_000);
  access.set(token, { userId: user.id, exp });
  send(res, status, { user: view(user), accessToken: token, accessTokenExpiresAt: new Date(exp).toISOString() }, { "Set-Cookie": cookie(raw, 14 * 86400) });
}
const view = (u) => ({ id: u.id, email: u.email, fullName: u.fullName, roles: ["ROLE_STUDENT"] });
const readCookie = (req) => /(?:^|;\s*)av_refresh=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
const authed = (req) => {
  const m = /^Bearer (.+)$/i.exec(req.headers.authorization ?? "");
  const a = m && access.get(m[1]);
  return a && a.exp > Date.now() ? [...users.values()].find((u) => u.id === a.userId) : null;
};
function passwordError(pw, email) {
  if (typeof pw !== "string" || pw.length < 10) return "Use at least 10 characters.";
  const local = email.split("@")[0];
  if (local.length >= 4 && pw.toLowerCase().includes(local)) return "Your password should not contain your email name.";
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const path = url.pathname;
  let body = {};
  if (req.method !== "GET") {
    const origin = req.headers.origin;
    if (!origin || !ALLOWED.has(origin) || req.headers["x-algovision-client"] !== "web") {
      return problem(res, 403, "ORIGIN_NOT_ALLOWED", "This request did not come from an allowed origin.");
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try { body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}; } catch { return problem(res, 400, "BAD_JSON", "Malformed JSON."); }
  }
  if (path === "/__stub/log") return send(res, 200, { log });
  if (path === "/api/v1/health") return send(res, 200, { status: "UP", service: "stub-api" });

  if (path === "/api/v1/auth/register" && req.method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const errors = [];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push({ field: "email", message: "Enter a valid email address." });
    const pe = passwordError(body.password, email);
    if (pe) errors.push({ field: "password", message: pe });
    if (!String(body.fullName ?? "").trim()) errors.push({ field: "fullName", message: "Enter your name." });
    if (errors.length) return problem(res, 400, "INVALID_INPUT", "Please fix the highlighted fields.", { errors });
    if (users.has(email)) return problem(res, 409, "EMAIL_TAKEN", "An account with this email already exists.");
    const user = { id: randomUUID(), email, fullName: body.fullName.trim(), password: body.password };
    users.set(email, user);
    return issue(res, 201, user);
  }
  if (path === "/api/v1/auth/login" && req.method === "POST") {
    const user = users.get(String(body.email ?? "").trim().toLowerCase());
    if (!user || user.password !== body.password) return problem(res, 401, "INVALID_CREDENTIALS", "The email or password is not correct.");
    return issue(res, 200, user);
  }
  if (path === "/api/v1/auth/refresh" && req.method === "POST") {
    const raw = readCookie(req);
    const rec = raw && refresh.get(sha(raw));
    if (!rec || rec.revoked) return problem(res, 401, "TOKEN_INVALID", "The session is not valid. Please sign in again.", {}, { "Set-Cookie": cookie("", 0) });
    if (rec.rotated && Date.now() - rec.rotated < GRACE_MS) {
      return issue(res, 200, [...users.values()].find((u) => u.id === rec.userId), rec.family);
    }
    if (rec.rotated) {
      for (const r of refresh.values()) if (r.family === rec.family) r.revoked = true;
      log.push("REUSE DETECTED");
      return problem(res, 401, "TOKEN_REUSED", "The session is not valid. Please sign in again.", {}, { "Set-Cookie": cookie("", 0) });
    }
    rec.rotated = Date.now();
    return issue(res, 200, [...users.values()].find((u) => u.id === rec.userId), rec.family);
  }
  if (path === "/api/v1/auth/logout" && req.method === "POST") {
    const raw = readCookie(req);
    const rec = raw && refresh.get(sha(raw));
    if (rec) for (const r of refresh.values()) if (r.family === rec.family) r.revoked = true;
    return send(res, 204, undefined, { "Set-Cookie": cookie("", 0) });
  }
  if (path === "/api/v1/auth/forgot-password" && req.method === "POST") {
    const user = users.get(String(body.email ?? "").trim().toLowerCase());
    if (user) {
      const raw = randomBytes(32).toString("base64url");
      resets.set(sha(raw), { userId: user.id, used: false, expires: Date.now() + 30 * 60_000 });
      console.log(`[console mailer] reset link for ${user.email}: http://localhost:3100/reset-password?token=${raw}`);
    }
    return send(res, 202, { message: "If an account exists for that email, a reset link has been sent." });
  }
  if (path === "/api/v1/auth/reset-password" && req.method === "POST") {
    const rec = resets.get(sha(String(body.token ?? "")));
    if (!rec || rec.used || rec.expires < Date.now()) return problem(res, 400, "RESET_TOKEN_INVALID", "This reset link is invalid or has expired. Request a new one.");
    const user = [...users.values()].find((u) => u.id === rec.userId);
    const pe = passwordError(body.password, user.email);
    if (pe) return problem(res, 400, "INVALID_INPUT", "Please fix the highlighted fields.", { errors: [{ field: "password", message: pe }] });
    rec.used = true;
    user.password = body.password;
    for (const r of refresh.values()) if (r.userId === user.id) r.revoked = true;
    return send(res, 204, undefined, { "Set-Cookie": cookie("", 0) });
  }

  const user = authed(req);
  if (path.startsWith("/api/v1/me/") || /^\/api\/v1\/algorithms\/[^/]+\/(view|complete)$/.test(path) || path === "/api/v1/auth/me") {
    if (!user) return problem(res, 401, "TOKEN_INVALID", "Sign in to continue.");
    const mine = progress.get(user.id) ?? progress.set(user.id, new Map()).get(user.id);
    const marks = bookmarks.get(user.id) ?? bookmarks.set(user.id, new Set()).get(user.id);
    if (path === "/api/v1/auth/me") return send(res, 200, view(user));
    if (path === "/api/v1/me/progress") return send(res, 200, { progress: [...mine.values()] });
    if (path === "/api/v1/me/bookmarks" && req.method === "GET") return send(res, 200, { bookmarks: [...marks].map((s) => ({ algorithmSlug: s, name: s, createdAt: new Date().toISOString() })) });
    let m = /^\/api\/v1\/me\/bookmarks\/([^/]+)$/.exec(path);
    if (m) {
      if (!SLUGS.has(m[1])) return problem(res, 404, "ALGORITHM_NOT_FOUND", "That algorithm does not exist.");
      if (req.method === "PUT") marks.add(m[1]);
      else if (req.method === "DELETE") marks.delete(m[1]);
      return send(res, 204);
    }
    m = /^\/api\/v1\/algorithms\/([^/]+)\/(view|complete)$/.exec(path);
    if (m) {
      if (!SLUGS.has(m[1])) return problem(res, 404, "ALGORITHM_NOT_FOUND", "That algorithm does not exist.");
      const now = new Date().toISOString();
      const old = mine.get(m[1]);
      const e = old ?? { algorithmSlug: m[1], status: "IN_PROGRESS", lastLanguage: null, firstViewedAt: now, lastViewedAt: now, completedAt: null };
      e.lastViewedAt = now;
      if (body.language) e.lastLanguage = body.language;
      if (m[2] === "complete") { e.status = "COMPLETED"; e.completedAt ??= now; }
      mine.set(m[1], e);
      return send(res, 204);
    }
  }
  return problem(res, 404, "NOT_FOUND", "No such endpoint.");
}).listen(port, "127.0.0.1", () => console.log(`stub api on http://127.0.0.1:${port}`));
