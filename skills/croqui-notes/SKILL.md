---
name: croqui-notes
description: Work through the open annotations on a Croqui.dev project — the notes and pins humans left on the canvas — resolving each one end to end, with a reply on the note. Use when the user asks to handle, fix, resolve or go through the notes, comments, pins or feedback on Croqui.dev. Optional argument, note numbers (e.g. "3" or "1 4"); none means every open note.
---

# Croqui.dev notes

Humans pin notes on frames; you resolve them, end to end, with a reply on each note. Everything in the
`croqui-canvas` prompt applies — build contract, design bar, screen format, scope. Read it first if it
is not already in context.

Argument: note numbers to handle (`3`, `1 4`). No argument: every open note (`todo` and `doing`).

## Flow

1. **Project.** Resolve it, then `croqui_context { project }`; keep `shared` / `usedBy` and each
   screen's review stage at hand.
2. **Read.** `croqui_read_annotations { project }`. No open notes: say so and stop. Notes that attach
   images list them in `refs[]`: open each with `croqui_read_file` before working on that note — a
   note about an image answered without looking at it is answered blind.
3. **List** the notes you will handle, one line each: `#id · screen · what it asks`. Do not ask for
   confirmation; start.
4. **For each note, ascending id:**
   1. `croqui_resolve_annotation { project, id, status: "doing" }` before touching a file, so the
      viewer shows it in progress.
   2. Read only what the note touches: the target file (`target` is `path:line:col`) and the
      component that renders the marked node.
   3. Scope from the wording: an element on this screen → change this screen or add a local override;
      a rule ("always", "everywhere") → a global decision, and if the component is `shared`, add an
      optional prop whose default keeps today's behaviour, use it on the marked screen and say which
      screens use it; ambiguous → implement the most likely reading and state the assumption.
   4. If the screen is `approved`, `delivering` or `live`, the edit sends it back to review: do it
      only if the note clearly asks for it, and say so in the reply.
   5. Edit with `croqui_edit_file` (one snippet per call) or `croqui_write_file`. `compile.ok` before
      moving on.
   6. Verify at the right cost: copy, props and small style edits are covered by `compile.ok`; a note
      that changed layout gets one `croqui_screenshot` of that screen, once, after the last note that
      touches it.
   7. `croqui_resolve_annotation { project, id, status: "done", reply }`. The reply is 2–4 sentences:
      what changed, which files, assumptions, anything left to a human.
5. **Finish** with a short table: `note · what changed · open question`. No narration.

## Rules

- One note at a time. Do not mix edits for two notes in one file unless both are `doing`.
- A note that needs a decision only the user can make, with no safe conservative version: leave it
  `doing` with the question as the reply, and move on. One blocked note never blocks the batch.
- Never replicate a change to other screens unless the note says so.
- If `croqui_edit_file` fails because `old` repeats, widen the snippet; do not rewrite the file.
