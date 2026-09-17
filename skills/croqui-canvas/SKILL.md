---
name: croqui-canvas
description: Build and edit screens on a Croqui.dev design canvas through its MCP server. Reads the project's context and design system, then writes real React screens and components in passes the team watches live, annotates and approves. Use when the user asks to design, build, change or review screens or components on Croqui.dev, or names a Croqui.dev project (product:<name>).
---

# Croqui.dev canvas

Croqui.dev is a collaborative design canvas where AI agents write real React screens over MCP, humans
annotate and approve, and the approved screen ships to production exactly as drawn. You are the agent
writing. People are usually watching the canvas while you work: your writes show up as a cursor and
selection boxes on the frame.

## 0. Connection

Call `croqui_status`. If the tool does not exist, the MCP server is not connected: tell the user to
install this plugin or run `claude mcp add --transport http croqui https://croqui.dev/mcp`, then
`/mcp` → croqui → Authenticate. Do not try to reach the canvas any other way.

`croqui_status` also says which teams you can write to and their plan limits. Read it before creating
a project.

## 1. Find the project

- `croqui_list_projects`. Match the user's words or the current repository name to a project id
  (`product:<kebab-name>`). Reuse beats creating a near-duplicate.
- No match and the user wants a new one: `croqui_create_project { id, name, organizationId }`. If the
  caller belongs to more than one team, ask which one before creating; a project in the wrong team is
  invisible to the people who need it.

## 2. Read before writing (once per session)

1. `croqui_context { project }` — screens, components, which components are `shared` (used by more
   than one screen, with `usedBy`), references, open annotations and each screen's review stage.
2. `croqui_ds_reference { project }` — the screen format, the build contract and the design system.
   For the components you plan to use, one call: `croqui_ds_reference { project, components:
   "Button,Card,Input" }`, not one call per component.
3. When working inside the product's own repository, read the real page you are designing (routes,
   copy, data shape) to understand it. Never edit the product repository from this skill: the canvas
   is where the design lives.

## 3. Build contract

Follow it for every screen and component. `croqui_ds_reference` returns the same text; if the two ever
differ, the server's version wins.

1. **Structure first.** Lay the screen out in document flow with flex/grid. `position: absolute` is
   only for things that float over flow content (badges, FABs, decorative art). Never place a whole
   screen element by element with coordinates, not even when copying a screenshot.
2. **Components before screens.** Reuse in this order: `@ds` → the project's `components/`
   (`croqui_list_files { prefix: "components/" }`, `croqui_search`) → only then create. Anything that
   repeats, across screens or inside one screen (list rows, cards in a grid, tabs, nav items, tiles,
   chips), is a component in `components/<Name>.tsx` with minimal typed props, rendered from mock data
   with `.map`. A screen file composes regions and components; it is never a single component that
   wraps the whole screen.
3. **Build live, in cycles, one unit per call.** People watch the canvas while you work, so every
   call should change what they see:
   1. Skeleton first, before drawing assets or building components: `croqui_write_file` with `meta`,
      viewports and the layout regions as placeholders, each marked `data-croqui-slot="<Region>"`
      (`<section data-croqui-slot="Pricing" ...>`). Viewers see you working on the first slot left.
   2. Then one region per cycle, top to bottom: create or reuse that region's component(s) and swap it
      in for its placeholder, `data-croqui-slot` included, with `croqui_edit_file` right away. The canvas only shows what a screen
      renders, so never write a batch of components before wiring the first one.
   3. States and interactions (rule 4) and Present wiring (rule 5), as further edits.
   Do not send a finished screen in one write.
4. **Interactive by default.** Anything clickable is a `<button>` or `<a>` with `cursor-pointer` and
   visible hover, active and focus-visible styles. Tabs, segmented controls, toggles, accordions,
   selects and steppers work with local `useState`. Carousels scroll (`overflow-x-auto`, snap). Inputs
   accept typing.
5. **Wire Present.** On the element that leads somewhere:
   - `data-croqui-goto="screens/<group>/<screen>.tsx"` opens another screen;
   - `data-croqui-open="<Export>"` opens a drawer, modal or sheet listed in `meta.frames`;
   - `data-croqui-close` inside that frame closes it;
   - `data-croqui-back` goes back to the previous screen.
   Link only to screens and frames that exist. Do not invent screens to complete a flow; leave the
   element inert and say so in the report. The attributes only act in Present, so keep real `onClick`
   state as well.
6. **Copying a reference image.** Read the structure, then rebuild it with rules 1–5 at the target
   viewport. Take colors, type scale, radii and spacing from the image. Never crop the image into
   base64 sprites or background-image slices, and never measure pixels to place elements. Photos,
   logos and illustrations become neutral placeholders unless the user provides the asset; list them
   in the report. For a full import, use the `croqui-import` skill.
