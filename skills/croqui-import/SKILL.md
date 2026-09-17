---
name: croqui-import
description: Bring an existing design into a Croqui.dev project — from screenshots or images the user attaches, or from a product repository — as real React screens and components, faithful to the source. Use when the user asks to import, copy, clone or recreate a screen, app, mockup or screenshot on Croqui.dev ("make this exactly like the image", "import our app's screens").
---

# Croqui.dev import

An import is a copy job, not a redesign. The user wants to see the source reproduced on the canvas
first and decide what changes afterwards. Everything in the `croqui-canvas` skill applies; read it
first if it is not already in context.

## 1. Load the protocol

Call `croqui_import_design { source }` with `screenshots`, `local-repo` or `github-repo`. It returns the
step-by-step protocol (vision gate, inventory, which screens to import, project, screens, close-out).
Follow it in order; its gates are not optional. The notes below are the judgment calls the protocol
leaves to you.

## 2. Copy first, change later

- **Pass 1 is the copy.** Same layout, hierarchy, copy (verbatim, original language), density and
  visual weight. Do not modernize colors, fix spacing, translate text or drop elements that look
  wrong. If the source is inconsistent (a bar at 65% labelled "50%"), copy it and mention it.
- **Pass 2 is what the user asks for**, after they have seen pass 1. If they asked for both at once
  ("like this, but dark"), deliver the copy and the change as two separate writes, in that order.
- The design system wins over a pixel match: when the project has `@ds` and a component matches what
  the image shows, use it instead of recreating it with raw Tailwind.

## 3. Read structure, not pixels

This is where imports get slow and wrong. From the image, read:

- the regions and their order (header, hero, list, tab bar…);
- what repeats (cards, rows, tiles, nav items) → these become `components/` (build contract rule 2);
- the type scale (3–5 sizes), the palette (sample flat areas), radii and the spacing rhythm;
- what is interactive (buttons, tabs, inputs, carousels) and where Present should navigate.

Then rebuild with flex/grid at the target viewport, live: skeleton first, then one region at a time
wired in as soon as its component exists (build contract rule 3). No local renders to compare against
the image (rule 7); one `croqui_screenshot` at the end.

Do not:

- place elements with absolute coordinates measured from the image;
- scale a small screenshot uniformly to the viewport instead of laying it out;
- crop the image into base64 sprites or background-image slices;
- run image-processing scripts to measure the reference. Looking at the image is enough to read
  structure; a missing pixel of accuracy is cheaper than ten minutes of measuring.

Photos, logos and illustrations become neutral placeholders with the right size and radius. If the
user needs the real assets, ask them to upload them to the project and reference those.

## 4. What the image does not show

- Hover, focus, pressed, scrolled, empty and error states: build the interactive default (build contract
  rule 4) without inventing new content.
- Content cut off by the edge of the capture: complete it minimally and list it as inferred.
- Only a mobile capture: the desktop viewport is derived. Say so; do not invent a desktop layout the
  user did not ask for.
- Screens the flow implies but nobody showed (the target of "See details"): do not create them. Leave
  the element inert and list it.

## 5. Report

Per imported screen, one line: what was imported, components extracted and which screens share them,
what is wired in Present, what is placeholder or inferred, and anything in the source you copied even
though it looks wrong.
