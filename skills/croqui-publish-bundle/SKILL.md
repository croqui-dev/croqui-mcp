---
name: croqui-publish-bundle
description: Publish a product's local design-system bundle (the ds-bundle/ folder in the repo) to its Croqui.dev project, so screens on the canvas render with the product's real components and tokens. Use when the user asks to publish, update or re-sync the design system, the ds-bundle or the @ds components of a Croqui.dev project from the local repo.
---

# Publish a local design system to Croqui.dev

Croqui.dev runs on a server. It cannot read the user's machine. When a product's design system lives in
the repo — the generated `ds-bundle/` folder — this skill is the bridge: you read the folder with your
own file tools and hand the files to `croqui_publish_bundle`, which assembles and stores them.

You do the reading. The server does the assembling. Do not try to inline CSS, resolve `@import`s,
concatenate files or decide what the bundle's global is — that is the tool's job, and doing it by hand
is how a stylesheet silently loses a layer.

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

2. **Collect the files.** Glob the folder. Include every `.css` reachable from `styles.css` — read it,
   look at its `@import` lines, and follow them, including nested ones. A missing import is an error
   from the tool, not a warning, so it is cheaper to send one file too many than one too few.

3. **Read them as text.** Every file goes up as utf-8 text. Skip binaries (fonts, images): they are not
   part of the bundle contract, and a font referenced by URL keeps working.

4. **Publish.** One call, with paths relative to the bundle folder:

   ```
   croqui_publish_bundle({
     project: "product:<name>",
     files: [
       { path: "_ds_bundle.js", content: "…" },
       { path: "styles.css", content: "…" },
       { path: "tokens.css", content: "…" },
       { path: "components/forms/Button/Button.d.ts", content: "…" }
     ]
   })
   ```

   Pass `global` only when the tool asks for it — normally it reads it from the `@ds-bundle` header or
   `.stories-map.json`.

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
