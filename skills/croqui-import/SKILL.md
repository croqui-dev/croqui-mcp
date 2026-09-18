---
name: croqui-import
description: Bring an existing design into a Croqui.dev project — from screenshots or images the user attaches, or from a product repository — as real React screens and components, faithful to the source. Use when the user asks to import, copy, clone or recreate a screen, app, mockup or screenshot on Croqui.dev ("make this exactly like the image", "import our app's screens").
---

# Croqui.dev import

An import is a copy job, not a redesign: the user wants the source reproduced on the canvas first and
decides what changes afterwards. Everything in the `croqui-canvas` prompt applies; read it first if it
is not already in context.

## 1. Load the protocol

`croqui_import_design { source }` with `screenshots`, `local-repo` or `github-repo` returns the
step-by-step protocol (vision gate, inventory, which screens, project, screens, close-out). Follow it
in order; its gates are not optional. Below are the judgment calls it leaves to you.

## 2. Copy first, change later

- **Pass 1 is the copy.** Same layout, hierarchy, copy (verbatim, original language), density and
  visual weight. Do not modernize colours, fix spacing, translate text or drop elements that look
  wrong. If the source is inconsistent (a bar at 65% labelled "50%"), copy it and mention it.
- **Pass 2 is what the user asked for**, after they have seen pass 1. Asked for both at once ("like
  this, but dark")? Deliver them as two writes, in that order.
- The design system wins over a pixel match: when `@ds` has the component the image shows, use it.

## 3. Read structure, not pixels

From the image, read the regions and their order; what repeats (cards, rows, tiles, nav items) →
`components/`; the type scale (3–5 sizes), the palette (sample flat areas), radii and spacing rhythm;
what is interactive and where Present should navigate. Then rebuild with flex/grid at the target
viewport, live: skeleton first, one region at a time.

Do not place elements by coordinates measured from the image, scale a screenshot to fill the viewport
instead of laying it out, crop the image into base64 sprites, or run image-processing scripts to
measure the reference. Photos, logos and illustrations become neutral placeholders at the right size
and radius until the user uploads the real assets.

## 4. What the image does not show

Hover, focus, pressed, empty and error states: build the interactive default without inventing new
content. Content cut off by the capture: complete it minimally and list it as inferred. Only a mobile
capture: derive the desktop viewport and say so. Screens the flow implies but nobody showed: do not
create them — leave the element inert and list it.

## 5. Report

Per screen, one line: what was imported, components extracted and which screens share them, what is
wired in Present, what is placeholder or inferred, and anything you copied even though it looks wrong.
