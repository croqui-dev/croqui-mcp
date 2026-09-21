---
name: croqui-canvas
description: Build and edit screens on a Croqui.dev design canvas through its MCP server. Reads the project's context and design system, then writes real React screens and components in passes the team watches live, annotates and approves. Use when the user asks to design, build, change or review screens or components on Croqui.dev, or names a Croqui.dev project (product:<name>).
---

# Croqui.dev canvas

Croqui.dev is a collaborative design canvas: you write real React screens over MCP, humans watch them
appear, annotate and approve, and the approved screen ships. Your writes show up on the canvas as a
cursor and selection boxes on the frame, so the order and pace of your calls is what people see.

## 0. Connection

No `croqui_*` tools available: the MCP server is not connected. Add a remote (HTTP) MCP server named
`croqui` with the URL `https://croqui.dev/mcp` in your client's MCP config (or the connector settings)
and sign in when the browser opens. Step by step for each client: https://croqui.dev/agent-setup.md.
Tools listed but calls fail with an auth error: re-authenticate the `croqui` server in your client.

## 1. Where you are

`croqui_status` — who you are signed in as, which teams you can write to and their plan limits. Read
it before creating anything.

## 2. Find the project

- `croqui_list_projects`. Match the user's words or the repository name to a project id
  (`product:<kebab-name>`). Reusing beats creating a near-duplicate.
- No match and the user wants a new one: `croqui_create_project { id, name, organizationId }`. With
  more than one team, ask which one first — a project in the wrong team is invisible to the people who
  need it.

## 3. Read before writing (once per session)

1. `croqui_context { project }` — screens, components, which are `shared` (with `usedBy`),
   references, open annotations, each screen's review stage.
2. `croqui_ds_reference { project }` — screen format, build contract, design bar, design system. For
   the components you plan to use, one call: `croqui_ds_reference { project, components: "Button,Card" }`.
3. When the product's repository is at hand, read the real page you are designing (routes, copy, data
   shape). The canvas is where the design lives; never edit the product repo from here.

## 4. Build contract

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
   the variant switches in place on the same screen. Example data for a flow lives in one shared
   module the screens of that flow import (e.g. components/data.ts, listed in components/ like any
   other file), not reinvented per screen; screens in the same flow read the same data instead of
   diverging copies.

3. Build live, in cycles. People watch the canvas while you work, so every call should change what
   they see. One unit per call:
   a. Skeleton first, before drawing assets or building components: croqui_write_file with meta
      (device only if this screen is mobile) and the layout regions as placeholders, each marked
      data-croqui-slot="<Region>" (<section data-croqui-slot="Pricing" ...>). Viewers see you working
      on the first slot left.
   b. Then one region per cycle, top to bottom: create or reuse that region's component(s) and swap
      it in for its placeholder, data-croqui-slot included, with croqui_edit_file right away. The canvas only shows what a screen
      renders, so never write a batch of components before wiring the first one.
   c. States and interactions (rule 4) and Present wiring (rule 5), as further edits.
   Do not send a finished screen in one write.

4. Interactive by default. Anything clickable is a <button> or <a> with cursor-pointer and visible
   hover, active and focus-visible styles. Tabs, segmented controls, toggles, accordions, selects and
   steppers work with local useState. Carousels scroll (overflow-x-auto, snap). Inputs accept typing.

5. Wire Present. On the element that leads somewhere:
   data-croqui-goto="screens/<group>/<screen>.tsx"  open another screen
   data-croqui-open="<Export>"                      open a drawer/modal/sheet listed in meta.frames
   data-croqui-close                                inside that frame, close it
   data-croqui-back                                 go back to the previous screen
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
   per-step check. Take croqui_screenshot once, after the last pass, on the screen's own device (a
   screen only ever has one), and fix what it shows. Never screenshot after each region or each note.
   If croqui_screenshot is unavailable, skip the visual check and say so in the report. Report: files
   written, components created or reused, what is wired in Present, what is placeholder or inferred.

## 5. Design bar: the screen has to look designed, not generated.

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

10. Look at it before you call it done. Read the screenshot as a stranger: what do you read first, is
    anything cut, overlapping or crowding an edge, does the screen say what it is without a caption.
    Fix that, then report.

## 6. Screen format

Screen format: `screens/<group>/<screen>.tsx`, `export default function Screen({ device }: { device: "desktop" | "mobile" })` and `export const meta = { name, device?, width, height?, background?, appear?, frames?, viewports?, props? }`. A screen is ONE device: `meta.device: "mobile"` declares mobile, absent = desktop. Never write both a desktop and a mobile version of the same screen — the mobile counterpart is a separate file (`<screen>.mobile.tsx` by convention), created only when the human asks for it. The `device` prop still reaches the component either way (it just always matches the screen's own `meta.device`). `meta.viewports.<device>.width/height` still sets a custom size for that one device; `viewports.*.export` is legacy from the paired era and is ignored. Drawer/modal/sheet: named export + `meta.frames`, never an overlay on default; each export renders open and standalone and receives `device`. `prod` is a reserved export (Working card). Figma-style appearance is only defined by the agent (`meta.appear` / `frames[].kind` popup|menu + `frames[].appear`: instant|dissolve|move-in|slide-in|push|scale). Humans don't edit the transition. Allowed imports: `react`, `@ds` (product bundle → window[settings.bundle.global]), relative (`./`, `../`) and `https://` URLs. Any other package fails compilation. Only use Tailwind classes that exist in the compiled CSS; glue with `var(--*)` / inline style; mock content in the domain's language. Present renders in a fixed-height viewport (exact size, clipped, not stretched) — layout must carry its own internal scroll, never assume the page grows to fit content. Optional `export const variants = { <axis>: { options: string[] | { id, label?, props? }[], default } }` declares plan/profile/state variants for this screen — the frame reads `?v=<axis>:<option>,...`, injects `{ [axis]: optionId }` into the component plus the selected option's `props`, and the variant switches in place, never as a second screen file. Axis names `device`, `project`, `doc`, `key`, `legacy` are reserved and ignored with an error.

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

## 7. Scope

- Edit only what the user asked for: the screen, component or node they named or marked. Do not
  "align" other screens along the way.
- Changing a `shared` component changes every screen in its `usedBy`: name those screens, and either
  confirm first or add an optional prop whose default keeps today's behaviour.
- Before overwriting work you did not do, check `croqui_history { project, path }`.
- `croqui_edit_file { old, new }` for anything short of a rewrite; `old` must be unique, so widen the
  snippet instead of rewriting a large file.
- If a screen's stage is `approved`, `delivering` or `live`, say so before editing: any change sends
  it back for approval before it can ship.
- Deleting screens is admin-only. Never delete to "start clean".

## 8. Leave a trail

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
| Projects | `croqui_list_projects`, `croqui_create_project` |
| Project state | `croqui_context`, `croqui_events`, `croqui_history` |
| Conventions and design system | `croqui_ds_reference` |
| Find things | `croqui_list_files`, `croqui_search`, `croqui_read_file` |
| Write | `croqui_write_file`, `croqui_edit_file`, `croqui_write_files` (one cycle per call) |
| Check | `croqui_inspect_screen` (structure), `croqui_screenshot` (pixels) |
| Annotations | `croqui_read_annotations`, `croqui_resolve_annotation`, `croqui_mark_for_edit` |
| Import a design | `croqui_import_design` (see the `croqui-import` prompt) |
