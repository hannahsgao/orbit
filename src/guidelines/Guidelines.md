# Dithered Planets — Core Style Rules

Keep it minimal. Monochrome. Pixel-precise. Deterministic.

## Palette

* **Black canvas** (`#000`) + **white ink** (`#FFF`) + optional **single accent** (e.g., phosphor green `#A8FF60`).
* Use at most **bg + 2 inks + 1 accent** on a screen.
* No soft gradients; **simulate with dither** and bloom.

## Type & Copy

* **Monospace only** (IBM Plex Mono / JetBrains Mono).
* H1 24–32px **ALL CAPS** with letter-spacing; body 12–14px.
* Terminal tone, concise prompts (e.g., `> Left-click to spawn satellites`).

## Dither & Texture

* Prefer **ordered Bayer (4×4/8×8)**; use at most **two dither styles** per view.
* Starfield = sparse bright pixels + low-density dust; **no Gaussian blur**.
* Glow via small **bloom halo**, not blur.

## Geometry & Layout

* **1px strokes**; everything **pixel-aligned** to whole pixels.
* Orbits: **dotted 1px** circles; planet radii quantized (e.g., 6/8/12/16/20px).
* Hit areas ≥ **28×28px**; panels: black with **1px inside stroke**.

## Motion & Interaction

* Linear/step-like motion; **frame-stepped feel** (24-fps look).
* Zoom is multiplicative; double-click resets.
* Selection = brief **radius pulse** + subtle bloom.
* All randomness **seeded** for reproducibility.

## UI Vocabulary

* Text-first controls: `[ - ] [ + ] [ RESET ]`, pipes `|`, brackets.
* Tooltips single-line, 12–14px, no shadows.

## Accessibility

* **AAA contrast** for text/critical lines.
* Honor `prefers-reduced-motion`; disable twinkle/frame-stepping.
* Full keyboard nav with **1px dashed focus**.
* Screen reader roles for planets; live updates on changes.

## Do / Don’t

**Do:** quantize sizes/motion · dither instead of blur · keep UI sparse, deterministic.
**Don’t:** colorful gradients · drop shadows/neumorphism · >2 dither styles · thick anti-aliased strokes.

## Ship Checklist

* [ ] Monochrome + ≤1 accent
* [ ] ≤2 dither styles; 1px, pixel-aligned
* [ ] Linear/step motion; seeded randomness
* [ ] AAA contrast; keyboard & reduced-motion supported
* [ ] Text legible at 12–14px; clear terminal prompts

<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
