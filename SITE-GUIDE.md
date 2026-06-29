# Portfolio Website - Site Guide & Session Notes

> Hand this file to an AI agent (or read it yourself) for fast, complete context
> on this site: what it is, how it works, what is on each page, the formatting
> and voice conventions, and the exact playbook for adding a project or editing
> existing pages. Keep it current: when the site changes, update the relevant
> section and add a dated entry to the Session Log at the bottom.
>
> House rule, applies everywhere: NO em dashes in any copy. This file avoids them
> too. Use commas, colons, periods, or parentheses instead.

---

## 1. What this is

Ray Labra's personal portfolio site (Product Manager). It introduces Ray and
showcases a handful of self-built web apps, each with a written case study and a
live, embedded demo.

- **Live URL:** https://www.labrarf.com (the `CNAME` file pins this domain)
- **Host:** GitHub Pages, repo `labrarf-rgb/portfolio-website`, branch `main`
- **Deploy:** push to `main` and GitHub Pages publishes it. There is no build
  step and no CI. A CDN sits in front, so CSS or HTML changes can take a minute
  and may need a hard refresh (Cmd+Shift+R) to show.

## 2. How it works (stack)

Plain static site. No framework, no bundler, no dependencies, no package.json.
Just hand-written HTML files that share one stylesheet and one script.

- **`styles.css`** - all styling for every page. Design tokens are CSS variables
  on `:root` (light) and `[data-theme="dark"]` (dark). Fonts are Google Fonts
  `Raleway` (display) and `Nunito` (body), imported at the top of the file.
- **`script.js`** - two behaviors, loaded at the bottom of every page:
  1. **Theme toggle.** Reads/writes `localStorage["theme"]`, sets
     `data-theme` on `<html>`. The toggle button is `#theme-toggle`.
  2. **Contact form.** Intercepts `#contact-form` submit and POSTs to Formspree
     (`https://formspree.io/f/mlgvpwqy`). Only present on `index.html`.
- **Embedding apps.** Each showcased app is its own separately hosted site. The
  portfolio embeds it through a thin full-screen `iframe` wrapper page (see the
  two-page-per-project pattern below). The portfolio does not contain the apps.

## 3. The two-page-per-project pattern

Every project is exactly two files:

1. **`<slug>.html`** - the case study. Shares the header, stylesheet, and script.
   Human-readable writeup of the project.
2. **`<slug>-app.html`** - the embed. A minimal page that is nothing but a
   full-screen `iframe` pointing at the live app. Opened in a new tab from the
   case study's "Open app" buttons.

The embed page is tiny and identical across projects except for `<title>`, the
`iframe src`, and the `iframe title`. Copy an existing one to make a new one.

## 4. File inventory

| File | Purpose |
| --- | --- |
| `index.html` | Home page: About, Featured Projects (2-up grid), Contact form |
| `projects.html` | All Projects: a vertical list of every project, newest first |
| `estoria.html` | Case study: Estoria |
| `estoria-app.html` | Embed: Estoria |
| `unifycrm.html` / `unifycrm-app.html` | Case study + embed: UnifyCRM |
| `drifts-calculator.html` / `drifts-calculator-app.html` | Case study + embed: DRIFTS Calculator |
| `customer-health-score.html` / `customer-health-score-app.html` | Case study + embed: Customer Health Score Dashboard |
| `styles.css` | Shared styles + design tokens |
| `script.js` | Shared theme toggle + contact form |
| `CNAME` | Custom domain (`www.labrarf.com`) |
| `Backup and Archives/` | Old versions. Ignore for edits. |

## 5. Page anatomy

### Shared header (every page)
Sticky bar inside `.nav-container`: the "Ray Labra" logo on the left (a plain
`<span>` on the home page, an `<a href="index.html">` on subpages), then
`.header-actions` on the right with a Projects icon link, a LinkedIn link, and
the `#theme-toggle` button. The two theme SVGs (`#moon-icon`, `#sun-icon`) are
swapped by CSS based on `data-theme`. `index.html` also has a `.skip-link`.

### `index.html`
- `#about` section: `section-label` "About", `h1` (positioning statement),
  `p.tagline`, an intro `p`, an `h2` "Why this combination works", and a bulleted
  list of strengths.
- `#projects` section: `section-label` "Work", `h2` "Featured Projects", a
  `.grid` of `a.card-link > .card` (each card is `h3` + `p`), and a
  `.view-all-link` to `projects.html`. Keep the featured grid to two cards (it is
  a 2-up grid); rotate which projects are featured rather than overfilling it.
- `#contact` section: `section-label` "Contact", `h2`, and the Formspree form.

### `projects.html`
One `.section` with `section-label` "Work", `h1` "All Projects", an intro `p`,
then a `.project-list` of `.project-list-item` blocks. Each item is:
`.project-meta` (tags) + `h3` (name) + `p` (description) + `a.project-item-link`
("View project") to the case study. Order is newest first (top).

### Case study (`<slug>.html`)
Order of elements inside `<main class="container">`:
1. `<section class="section">` containing, in order:
   - `a.back-link` to `index.html` ("Back to portfolio")
   - `span.section-label` ("Featured Project")
   - `h1` (project name)
   - `div.project-meta` with 3 to 4 `span.project-tag`
   - `a.btn.btn-top` ("Open app") to `<slug>-app.html`, `target="_blank"`
   - intro paragraphs (the personal "why I built this" story first)
   - one or more `h2` sub-headings, each followed by `p` and/or `ul`
2. `<section class="embed-section">` ("Live Demo" / `h2` "Try it yourself") with a
   closing `p` and a second `a.btn` ("Open app") to `<slug>-app.html`.

Both "Open app" buttons use the external-link SVG and `target="_blank"`.

