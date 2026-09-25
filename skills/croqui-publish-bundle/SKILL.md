---
name: croqui-publish-bundle
description: Publish a product's local design-system bundle (the ds-bundle/ folder in the repo) to its Croqui.dev project, so screens on the canvas render with the product's real components and tokens. Use when the user asks to publish, update or re-sync the design system, the ds-bundle or the @ds components of a Croqui.dev project from the local repo.
---

# Publish a local design system to Croqui.dev

Croqui.dev runs on a server. It cannot read the user's machine. When a product's design system lives in
the repo — the generated `ds-bundle/` folder — this skill is the bridge: `croqui_publish_bundle`
hands you a single-use upload link, and you send the folder to it from the shell with tar + curl. The
bundle is a megabyte of JS: never paste it into a tool call.

You send the folder. The server does the assembling. Do not inline CSS, resolve `@import`s,
concatenate files or decide what the bundle's global is — that is the tool's job.

If another project on the canvas already publishes this product's bundle, you don't need the repo at
all: `croqui_copy_bundle { project, from }`.

## What a bundle is

A generated folder, by convention `ds-bundle/` at the repo root:

| file | required | what it is |
|---|---|---|
| `_ds_bundle.js` | yes | the compiled components, exposed on a global |
| `styles.css` | yes | the entry stylesheet, usually with `@import`s next to it |
| whatever those `@import`s point at | — | send them too, or the publish fails |
| `README.md` | no | how to use the system |
| `conventions.md` | no | house rules; also read from `.design-sync/conventions.md` |
| `components/<group>/<Name>/<Name>.prompt.md` | no | how that component is meant to be used |
| `components/<group>/<Name>/<Name>.d.ts` | no | its types |

If `ds-bundle/` doesn't exist, stop and say so: the product has to generate it first (the repo's own
build step). Do not improvise a bundle out of `src/components`.

## Steps

1. **Find the folder.** `ds-bundle/` at the repo root unless the user names another. Confirm
   `_ds_bundle.js` and `styles.css` are in it.

2. **Get the link.** `croqui_publish_bundle { project }` with no `files`. It returns `upload` (valid
   15 minutes, one use) and `run`, the exact command.

3. **Send the folder.** Run `run` with `<path to ds-bundle>` filled in. It tars the folder minus
   screenshots and vendored React (the _preview stories go: they become the canvas's DS catalog) and PUTs it; the response is the publish result. No `tar`? A zip of the
   folder works too (`Content-Type: application/zip`). Don't echo the upload URL to the user.
   Only a client with no shell sends the files inline (`files: [{ path, content }]`, paths relative to
   the folder, every `.css` reachable from `styles.css` included).

4. **Global.** Pass `global` to step 2 only when the result asks for it — normally it is read from the
   `@ds-bundle` header or `.stories-map.json`.

5. **Report what moved.** The result has `uploaded` and `skipped` (unchanged files, matched by hash)
   and the component count. Say how many components the project now has, and name the global. A publish
   where everything is skipped means the canvas already had this exact bundle: say that, plainly,
   instead of implying you changed something.

## After publishing

The project's screens can now `import { X } from "@ds"`. `croqui_ds_reference` lists what is available,
and that is what a canvas session should read before writing screens — not this skill.

## Scope

This skill only moves a design system from the local repo to the canvas. Building or editing screens is
`croqui-canvas`; working through annotations is `croqui-notes`. If the user wants those, switch.
