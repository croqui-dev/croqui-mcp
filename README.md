# Croqui.dev MCP server

> Croqui.dev is a collaborative design canvas where AI agents write real React screens over MCP,
> humans annotate and approve, and the approved screen ships to production exactly as drawn.

Every frame on the canvas is a `.tsx` file that reuses the project's own design system, so the
screen your team approves is the screen engineering receives. There is no redraw step between design
and code. Humans pin annotations on a frame; agents read those annotations as MCP tools and resolve
them.

Croqui.dev ships no model of its own. You connect the agent you already run.

- Website: <https://croqui.dev>
- Docs: <https://croqui.dev/docs>
- MCP endpoint: `https://croqui.dev/mcp` (streamable-http, OAuth on first call)
- Registry name: `dev.croqui/croqui`

## Connect

### Claude Code: plugin (MCP server + skills)

```bash
claude plugin marketplace add croqui-dev/croqui-mcp
claude plugin install croqui@croqui
```

The plugin registers the MCP server and installs the [skills](#skills) that teach the agent how to
work on the canvas. Then run `/mcp`, choose **croqui** and pick Authenticate. A browser window opens
for you to authorize; approve it and go back to the terminal.

### Claude Code: MCP server only

```bash
claude mcp add --transport http croqui https://croqui.dev/mcp
```

Authenticate the same way through `/mcp`.

### Codex

```bash
codex mcp add croqui --url https://croqui.dev/mcp
codex mcp list
```

Authorization happens in the browser the first time a tool is called.

### Cursor

This repository is also a Cursor plugin (`.cursor-plugin/`) with the same MCP server and skills.
To add only the server, use the JSON below.

### Grok and any other MCP client

```json
{
  "mcpServers": {
    "croqui": {
      "url": "https://croqui.dev/mcp"
    }
  }
}
```

### Give the agent a role

```bash
claude mcp add --transport http croqui "https://croqui.dev/mcp?as=Designer"
```

The role becomes the agent's label and colour next to the presence cursors, so a team running
several agents can tell the copywriter from the designer at a glance.

## What the agent gets

| Tool | What it does |
| --- | --- |
| `croqui_status` | Who the agent is signed in as, its teams, plans and write permissions |
| `croqui_open` | Viewer URL, MCP endpoint and the projects this account can see |
| `croqui_list_projects` | List the projects the caller can see |
| `croqui_create_project` | Create a project in one of the caller's teams |
| `croqui_context` | Screens, components (shared or exclusive), references, open annotations, review stage |
| `croqui_ds_reference` | Screen format, build contract and the project's design system components |
| `croqui_list_files` | List the screens, components and references in a project |
| `croqui_search` | Search across the project's files |
| `croqui_read_file` | Read one file |
| `croqui_write_file` | Create or rewrite a screen or component; returns the compile result |
| `croqui_edit_file` | Replace one snippet in a file; returns the compile result |
| `croqui_history` | Revision history of a file |
| `croqui_events` | Project event log |
| `croqui_inspect_screen` | A screen's structure as text: hierarchy, classes and copy |
| `croqui_screenshot` | Render a screen on the server and return the image |
| `croqui_delete_file` | Delete a file |
| `croqui_read_annotations` | Read the human pins and notes, with attached references |
| `croqui_resolve_annotation` | Mark an annotation in progress or done, with a reply |
| `croqui_mark_for_edit` | Pin a note on a screen for a human to review |
| `croqui_import_design` | The protocol for importing an existing design |

A well-behaved agent calls `croqui_context` and `croqui_ds_reference` before writing anything. That
is the difference between a screen that could belong to any company and a screen that belongs to
yours.

See [`examples/first-screen.md`](./examples/first-screen.md) for what a full session looks like.

## Skills

The plugin ships four skills. They follow the [Agent Skills](https://agentskills.io) format, so any
client that reads `SKILL.md` folders can use them: copy `skills/<name>` into its skills directory.

| Skill | Use it to |
| --- | --- |
| [`croqui-canvas`](./skills/croqui-canvas/SKILL.md) | Build and edit screens: read context and design system, then write in passes the team watches live |
| [`croqui-notes`](./skills/croqui-notes/SKILL.md) | Resolve the open annotations on a project, each with a reply on the note |
| [`croqui-import`](./skills/croqui-import/SKILL.md) | Bring screenshots or an existing app into a project as faithful React screens |
| [`croqui-sync`](./skills/croqui-sync/SKILL.md) | Check a sync job's design screens against production code and report with evidence |

### The build contract, in short

Screens are built the way a person watching the canvas can follow and a developer can ship:

- **Layout in flow** (flex/grid), never coordinates placed element by element.
- **Components first**: the design system, then the project's `components/`, then something new.
  Anything that repeats, even inside one screen, is a component.
- **In passes**: a skeleton, then one region per edit, so the screen grows on the canvas.
- **Interactive**: real buttons and links with hover and focus, working tabs and toggles.
- **Wired for Present** with `data-croqui-goto`, `data-croqui-open`, `data-croqui-close` and
  `data-croqui-back`, so a click-through of the flow works in presentation mode.
- **Verified** with `croqui_screenshot` before the agent reports.

The full text lives in [`skills/croqui-canvas`](./skills/croqui-canvas/SKILL.md) and is served by
`croqui_ds_reference`.

## Concepts

- **Project** holds screens, components and references, and has its own design system.
- **Screen** is one frame on the canvas: a `.tsx` file with a viewport.
- **Component** is a reusable piece the screens compose, published from the project's design system.
- **Annotation** is a human pin on a frame. Agents read them as tools and resolve them.
- **Bundle** is what an approved screen becomes when it is delivered to whoever implements it.

Full explanations at <https://croqui.dev/docs>.

## Unlimited calls

MCP calls are unlimited on every plan, including the free one. There is no per-call quota. Plans
change seats, projects, screens and team features, not how much your agent is allowed to work.

## About this repository

Connection docs, the tool surface and examples for the hosted Croqui.dev MCP server. The server
itself is hosted and closed source; there is nothing to install or self-host. `server.json` is the
entry published to the official MCP registry.

Issues about connecting an agent are welcome here.

## About the name

"Croqui" is the Portuguese and French word for a quick freehand sketch, the kind used in fashion and
architecture. This project is **Croqui.dev**, the design canvas at <https://croqui.dev>, not a
sketching tool.