### Embed page (`<slug>-app.html`)
A self-contained page with inline `<style>` that makes a single `<iframe>` fill
the viewport (`width/height: 100%`, no border, `overflow: hidden`). Only the
`<title>`, `iframe src`, and `iframe title` change between projects.

## 6. Formatting and voice conventions (how Ray likes it)

- **No em dashes. Ever.** Hard rule across all copy. Use commas, colons,
  periods, or parentheses.
- **First person and personal.** Case studies open with Ray's own reason for
  building the thing (a real problem he hit) before explaining what it does.
- **Honest, concrete, low-hype.** Describe what it does and how it works. Only
  claim features that are actually shipped. If something is planned but not built,
  do not imply it exists.
- **Section labels** are short uppercase eyebrow text (`.section-label`), e.g.
  "Featured Project", "Work", "Live Demo".
- **Headings.** `h1` is the page/project title. `h2` is a section sub-heading.
  `h3` is either an uppercase mini-label or a project-card/list title depending
  on context (the CSS handles both).
- **Feature lists.** Each `<li>` leads with a bolded lead-in then a sentence:
  `<li><strong>Lead-in.</strong> Explanation sentence.</li>`
- **Tags.** 3 to 4 `span.project-tag` per project (uppercased by CSS). Typical
  mix: a type ("Prototype"), a domain ("Writing Tool", "Nonprofit"), "Web App",
  and a stack tag ("React", "Vanilla JS").
- **Spacing.** `styles.css` gives any `h2` that follows a `p` or `ul` extra top
  margin (`p + h2, ul + h2`), so section sub-headings are not cramped against the
  paragraph above. Do not hand-add margins for this; the rule covers it.
- **Keep blurbs consistent.** A project's one-line description can appear in up to
  three places (index card, projects.html item, case study intro). Keep them in
  agreement when you edit one.

## 7. Playbook: add a new project

1. **Choose a slug** in kebab-case, e.g. `estoria`.
2. **Create `<slug>-app.html`.** Copy any existing `*-app.html`, then change the
   `<title>`, the `iframe src` (the live app's URL), and the `iframe title`.
3. **Create `<slug>.html`.** Copy the most recent case study (`estoria.html` is
   the current reference) and update: `<title>`, `h1`, the `project-meta` tags,
   both "Open app" hrefs to `<slug>-app.html`, the intro story, the `h2`
   sections, and the closing `embed-section` copy.
4. **List it on `projects.html`.** Add a new `.project-list-item` at the top
   (newest first): `.project-meta` + `h3` + `p` + `a.project-item-link` to
   `<slug>.html`.
5. **(Optional) Feature it on `index.html`.** Add an `a.card-link > .card`
   (`h3` + `p`) to the Featured Projects `.grid`. Because the grid is 2-up, drop
   or rotate an existing card rather than letting it overflow.
6. **Check:** no em dashes, all links resolve, theme toggle still works.
7. **Deploy:** commit and push to `main`.

## 8. Playbook: edit an existing page

- Copy is inline in each HTML file. Shared look is in `styles.css`; shared
  behavior is in `script.js`. A style change in `styles.css` affects every page.
- When changing a project's description, update all the places it appears (see
  the consistency note in section 6).
- Re-check the no-em-dash rule on anything you touch.

## 9. Deploy

```bash
git add <files>
git commit -m "..."
git push origin main
```

GitHub Pages publishes `main` to www.labrarf.com automatically. If a CSS change
does not show, hard refresh (Cmd+Shift+R) or wait for the CDN to flush.

## 10. Project registry (current)

| Slug | Title | Live app URL | Featured on home? |
| --- | --- | --- | --- |
| `estoria` | Estoria | https://labrarf-rgb.github.io/estoria/ | Yes |
| `unifycrm` | UnifyCRM | https://unifycrm.vercel.app/ | Yes |
| `drifts-calculator` | DRIFTS Calculator | https://labrarf-rgb.github.io/drifts-calculator/ | No |
| `customer-health-score` | Customer Health Score Dashboard | https://labrarf-rgb.github.io/customer-health-score/ | No |

All four appear on `projects.html`. Featured on the home page is currently
Estoria and UnifyCRM only.

---

## 11. Session Log

Newest entries at the bottom.

### 2026-06-28 - Added Estoria; spacing fix; copy accuracy; this guide

- **Added the Estoria project.** New `estoria.html` (case study) and
  `estoria-app.html` (embed of https://labrarf-rgb.github.io/estoria/). Added a
  featured card on `index.html` and a list item on `projects.html`.
- **Featured grid trimmed.** Dropped DRIFTS Calculator from the home page
  Featured Projects so the 2-up grid is Estoria + UnifyCRM. DRIFTS still lives on
  `projects.html` and keeps its own case study.
- **Estoria intro voice.** Reframed the case study opener around the real origin
  story (keeping track of characters, worlds, timelines, and ideas across a
  complex story and when returning to it after time away). Opens with "I'm also a
  writer". Structure is described via well-known story-structure methods rather
  than naming a specific scene method.
- **Section-heading spacing.** Added `p + h2, ul + h2 { margin-top: 2.75rem }` to
  `styles.css` so section sub-headings that follow body copy or a list are not
  cramped. Applies site wide (DRIFTS, Estoria, Customer Health Score, UnifyCRM).
- **Copy accuracy.** Removed claims that Estoria exports Obsidian-ready markdown
  (not shipped yet). Replaced with the capability that is real today: AI-assisted
  import of an existing draft (run Estoria's prompt through ChatGPT/Claude/Gemini,
  drop the returned file in). Updated in the case study, home card, and projects
  item. The "How it's built" line now says you can save a project to a file.
- **Created this guide** (`SITE-GUIDE.md`) as the context doc for future edits.
