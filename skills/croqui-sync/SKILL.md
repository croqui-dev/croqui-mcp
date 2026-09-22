---
name: croqui-sync
description: Process a Croqui.dev sync job — check whether each design screen in the job exists in the production codebase and report item by item to the job's webhook, with file and line evidence. Use when invoked with a Croqui.dev sync job file, or when the user asks to sync, verify or compare Croqui.dev screens against production code.
---

# Croqui.dev sync

A route on a Croqui.dev project sends a job when an admin asks "what of this design is live?". Your
receiver (a GitHub Action, a small webhook listener, anything) saves the job to a JSON file and starts
this skill with its path. You compare each screen's manifest with the production code and report
back. Croqui.dev computes the status; you supply evidence.

Argument: path to the job file.

## Never

- Print, log or echo the `webhook_token`, API keys or tokens from any config.
- Change production code, commit or open a pull request. This is observation only.
- Send `status: "synced"` or `"diverged"`. The server computes it from your items.

## Inputs

The job file is the route's envelope plus the token:

- `job_id`, `project_id`, `webhook_url`, `screens[]` with `path`, `name`, `rev`, `sha256`, `read_url`,
  `frame_url`, `manifest`, `handoff` (the screen's TSX, its components, tokens, `croqui.json` and
  `PROMPT.md` inline; `files: null` with `omitted: "size"` when it didn't fit);
- `webhook_token` — the route's Bearer token. If the file does not carry it, read it from the
  `CROQUI_WEBHOOK_TOKEN` environment variable. Neither present: stop and say where to put it (the
  project's Routes dialog shows it).

Design source for a screen: `handoff.files` in the envelope; when it is null,
`croqui_read_file { project: project_id, path }` over the Croqui.dev MCP.
The manifest in the envelope is what you check against; the TSX helps you understand it.

## Production repository

Find it before reporting anything. First match wins:

1. `repo_dir` in the job file (the receiver writes it);
2. the `CROQUI_REPO_DIR` environment variable, with `<repo>` replaced by `project_id` without the
   `product:` prefix (`CROQUI_REPO_DIR=~/code/<repo>` and `product:billing` → `~/code/billing`);
3. the current directory.

A candidate counts only if it exists and `git -C <dir> rev-parse --show-toplevel` succeeds; use that
top-level path. Every search, `line` and `commit` below comes from it.

None qualifies: for each screen, send the final body with every manifest item `missing` and
`note: "production repository not found"`, say which paths you tried, and stop. Never search an
unrelated repository just because it is the current directory.

## Per screen

1. POST `{ "job_id", "screen", "status": "in_progress" }` to `webhook_url`.
2. For every manifest item (`key`, `role`, `text`, `path`, grouped by frame export), search the
   repository: the visible text, component names, the route that serves the screen. Assign a state:
   - `done` — exists as designed. Requires `evidence: { file, line, snippet }`, and the snippet must
     contain the item's `text` (compared trimmed, whitespace collapsed, lowercase, accents removed).
   - `changed` — exists but differs. Requires `evidence` and a `note` saying how.
   - `missing` — not there. Requires a `note`.
   - `partial` — half there, or not enough evidence for `done`.
   - Items keyed `frame:<export>` ask whether that drawer/modal/sheet exists in production.
3. What production has and the design does not goes in `extra: [{ key, note? }]`. It never affects the
   status.
4. POST the final body (below) to `webhook_url`.
   - `409 design_sha_mismatch` → the design changed since the job was sent: re-read the screen, check
     `design_sha256`, redo the items, resend.
   - `422` with unknown keys → remove them from `items` (move them to `extra` if they are real).

Every manifest item you do not report is recorded as `missing` ("not reported"), so cover them all.
`done`/`changed` without a usable snippet are downgraded to `partial` by the server.

## Final body

```json
{
  "job_id": "…",
  "screen": "screens/billing/plans.tsx",
  "design_sha256": "<screens[].sha256 from the job>",
  "items": [
    {
      "key": "button:upgrade",
      "state": "done",
      "evidence": { "file": "apps/web/app/billing/page.tsx", "line": 42, "snippet": "<Button>Upgrade</Button>" }
    },
    { "key": "column:invoice total", "state": "missing", "note": "the invoices table has no total column" }
  ],
  "extra": [{ "key": "button:download pdf", "note": "in production, not in the design" }],
  "report": "Plans match. The invoices table is missing the total column.",
  "prod_url": "https://app.example.com/billing",
  "commit": "<git -C <repo> rev-parse --short HEAD>"
}
```

## Sending

Keep the token out of the command line and the transcript: export it from the job file into the
environment inside the same command, and send bodies from a file.

```bash
WEBHOOK_URL=$(jq -r .webhook_url "$JOB")
WEBHOOK_TOKEN=${CROQUI_WEBHOOK_TOKEN:-$(jq -r '.webhook_token // empty' "$JOB")} \
  sh -c 'curl -sS -X POST -H "Authorization: Bearer $WEBHOOK_TOKEN" -H "Content-Type: application/json" \
    -d @result.json "$0"' "$WEBHOOK_URL"
```

## Finish

One short summary per screen: coverage (`done` / total) and what is `missing` or `changed`.
