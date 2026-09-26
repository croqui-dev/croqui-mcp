---
name: croqui-canvas
description: Build and edit screens on a Croqui.dev design canvas through its MCP server. Reads the project's context and design system, then writes real React screens and components the team watches live, annotates and approves. Use when the user asks to design, build, change or review screens or components on Croqui.dev, or names a Croqui.dev project (product:<name>).
---

# Croqui.dev canvas

Croqui.dev is a collaborative design canvas: you write real React screens over MCP, humans watch them
appear, annotate and approve, and the approved screen ships. While you write, the canvas shows your
presence and a working veil over the frame; how you split the writes is up to you.

## 0. Connection

No `croqui_*` tools available: the MCP server is not connected. Add a remote (HTTP) MCP server named
`croqui` with the URL `https://croqui.dev/mcp` in your client's MCP config (or the connector settings)
and sign in when the browser opens. Step by step for each client: https://croqui.dev/agent-setup.md.
Tools listed but calls fail with an auth error: re-authenticate the `croqui` server in your client.

## 1. Where you are

`croqui_status` — who you are signed in as, which teams you can write to and their plan limits. Read
it before creating anything.

## 2. Find the project

- Inside a git repository: `croqui_list_projects { repo }` with `git remote get-url origin` — the
  projects linked to it come back as `matches`, with what to do next. Otherwise `croqui_list_projects`
  and match the user's words or the repository name to a project id (`product:<kebab-name>`).
  Reusing beats creating a near-duplicate. Every project lists its `ds.kind`: `bundle`, `canvas` or
  `none`.
- No match and the user wants a new one: `croqui_create_project { id, name, organizationId, repo }`.
  With more than one team, ask which one first — a project in the wrong team is invisible to the people
  who need it.

## 3. Design system first

Every project has a design system before its first screen: the server refuses screens/ writes
without one. It is one of two kinds, and screens import either as `@ds`:

- **bundle** — the product's real components, published from its repository's `ds-bundle/` folder.
- **canvas** — built on the canvas under `ds/` from the user's requests and references, when the
  product has no bundle or the user chose not to publish it.

With none, in this order:
1. Another project of the same product publishes a bundle → `croqui_copy_bundle { project, from }`
   (or `bundleFrom` on `croqui_create_project`). Unsure it is the same product: ask.
2. The product's repository has `ds-bundle/` → suggest publishing it (`croqui_publish_bundle`, the
   `croqui-publish-bundle` skill). It is the user's call.
3. The user declines, or there is no bundle anywhere → build the canvas design system (below). Never
   skip it by writing styles straight into screens.

A product that already has a bundle on the canvas starts WITH it:
`croqui_create_project { id, name, bundleFrom: "<project with the bundle>" }` copies it server side
(nothing goes through the chat); for an existing project, `croqui_copy_bundle { project, from }`. A
repo bundle no project has yet goes through `croqui_publish_bundle { project }` without files: it
returns an upload link you feed the folder to with tar + curl. Rebuilding a product's components by
hand when its bundle exists is a failed pass, however good it looks.

### Build the canvas design system

Source: the user's requests and references — what they asked for, links, screenshots, brands and
products they point at, notes on the canvas. Not the local codebase: a system read out of local code
is the bundle done badly; when the user wants their code's system, the path is publishing ds-bundle/.

1. References. None in the conversation: ask once, briefly, for 2-3 products whose look they want, their
   brand (logo, colours) or screenshots. No answer: infer from the product's domain, and say which
   assumptions you made.
2. `ds/tokens.css` — `:root` custom properties by role, not by hue: colours (`--color-bg`,
   `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-accent`,
   `--color-accent-contrast`, `--color-danger`, `--color-success`), type (`--font-sans`, the scale
   `--text-xs` … `--text-2xl`), `--radius-*`, the spacing step `--space-*`, `--shadow-*`.
3. `ds/<Name>.tsx` per component, and `ds/index.tsx` that does `import "./tokens.css";` and re-exports
   them. Start with what the first screens need — Button (primary, secondary, ghost; sizes; disabled;
   loading), Input with label and error, Card, Badge — plus what this product repeats (nav item, table
   row, avatar…). Components style themselves from `var(--*)` (Tailwind arbitrary values like
   `bg-[var(--color-accent)]`, or inline style), with hover, focus-visible, active and disabled on every
   control. Inside `ds/`, import siblings relatively (`./Button`); `@ds` is for screens.
