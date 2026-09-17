#!/usr/bin/env node
// Croqui Design Live (beta): a Claude Code channel.
//
// Claude Code spawns this over stdio. It declares the `claude/channel` capability and listens on
// 127.0.0.1 so the croqui.dev tab (already signed in) can hand it the marks a human just made. Each
// POST becomes one `notifications/claude/channel` event; the agent reads the marks through the normal
// croqui MCP. No token, no server round trip, no polling: an idle session spends nothing.
//
// Zero dependencies on purpose: plugins are not npm-installed. JSON-RPC over stdio is newline-delimited.
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";

const VERSION = "0.3.0";
const PORTS = [47823, 47824, 47825, 47826, 47827];
const ALLOWED_ORIGINS = new Set(
  ["https://croqui.dev", "https://www.croqui.dev", ...(process.env.CROQUI_LIVE_ORIGINS ?? "").split(",")]
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const MAX_BODY = 64 * 1024;

const INSTRUCTIONS = [
  'Croqui Design Live events arrive as <channel source="croqui-live" project="..." marks="..." screen="...">.',
  "Each one means a human just pinned notes on the Croqui.dev canvas and wants them applied now.",
  "Handle them exactly like /croqui:croqui-notes with those note numbers: croqui_read_annotations, mark each one doing, edit, resolve done with a short reply.",
  "Do not ask for confirmation. Keep the turn short: only the marks listed in the event.",
].join(" ");

let initialized = false;
let port = null;

// ---- stdio JSON-RPC ----

function send(message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);
}

function reply(id, result) {
  send({ id, result });
}

function handle(message) {
  if (message === null || typeof message !== "object") {
    return;
  }
  const { id, method, params } = message;
  if (method === "initialize") {
    reply(id, {
      protocolVersion: typeof params?.protocolVersion === "string" ? params.protocolVersion : "2025-06-18",
      capabilities: { experimental: { "claude/channel": {} }, tools: {} },
      serverInfo: { name: "croqui-live", version: VERSION },
      instructions: INSTRUCTIONS,
    });
    return;
  }
  if (method === "notifications/initialized") {
    initialized = true;
    return;
  }
  if (method === "tools/list") {
    reply(id, { tools: [] });
    return;
  }
  if (method === "ping") {
    reply(id, {});
    return;
  }
  if (id !== undefined && method !== undefined) {
    send({ id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let newline = buffer.indexOf("\n");
  while (newline !== -1) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line.length > 0) {
      try {
        handle(JSON.parse(line));
      } catch {
        // Not JSON: ignore, stdout must stay protocol-only.
      }
    }
    newline = buffer.indexOf("\n");
  }
});
process.stdin.on("end", () => process.exit(0));

// ---- local HTTP, croqui.dev only ----

function cors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Chrome Private Network Access: a public https page reaching 127.0.0.1.
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const clean = (value, max) => String(value ?? "").replace(/[\r\n"<>]/g, " ").slice(0, max);

const server = createServer((req, res) => {
  const origin = req.headers.origin;
  // Browsers always send Origin on cross-origin fetch, and a page cannot forge it.
  if (typeof origin !== "string" || !ALLOWED_ORIGINS.has(origin)) {
    json(res, 403, { error: "origin not allowed" });
    return;
  }
  cors(res, origin);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true, name: "croqui-live", version: VERSION, ready: initialized, port, cwd: process.cwd() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/marks") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        req.destroy();
      }
    });
    req.on("end", () => {
      let input;
      try {
        input = JSON.parse(body);
      } catch {
        json(res, 400, { error: "invalid json" });
        return;
      }
      const project = clean(input?.project, 120);
      const marks = Array.isArray(input?.marks) ? input.marks.slice(0, 50) : [];
      if (project.length === 0 || marks.length === 0) {
        json(res, 400, { error: "project and marks are required" });
        return;
      }
      if (!initialized) {
        json(res, 503, { error: "claude session not ready" });
        return;
      }
      const numbers = marks.map((mark) => Number(mark?.number)).filter(Number.isFinite);
      const screens = [...new Set(marks.map((mark) => clean(mark?.path, 200)).filter(Boolean))];
      const lines = marks.map((mark) => `#${clean(mark?.number, 8)} · ${clean(mark?.path, 200)} · ${clean(mark?.note, 300)}`);
      send({
        method: "notifications/claude/channel",
        params: {
          content: `New notes on Croqui.dev (${project}):\n${lines.join("\n")}`,
          meta: { project, marks: numbers.join(" "), screen: screens.join(" ") },
        },
      });
      json(res, 200, { ok: true, delivered: numbers.length });
    });
    return;
  }
  json(res, 404, { error: "not found" });
});

// Without --channels / --dangerously-load-development-channels, Claude Code drops channel events
// silently. Only a session started with the flag takes a port, so the tab never talks to a deaf one.
function channelFlagOnParent() {
  if (process.env.CROQUI_LIVE_FORCE === "1") {
    return true;
  }
  try {
    const args = execFileSync("ps", ["-o", "args=", "-p", String(process.ppid)], { encoding: "utf8", timeout: 2000 });
    return /--(dangerously-load-development-)?channels\b/.test(args) && args.includes("croqui");
  } catch {
    return false;
  }
}

function listen(index) {
  if (index >= PORTS.length) {
    process.stderr.write("croqui-live: no free port in 47823-47827; Design Live is off for this session\n");
    return;
  }
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      listen(index + 1);
      return;
    }
    process.stderr.write(`croqui-live: ${error.message}\n`);
  });
  server.listen(PORTS[index], "127.0.0.1", () => {
    port = PORTS[index];
    process.stderr.write(`croqui-live: listening on 127.0.0.1:${port}\n`);
  });
}

if (channelFlagOnParent()) {
  listen(0);
}
