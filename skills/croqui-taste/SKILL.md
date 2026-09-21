---
name: croqui-taste
description: Read the user's own resolved annotations on Croqui.dev and distill the requests they repeat into 5-7 personal taste presets, then save them after explicit approval. Use when the user asks to learn their taste, set up taste presets, or install the croqui-taste skill/add-on.
---

# Croqui.dev taste

Distill the user's own resolved notes into a handful of personal presets: short, reusable notes they
can drop onto a mark instead of retyping the same request for the fifth time. This is a one-shot
add-on, not part of `croqui-canvas` -- nothing here builds a screen.

## Flow

1. **Read the corpus.** `croqui_read_annotations { status: "resolved", mine: true }` -- every note the
   user has written and closed. Fewer than about 8: say it is too early for presets yet and stop. Do
   not invent a preset out of nothing.
2. **Read what already exists.** `croqui_context` returns `presets.project` and `presets.mine`. Never
   repropose a preset that is already there, at the project level or the user's own, and never
   duplicate a project preset as a personal one.
3. **Distill.** Group the notes by the request they repeat, not by the screen they landed on. A preset
   is a request the user makes again and again, reusable on more than one screen -- a note that is
   specific and said once ("this price is wrong") never becomes a preset. Aim for 5-7: fewer, precise
   presets beat a full dozen.
4. **Write each preset in the user's own voice.** `label`: short, 2-4 words, reads like a button
   ("More contrast", "Shorter copy"). `note`: second person, addressed to the agent that will read it
   later, actionable, in whichever language the user's own notes are written in.
5. **Show the proposal, then wait.** List the presets in chat and wait for the user's explicit
   approval before writing anything. Only after a yes, call `croqui_write_presets { presets }` -- no
   `replace: true` unless the user asked to start over.
6. **Close out.** Say where the presets show up (design mode, when a note card is opened) and that
   they can edit them any time in Settings → AI presets.

## What not to do

- Do not invent a preset with no evidence in the notes -- every preset traces back to something the
  user actually wrote, more than once.
- Do not repropose or copy a project-level preset as a personal one.
- Do not call `croqui_write_presets` without an explicit yes from the user first.
- Do not propose more than 7 presets in one round.