4. `ds/conventions.md` — each decision and where it came from ("accent from the logo the user sent",
   "dense tables: asked for a trading-desk feel"). Short: it is what the next agent reads.
5. `ds/Showcase.tsx` (`export const meta = { name: "Design system" }` + a default export) — the tokens
   (swatches, type scale, radii, spacing) and every component in its states. It is the design system's
   page in the viewer: the humans review the system there.
6. `croqui_check { path: "ds/Showcase.tsx" }` until PASS, then pin it for approval with
   `croqui_mark_for_edit` and `options`. Screens can follow right away; the report says the system
   itself is waiting on the humans.

After that, screens import only from `@ds` and never restyle a DS component inline to get another
look: a variant goes into the DS, and a component a screen needs and the DS lacks goes into `ds/`
first. Once the product publishes a bundle, it replaces the canvas system.

## 4. Read before writing (once per session)

1. `croqui_context { project }` — screens, components, which are `shared` (with `usedBy`),
   references, open annotations, each screen's review stage.
2. `croqui_ds_reference { project }` — screen format, build contract, design bar and the design
   system: the bundle's components or the canvas system's tokens and components. For the components you
   plan to use, one call: `croqui_ds_reference { project, components: "Button,Card" }`.
3. When the product's repository is at hand, read the real page you are designing (routes, copy, data
   shape).

## 5. Working from the product's repository

Whenever you work inside a git repository — or the user asks for something built in their local repo,
or based on it:

1. **Find the project by the repository.** `croqui_list_projects { repo }` with
   `git remote get-url origin`. A match is the project. No match but a project clearly is this product
   (same name): link it, `croqui_create_project { id: <its id>, repo }`. Nothing: ask before creating one,
   and pass `repo` when you do.
2. **Design system.** Follow `next` from that call. The project has none and the repo has
   `ds-bundle/`: suggest publishing it. The user declines or there is none: the canvas design system,
   built from their requests and references.
3. **The design system goes with the work.** Building in the repo from the canvas (a screen to
   implement, a change designed on Croqui): with a bundle, the repo already has those components — use
   them, never a copy. With a canvas DS, bring `ds/tokens.css` and the `ds/` components the screen uses
   into the repo first, in the repo's own conventions (its tokens file, its components folder), and
   reuse them for every later screen. A screen implemented with ad-hoc colours and spacing is not done.
4. **Compare, by picture.** After implementing, run the app locally and screenshot the page at the
   screen's viewport (a headless browser: Playwright, `chrome --headless --screenshot`), take
   `croqui_screenshot { project, path }` of the canvas screen, and look at both side by side: layout,
   spacing, type, colours, copy, states. Fix the repo until they match, and report what differs on
   purpose. The other way round too: asked to bring the canvas in line with what the app shows,
   screenshot the local page and change the canvas screen until it matches.
5. **Scope.** A canvas request does not touch the repo, and a repo request does not change the canvas
   without saying so.

## 6. Build contract

Build contract: how a screen gets built on the canvas.

1. Structure first. Lay the screen out in document flow with flex/grid. position:absolute is only for
   things that float over flow content (badges, FABs, decorative art). Never place a whole screen
   element by element with coordinates, not even when copying a screenshot.

