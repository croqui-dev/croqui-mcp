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

### Claude Code

```bash
claude mcp add --transport http croqui https://croqui.dev/mcp
```

Then run `/mcp`, choose **croqui** and pick Authenticate. A browser window opens for you to
authorize; approve it and go back to the terminal.

### Codex

```bash
codex mcp add croqui --url https://croqui.dev/mcp
codex mcp list
```

Authorization happens in the browser the first time a tool is called.

### Cursor, Grok, and any other MCP client

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
| `croqui_list_projects` | List the projects the caller can see |
| `croqui_create_project` | Create a project |
| `croqui_open` | Open a project and focus the canvas on it |
| `croqui_context` | Return the project brief, conventions and current state |
| `croqui_list_files` | List the screens, components and references in a project |
| `croqui_read_file` | Read one file |
| `croqui_write_file` | Create or overwrite a screen or component |
| `croqui_delete_file` | Delete a file |
| `croqui_search` | Search across the project's files |
| `croqui_ds_reference` | Return the design system reference the screens must compose |
| `croqui_read_annotations` | Read the human pins and notes on a frame |
| `croqui_resolve_annotation` | Close an annotation once it is addressed |
| `croqui_import_design` | Import an existing design into the project |

A well-behaved agent calls `croqui_context` and `croqui_ds_reference` before writing anything. That
is the difference between a screen that could belong to any company and a screen that belongs to
yours.

See [`examples/first-screen.md`](./examples/first-screen.md) for what a full session looks like.

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
