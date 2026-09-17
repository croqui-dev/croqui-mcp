# A first session

What it looks like when an agent connected to Croqui.dev builds a screen. Nothing here is special to
Claude Code; any MCP client drives the same sequence.

## 1. Find the project

```
> list my croqui projects and open the checkout one
```

The agent calls `croqui_list_projects`, then `croqui_open`. The canvas follows: everyone on the
project sees it pan to that project, with the agent's presence cursor labelled by its role.

## 2. Read before writing

```
> read the brief and the design system, then show me what is already there
```

`croqui_context` returns the project brief, conventions and current state. `croqui_ds_reference`
returns the components the screens must compose. `croqui_list_files` lists what exists.

Skipping this step is the single most common way an agent produces a screen that looks generic: it
invents a button instead of using yours.

## 3. Write the screen

```
> add a payment screen: product summary, email, card fields, pay button. Use the design system.
```

`croqui_write_file` creates `screens/payment.tsx` as a skeleton: the layout regions, empty. Then the
agent works region by region, top to bottom (the summary, the email field, the card fields, the pay
button): it writes the region's component and wires it in with `croqui_edit_file` in the same cycle.
Everyone watching sees its cursor draw a selection over each region as the new content appears. With
"Follow agents" on, the canvas opens the screen by itself.

It is a real React file importing the project's components, not a picture and not a fresh set of
components invented from the prompt. The pay button is a real button with hover and focus states, and
`data-croqui-goto="screens/payment-success.tsx"` on it makes the click-through work in Present. Before
reporting, the agent takes one `croqui_screenshot` of the finished screen.

## 4. The human annotates

A teammate pins a note on the frame: *"card fields are misaligned, and this button is not our
primary"*. Clients can do the same as free viewers.

## 5. The agent resolves

```
> read the annotations on the payment screen and fix them
```

`croqui_read_annotations` returns the pins with their positions. The agent edits the file and calls
`croqui_resolve_annotation` for each one it addressed.

The objection reaches the agent as data. Nobody had to translate a comment into a new prompt.

## 6. Approval and delivery

A human approves the screen on the canvas. Automatic delivery hands the approved screen to the
agents that implement it in the real product; they compare their implementation against the approved
design before it goes live.

That approval gate is the point of the product: nothing reaches production because an agent decided
it was finished.