2. Components before screens. Reuse in this order: @ds (croqui_ds_reference) → the project's
   components/ (croqui_list_files, croqui_search) → only then create. Anything that repeats, across
   screens or inside one screen (list rows, cards in a grid, tabs, nav items, tiles, chips), is a
   component in components/<Name>.tsx with minimal typed props, rendered from mock data with .map.
   A screen file composes regions and components; it is never a single component wrapping the whole
   screen.

   Plan, profile or state variation (Free vs Pro, empty vs populated) is a variant axis
   (`export const variants`, see the screen format above), never a duplicated screens/*.tsx file —
   the variant switches in place on the same screen. An axis belongs to the screen that declares it:
   its own options, default and selection. Add `global: true` only for an axis that means the same
   thing on every screen (plan, role): global axes with the same name share one selection across the
   project, and every screen declaring one must use identical options and default. Changing the
   variant remounts the screen, so `useState(propFromVariant)` starts from the new value and local
   state resets. Example data for a flow lives in one shared
   module the screens of that flow import (e.g. components/data.ts, listed in components/ like any
   other file), not reinvented per screen; screens in the same flow read the same data instead of
   diverging copies.

3. Write the screen however serves it best: one full write, or a write followed by edits. The viewer
   shows a working veil over the frame while you write, independent of the order or size of your
   calls, so do not split a screen into artificial steps for the audience. Wire each component into
   the screen as you create it rather than leaving it unused; states and interactions (rule 4) and
   Present wiring (rule 5) are part of the screen, not a later pass.

4. Interactive by default. Anything clickable is a <button> or <a> with cursor-pointer and visible
   hover, active and focus-visible styles. Tabs, segmented controls, toggles, accordions, selects and
   steppers work with local useState. Carousels scroll (overflow-x-auto, snap). Inputs accept typing.

5. Wire Present. On the element that leads somewhere:
   data-croqui-goto="screens/<group>/<screen>.tsx"  open another screen
   data-croqui-open="<Export>"                      open a drawer/modal/sheet listed in meta.frames
   data-croqui-close                                inside that frame, close it
   data-croqui-back                                 go back to the previous screen
   data-croqui-set="<axis>:<option>[,...]"          with goto: the target opens in that variant;
                                                    with close: the screen under the frame switches
                                                    to it (e.g. a "Save" in a popup shows the saved state)
   Link only to screens and frames that exist. Do not invent screens to complete a flow; leave the
   element inert and mention it in the report. The attributes only act in Present, so keep real
   onClick state as well.

6. Copying a reference image. Read the structure, then rebuild it with rules 1-5 at the target
   viewport. Take colors, type scale, radii and spacing from the image. Never crop the image into
   base64 sprites or background-image slices, and never measure pixels to place elements.
   Photos, logos and illustrations become neutral placeholders unless the user provides the asset;
   list them in the report.

7. The canvas is the only workspace. Do not build, bundle, render or screenshot screens locally, keep a
   local copy of the project, or iterate in scratch files to upload the result later. Drafts, SVG
   logos and illustrations included, go straight to the canvas, where people see them.

8. Verify cheaply. Every write returns compile: fix a broken compile before the next call; that is the
   per-step check. Run croqui_check once, when the screen is done: it lays the screen out at every size
   of its device and lists what is broken (sideways scroll, cut or overlapping text, contrast) with
   the JSX line. Fix every error and run it again until PASS. Never check after each edit or each
   note. If croqui_check is unavailable, skip the visual check and say so in the report. Report: files
   written, components created or reused, what is wired in Present, what is placeholder or inferred.

## 7. Design bar: the screen has to look designed, not generated.

1. The product decides the look. Before the first write, settle what this product is, who opens this
   screen and the one job it does for them. Everything after that follows from it: a clinic scheduler,
   a trading desk and a kids' app do not share a palette, a density or a tone. When the user did not
   say the domain, infer it, say so in the report and pin the assumption with croqui_mark_for_edit.
   Never fall back to the default dark-SaaS-dashboard look because nothing told you otherwise.

2. Content first, and real. Mock data is the product's own vocabulary: names, amounts, dates and
   statuses that could be a real Tuesday in this product, consistent with each other (a total is the
   sum of its rows, a date is not in the future). Copy is what a person would write, not a label:
   "Nothing due this week" over "No items". No lorem, no "Card title", no "Description goes here".

3. Icons are drawn, not typed. Inline SVG (currentColor, 1.5 stroke, 20 or 24 box) or a plain
   letterform. Emoji is content, never the icon system — an emoji in a nav item or a stat card is the
   clearest tell of a generated screen.

4. One type scale, one spacing step, one accent. Pick a scale (e.g. 12/14/16/20/28/40), a step (4 or
   8) and at most three weights, and hold them across the screen. Hierarchy comes from size, weight
   and colour — not from nesting a card inside a card inside a panel. The accent colour has one job
   (the primary action); if it shows up in five places it has stopped meaning anything.

5. Each screen is designed for its own device, not stretched. A mobile screen is not its desktop
   counterpart squeezed, and a desktop screen is not a mobile one widened: reflow the regions, change
   the density, move navigation where the thumb is. Present renders a fixed viewport, so the screen
   carries its own scroll (overflowY: auto with minHeight: 0 on the scrolling child), never the page
   growing to fit.

6. The states that matter, not only the happy one. A list also has empty (with the action that fills
   it), a loading skeleton, an error, and content that stresses it: the long name that wraps, the
   seven-digit number, the row that is still processing. Build the ones this screen will really hit
   and say which you built.

7. Interaction that reads as interactive. Visible hover, active and focus-visible on every control
   (never remove the outline without replacing it), disabled that looks disabled, selected that looks
   selected, touch targets ~44px on mobile. Inputs have labels; a placeholder is not a label.

8. Nothing invented to fill the layout. No AI-insight card nobody asked for, no chart of meaningless
   numbers, no badge, no streak, no decorative gradient panel. An empty region is one region fewer,
   not a place to put filler. Features the user did not ask for are a question for the report.

9. Legible by default. Body text at 4.5:1 contrast or better against its real background, secondary
   text still readable, nothing below 12px, no text over a busy image without a scrim.

10. Look at it before you call it done. croqui_check has to PASS; then read its image as a stranger: what do you read first, is
    anything cut, overlapping or crowding an edge, does the screen say what it is without a caption.
    Fix that, then report.

## 8. Screen format

Screen format: `screens/<group>/<screen>.tsx`, `export default function Screen({ device }: { device: "desktop" | "mobile" })` and `export const meta = { name, device?, width, height?, background?, appear?, frames?, viewports?, props? }`. A screen is ONE device: `meta.device: "mobile"` declares mobile, absent = desktop. Never write both a desktop and a mobile version of the same screen — the mobile counterpart is a separate file (`<screen>.mobile.tsx` by convention), created only when the human asks for it. The `device` prop still reaches the component either way (it just always matches the screen's own `meta.device`). `meta.viewports.<device>.width/height` still sets a custom size for that one device; `viewports.*.export` is legacy from the paired era and is ignored. Drawer/modal/sheet: named export + `meta.frames`, never an overlay on default; each export renders open and standalone and receives `device`. `prod` is a reserved export (Working card). Figma-style appearance is only defined by the agent (`meta.appear` / `frames[].kind` popup|menu|drawer|screen + `frames[].appear`: instant|dissolve|move-in|slide-in|push|scale). `kind` picks how the frame opens over the screen: `popup` (default for a named export) centers it on a scrim, `menu` anchors it under the clicked element, `drawer` pins it to an edge (`appear.direction`: right by default) at the full length of the other axis — give the drawer its panel width in `frames[].width` and let the viewer draw the scrim, so the export renders the panel alone, no backdrop of its own; `screen` replaces the screen instead of opening over it. Humans don't edit the transition. Allowed imports: `react`, `@ds` (product bundle → window[settings.bundle.global]), relative (`./`, `../`) and `https://` URLs. Any other package fails compilation. Tailwind depends on the project's utilities mode (`croqui_context` → `utilities`): `jit` (no published bundle stylesheet) compiles any utility class live; `bundle` means only classes in the bundle's CSS exist; `off` means none. Glue anything else with `var(--*)` / inline style; mock content in the domain's language. Present renders in a fixed-height viewport (exact size, clipped, not stretched) — layout must carry its own internal scroll, never assume the page grows to fit content. Optional `export const variants = { <axis>: { options: string[] | { id, label?, props? }[], default } }` declares plan/profile/state variants for this screen — the frame reads `?v=<axis>:<option>,...`, injects `{ [axis]: optionId }` into the component plus the selected option's `props`, and the variant switches in place, never as a second screen file. Axis names `device`, `project`, `doc`, `key`, `legacy` are reserved and ignored with an error.

```tsx
// @source apps/web/app/billing/page.tsx
import { useState } from "react";
import { Button } from "@ds";
import { PlanCard } from "../../components/PlanCard";
import { PLANS } from "../../components/data";

export const meta = {
  name: "Billing",
  frames: [{ export: "CancelDialog", name: "Cancel plan", kind: "popup", appear: { type: "scale" } }],
};

// No `device` field: this screen is desktop (the default). A mobile Billing, if the user asks for
// one, is a separate file (`billing.mobile.tsx`) with `meta.device: "mobile"` — never a second
// export or a `viewports.mobile` entry on this one.

// Free/Pro/Enterprise is a variant axis, not three copies of this screen: the frame injects
// `plan` as a prop and the render below reacts to it. Same for empty/loading/error states —
// they are options on an axis, never a "BillingEmpty.tsx".
export const variants = {
  plan: { options: ["Free", "Pro", "Enterprise"], default: "Pro" },
};

export default function Billing({ device, plan }: { device: "desktop" | "mobile"; plan: string }) {
  // Seeding local state from a variant prop is safe: the frame remounts the screen whenever the
  // variant selection changes, so switching `plan` in the bar resets `selected`.
  const [selected, setSelected] = useState(plan);
  return (
    <main className="flex min-h-full flex-col gap-6 bg-background p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <Button variant="ghost" data-croqui-open="CancelDialog">Cancel plan</Button>
      </header>
      <section className="grid grid-cols-2 gap-4">
        {PLANS.map((item) => (
          <PlanCard key={item.id} {...item} selected={selected === item.id} onSelect={() => setSelected(item.id)} />
        ))}
      </section>
    </main>
  );
}

export function CancelDialog() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-background p-6">
      <p>Your team keeps access until the end of the billing period.</p>
      <Button data-croqui-close>Keep plan</Button>
    </div>
  );
}
```

## 9. Scope

- Edit only what the user asked for: the screen, component or node they named or marked. Do not
  "align" other screens along the way.
- Changing a `shared` component changes every screen in its `usedBy`: name those screens, and either
  confirm first or add an optional prop whose default keeps today's behaviour.
- Before overwriting work you did not do, check `croqui_history { project, path }`.
- `croqui_edit_file { old, new }` for anything short of a rewrite; `old` must be unique, so widen the
  snippet instead of rewriting a large file.
- If a screen's stage is `approved`, `delivering` or `live`, say so before editing: any change sends
  it back for approval before it can ship.
- Delete a screen only when asked, never to "start clean". Anyone who can write the project can delete,
  and the answer carries the `rev` to restore from.
- Every write is a revision and a delete keeps them all. `croqui_history { path }` lists them, deleted
  files included; `croqui_read_file { path, rev }` shows one (it does not clear the file for a write,
  only reading the current file does); `croqui_restore { path, rev }` writes it back as a new revision,
  deleted screens and components included. `croqui_context.deleted` lists paths that still have
  history: restore one instead of writing a "new" file over it.

## 10. Leave a trail

- Anything that needs a human decision gets pinned: `croqui_mark_for_edit { project, path, note }`.
  Pin it with `options`: up to 3 concrete alternatives, written as the outcome ("Stack the filters
  above the table"), not as a question. The human picks one in the viewer and it comes back on the note
  as `choice` with the note back on `todo` -- that pick is the brief for the next pass. No options =
  the human has to write the answer from scratch.
- Report in a few lines: files written, components created or reused (and which screens share them),
  what is wired in Present, what is placeholder or inferred, what needs a decision. Link
  `https://croqui.dev/?project=<id>`.
- Approval is the humans' call in the viewer. Never tell the user a screen is approved.

## Tool map

| Need | Tool |
| --- | --- |
| Who am I, teams, limits | `croqui_status` |
| Projects, by repository | `croqui_list_projects { repo }`, `croqui_create_project { repo }` |
| Design system | `croqui_copy_bundle`, `croqui_publish_bundle`, the canvas one under `ds/` |
| Project state | `croqui_context`, `croqui_events`, `croqui_history` |
| Conventions and design system | `croqui_ds_reference` |
| Find things | `croqui_list_files`, `croqui_search`, `croqui_read_file` |
| Write | `croqui_write_file`, `croqui_edit_file`, `croqui_write_files` (several writes in one call) |
| Check | `croqui_inspect_screen` (structure), `croqui_check` (every viewport, PASS/FAIL), `croqui_screenshot` (one picture) |
| A human says the screen shows an error | `croqui_events { project, kind: "frame.error" }`: the exact text their viewer showed. Never answer "it renders fine here" |
| Annotations | `croqui_read_annotations`, `croqui_resolve_annotation`, `croqui_mark_for_edit` |
| Import a design | `croqui_import_design` (see the `croqui-import` prompt) |