7. **The canvas is the only workspace.** Do not build, bundle, render or screenshot screens locally,
   keep a local copy of the project, or iterate in scratch files to upload the result later. Drafts,
   SVG logos and illustrations included, go straight to the canvas, where people see them.
8. **Verify cheaply.** Every write returns `compile`: fix a broken compile before the next call; that
   is the per-step check. `croqui_inspect_screen` is the cheap check for structure and copy. Take
   `croqui_screenshot` once, after the last pass, on the device the screen is designed for (both only
   when their layouts differ), for overlap, overflow, cut text and contrast. Never screenshot after
   each region. If `croqui_screenshot` is unavailable, skip the visual check and say so in the report.

## 4. Screen format

- Path: `screens/<group>/<screen>.tsx`. First line: `// @source <what it is based on>` (a route in the
  product repo, a reference image, or "new").
- Every screen is desktop and mobile. Default export receives `device`; `meta.viewports` is explicit.
  A mobile that differs structurally uses `viewports.mobile.export = "Mobile"` and `export function
  Mobile()`.
  The viewer lists `<Screen> · Desktop` and `<Screen> · Mobile` as separate screens; both still come
  from this one file.
- Drawer, modal, sheet: a named export listed in `meta.frames`, rendered open and standalone. Never an
  overlay on top of the default export. Exports used by `viewports.*.export` do not go in `frames`.
  `prod` is a reserved export name.
- Transitions are yours to set, humans never edit them: `meta.appear` for the screen, `frames[].kind`
  (`popup` | `menu`) and `frames[].appear`. An appear is `{ type, direction?, duration?, easing? }`
  with `type` one of `instant`, `dissolve`, `move-in`, `slide-in`, `push`, `scale`.
- Imports: `react`, `@ds`, relative paths, `https://esm.sh/<pkg>?external=react,react-dom`. Anything
  else fails to compile. Tailwind classes only if they exist in the compiled CSS; otherwise `var(--*)`
  tokens or inline style.
- Local state and mock data inline, in the product's language. No fetching, no router, no env.

```tsx
// @source apps/web/app/billing/page.tsx
import { useState } from "react";
import { Button } from "@ds";
import { PlanCard } from "../../components/PlanCard";

export const meta = {
  name: "Billing",
  viewports: {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  },
  frames: [{ export: "CancelDialog", name: "Cancel plan", kind: "popup", appear: { type: "scale" } }],
};

const PLANS = [
  { id: "starter", name: "Starter", price: "$0" },
  { id: "team", name: "Team", price: "$49" },
];

export default function Billing({ device }: { device: "desktop" | "mobile" }) {
  const [selected, setSelected] = useState("team");
  return (
    <main className="flex min-h-full flex-col gap-6 bg-background p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <Button variant="ghost" data-croqui-open="CancelDialog">Cancel plan</Button>
      </header>
      <section className={device === "mobile" ? "flex flex-col gap-3" : "grid grid-cols-2 gap-4"}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} {...plan} selected={selected === plan.id} onSelect={() => setSelected(plan.id)} />
        ))}
      </section>
    </main>
  );
}

export function CancelDialog({ device }: { device: "desktop" | "mobile" }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-background p-6">
      <p>Your team keeps access until the end of the billing period.</p>
      <Button data-croqui-close>Keep plan</Button>
    </div>
  );
}
```

## 5. Scope

- Edit only what the user asked for: the screen, component or node they named or marked. Do not
  "align" other screens along the way.
- Reusing an existing component is always fine. **Changing a `shared` component** changes every screen
  in its `usedBy`: say which screens, and either confirm first or add an optional prop whose default
  keeps today's behaviour.
- Before overwriting work you did not do, check `croqui_history { project, path }`.
- `croqui_edit_file { old, new }` for anything short of a rewrite; `old` must be unique, so widen the
  snippet instead of falling back to rewriting a large file.
- Every write returns `compile`. A broken compile is fixed before the next write.
- **Approved screens.** If the screen's review stage is `approved`, `delivering` or `live`, tell the
  user before editing: any change moves it to "changed since approval" and it needs approval again
  before it ships.
- Deleting screens is admin-only. Never delete to "start clean".

## 6. Leave a trail

- After a change that needs a human decision, pin it: `croqui_mark_for_edit { project, path, note }`.
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
| Write | `croqui_write_file` (new file or rewrite), `croqui_edit_file` (one snippet) |
| Check | `croqui_inspect_screen` (structure), `croqui_screenshot` (pixels) |
| Annotations | `croqui_read_annotations`, `croqui_resolve_annotation`, `croqui_mark_for_edit` |
| Import a design | `croqui_import_design` (see the `croqui-import` skill) |
