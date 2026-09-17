---
name: croqui-notes
description: Work through the open annotations on a Croqui.dev project — the notes and pins humans left on the canvas — resolving each one end to end, with a reply on the note. Use when the user asks to handle, fix, resolve or go through the notes, comments, pins or feedback on Croqui.dev. Optional argument, note numbers (e.g. "3" or "1 4"); none means every open note.
---

# Croqui.dev notes

Humans pin notes on frames; you resolve them. Everything in the `croqui-canvas` skill applies (build
contract, screen format, scope rules). Read that skill first if it is not already in context.

Argument: note numbers to handle (`3`, `1 4`). No argument: every open note (`todo` and `doing`).

## Flow

1. **Project.** Resolve it like `croqui-canvas` §1. Then `croqui_context { project }` and keep
   `shared` / `usedBy` and each screen's review stage at hand.
2. **Read.** `croqui_read_annotations { project }`. No open notes: reply "No open notes." and stop.
   Notes that attach images list them in `refs[]`: open each with `croqui_read_file { project, path }`
   before working on that note. A note about an image resolved without looking at it is answered blind.
3. **List** the notes you will handle, one line each: `#id · screen · what it asks`. Do not ask for
   confirmation here; start.
4. **For each note, in ascending id order:**
   1. `croqui_resolve_annotation { project, id, status: "doing" }` before touching any file. The
      viewer shows the note as in progress.
   2. Read only what the note touches: the target file (`target` is `path:line:col`) and the component
      that renders the marked node.
   3. Decide the scope from the note's wording:
      - About an element on this screen → change this screen, or a local override through a prop.
      - About a component or a rule ("always", "everywhere", "no longer") → a global decision. If the
        component is `shared`, add an optional prop whose default keeps today's behaviour, use it on
        the marked screen, and say in the reply which screens use it (`usedBy`) and offer to flip the
        default. Never change a shared component silently.
      - Ambiguous, or needs a product decision → implement the most likely reading and state the
        assumption in the reply.
   4. If the screen is `approved`, `delivering` or `live`, the edit sends it back to review. Do it
      only if the note clearly asks for the change, and say so in the reply.
   5. Edit with `croqui_edit_file` (one snippet per call) or `croqui_write_file` (rewrite). `compile.ok`
      before moving on.
   6. Check only what needs pixels: copy, props and small style edits are verified by `compile.ok`.
      When the note changed layout, take one `croqui_screenshot { project, path }` of the marked
      screen; when several notes touch the same screen, take it once after the last of them. Never
      render screens locally; if the screenshot is unavailable, say so in the reply.
   7. `croqui_resolve_annotation { project, id, status: "done", reply }`. The reply is 2–4 sentences:
      what changed, which files, assumptions, anything left for a human decision.
5. **Finish** with a short table for the user: `note · what changed · open question`. No narration of
   the process.

## Rules

- One note at a time. Do not mix edits for two notes in one file unless both are `doing`.
- A note that needs a decision only the user can make, with no safe conservative version: leave it in
  `doing`, set a reply with the question (`status: "doing"`, `reply`), and move to the next note. One
  blocked note never blocks the batch.
- Never replicate a change to other screens unless the note says so ("on every screen", "in the design
  system", "always").
- If `croqui_edit_file` fails because `old` repeats, widen the snippet; do not fall back to rewriting a
  large file.
