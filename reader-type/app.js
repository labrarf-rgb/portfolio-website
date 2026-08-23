/* Quiz state machine, scoring, and rendering. */

const TRAIT_KEYS = Object.keys(TRAITS);

const el = (id) => document.getElementById(id);
const screens = {
  intro: el("screen-intro"),
  quiz: el("screen-quiz"),
  result: el("screen-result")
};

let index = 0;
let answers = new Array(ITEMS.length).fill(null); // 1 to 5, or null
let lastResult = null;

/* ---------- scoring ---------- */

/* An answer of 3 is neutral and contributes nothing, so responses are centred
   on the midpoint before they are weighted. */
const centred = (value) => value - 3;

function rawScores() {
  const raw = {};
  TRAIT_KEYS.forEach((k) => (raw[k] = 0));
  answers.forEach((value, i) => {
    if (value === null) return;
    const w = ITEMS[i].w;
    Object.keys(w).forEach((k) => (raw[k] += w[k] * centred(value)));
  });
  return raw;
}

/* Scaled 0 to 1 purely for display on the result page. */
function profile(raw) {
  const scaled = {};
  TRAIT_KEYS.forEach((k) => {
    let reach = 0;
    ITEMS.forEach((it) => (reach += Math.abs(it.w[k] || 0) * 2));
    scaled[k] = reach === 0 ? 0.5 : Math.min(1, Math.max(0, (raw[k] + reach) / (2 * reach)));
  });
  return scaled;
}

/* Matching is done on double z-scores.

   Two separate normalizations, for two separate distortions:

   1. Against other respondents. Traits carried by more items produce bigger
      raw numbers. On a five-point scale answered at random, each item
      contributes mean 0 and variance 2 to its traits, and variances add, so
      the population spread is exact rather than simulated.

   2. Against other genres. "High curiosity" only means something relative to
      what the other fifteen genres score.

   The result is then normalized by both vector lengths, which makes it their
   correlation. That last step matters as much as the centering: an
   unnormalized dot product permanently favours whichever genres sit furthest
   from average, because a longer vector yields a bigger product regardless of
   shape. */
function populationStats() {
  const st = {};
  TRAIT_KEYS.forEach((k) => {
    let variance = 0;
    ITEMS.forEach((it) => {
      const w = it.w[k] || 0;
      variance += w * w * 2; // Var of a uniform answer on {-2,-1,0,1,2}
    });
    st[k] = { mean: 0, sd: Math.sqrt(variance) || 1 };
  });
  return st;
}

function genreStats() {
  const st = {};
  TRAIT_KEYS.forEach((k) => {
    const v = GENRES.map((g) => g.v[k] || 0);
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length) || 1;
    st[k] = { mean: m, sd };
  });
  return st;
}

const POP = populationStats();
const GEN = genreStats();

function rawMatch(raw, genre) {
  let dot = 0, nReader = 0, nGenre = 0;
  TRAIT_KEYS.forEach((k) => {
    const zReader = (raw[k] - POP[k].mean) / POP[k].sd;
    const zGenre = ((genre.v[k] || 0) - GEN[k].mean) / GEN[k].sd;
    dot += zReader * zGenre;
    nReader += zReader * zReader;
    nGenre += zGenre * zGenre;
  });
  return nReader && nGenre ? dot / Math.sqrt(nReader * nGenre) : 0;
}

/* Per-genre calibration.

   Some genres sit closer to the middle of the catalog's shape distribution
   than others, and those win far less often through no fault of the reader.
   Uncalibrated, Comic Novels and Horror came up 1.75 times as often as chance
   while Literary Fiction came up 0.58 times as often, which means the catalog
   itself was answering rather than the person.

   So each genre's score is standardized against how that same genre scores for
   a randomly answering reader. What ranks is how far above its own baseline a
   genre lands, not its raw affinity. This is one rule applied identically to
   all sixteen, which is the point: correcting individual genres by hand is how
   an author's taste leaks into everyone else's results.

   The simulation is seeded, so calibration is identical on every machine and
   every run. */
function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function calibrate(samples) {
  const rand = mulberry32(20260822);
  const scores = GENRES.map(() => []);
  for (let n = 0; n < samples; n++) {
    const raw = {};
    TRAIT_KEYS.forEach((k) => (raw[k] = 0));
    ITEMS.forEach((it) => {
      const value = 1 + Math.floor(rand() * 5);
      Object.keys(it.w).forEach((k) => (raw[k] += it.w[k] * centred(value)));
    });
    GENRES.forEach((g, i) => scores[i].push(rawMatch(raw, g)));
  }
  return GENRES.map((g, i) => {
    const v = scores[i];
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) * (b - mean), 0) / v.length) || 1;
    return { mean, sd };
  });
}

const CAL = calibrate(4000);

function match(raw, genre, i) {
  const s = rawMatch(raw, genre);
  return (s - CAL[i].mean) / CAL[i].sd;
}

function rankGenres(raw) {
  return GENRES
    .map((g, i) => ({ genre: g, score: match(raw, g, i) }))
    .sort((a, b) => b.score - a.score);
}

/* ---------- rendering ---------- */

function show(name) {
  Object.entries(screens).forEach(([k, node]) => (node.hidden = k !== name));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderLegend() {
  el("trait-legend").innerHTML = TRAIT_KEYS.map((k) =>
    `<div><dt>${TRAITS[k].label}</dt><dd>${TRAITS[k].blurb}</dd></div>`
  ).join("");
}

function renderItem() {
  const item = ITEMS[index];
  el("progress-label").textContent = `${index + 1} of ${ITEMS.length}`;
  el("progress-fill").style.width = `${(index / ITEMS.length) * 100}%`;
  el("item-kind").textContent = item.mood ? "Right now" : "Generally";
  el("item-text").textContent = item.text;

  el("scale").innerHTML = SCALE.map((s) => `
    <button type="button" class="scale-btn" data-value="${s.value}"
            aria-pressed="${answers[index] === s.value}">
      <span class="scale-key" aria-hidden="true">${s.value}</span>
      <span class="scale-label">${s.label}</span>
    </button>`).join("");

  el("back").disabled = index === 0;
}

function answer(value) {
  answers[index] = value;
  if (index < ITEMS.length - 1) {
    index += 1;
    renderItem();
  } else {
    renderResult();
    show("result");
  }
}

/* Order a genre's books by fit to this particular reader.

   Genre alone is a blunt instrument for the thing people actually care about.
   Literary Fiction contains both Gilead and Never Let Me Go, and a reader who
   said plainly that they need things to come out okay should not be handed the
   bleakest one first purely because it sits in the right bucket. Hope is
   weighted above demand because a book that ends the wrong way for someone is
   a worse miss than one that asks a little too much of them. */
function orderBooks(genre, p) {
  const wantHope = p.hope;
  const wantDemand = p.curiosity; // appetite for work, not intelligence
  return [...genre.books].sort((a, b) => {
    const miss = (x) => Math.abs(x.hope - wantHope) + 0.7 * Math.abs(x.demand - wantDemand);
    return miss(a) - miss(b);
  });
}

function bookList(genre, p) {
  return orderBooks(genre, p).map((b) => `
    <li class="book">
      <div class="book-title">${b.title}</div>
      <div class="book-author">${b.author}</div>
      <p class="book-note">${b.note}</p>
      <a class="book-link" target="_blank" rel="noopener noreferrer"
         href="https://openlibrary.org/search?q=${encodeURIComponent(b.title + " " + b.author)}">Look it up</a>
    </li>`).join("");
}

function renderResult(rawOverride) {
  const raw = rawOverride || rawScores();
  const p = profile(raw);
  const ranked = rankGenres(raw);
  const top = ranked[0].genre;

  lastResult = { raw, ranked };
  resetFeedback();

  /* The address bar becomes the shareable thing, so copying the URL by hand
     works as well as pressing the button. replaceState keeps the back button
     pointing where the reader came from rather than at every result. */
  try { history.replaceState(null, "", "#r=" + encodeResult(raw)); } catch (_) {}

  el("result-name").textContent = top.name;
  el("result-tagline").textContent = top.tagline;
  el("result-why").textContent = top.why;

  /* If the answers sat near neutral, or the top few genres are separated by
     almost nothing, say so. Every quiz can name a winner; not every set of
     answers actually supports one, and presenting a coin toss as a reading of
     someone is the failure mode worth avoiding. */
  const gap = ranked[0].score - ranked[1].score;
  const weak = ranked[0].score < 1.1 || gap < 0.12; // p10 of top scores is 1.17
  el("result-confidence").hidden = !weak;
  if (weak) {
    el("result-confidence").textContent = ranked[0].score < 1.1
      ? "Your answers sat close to the middle on most things, so this is a soft match rather than a strong one. The two below are nearly as close, and worth a look."
      : "This one edged out the next by very little, so treat all three below as roughly equal suggestions.";
  }

  el("books").innerHTML = bookList(top, p);

  /* Deliberately no percentage. Scores across sixteen genres sit close
     together, so a number would be fake precision. Rank is the honest report.
     Each runner-up opens to its own shelf, because a reader who sits between
     two genres wants both lists, not a label saying they were nearly something
     else. <details> gets keyboard support and screen reader semantics free. */
  const places = ["Second closest", "Third closest"];
  el("runners").innerHTML = ranked.slice(1, 3).map((r, i) => `
    <details class="runner">
      <summary class="runner-head">
        <span class="runner-name">${r.genre.name}</span>
        <span class="runner-match">${places[i]}</span>
      </summary>
      <div class="runner-body">
        <p class="runner-tagline">${r.genre.tagline}</p>
        <ul class="books" role="list">${bookList(r.genre, p)}</ul>
      </div>
    </details>`).join("");

  el("traits").innerHTML = TRAIT_KEYS.map((k) => {
    const pct = Math.round(p[k] * 100);
    return `
      <div class="trait-row">
        <div class="trait-head">
          <span class="trait-name">${TRAITS[k].label}</span>
          <span class="trait-score">${pct}</span>
        </div>
        <div class="trait-track" role="img" aria-label="${TRAITS[k].label}: ${pct} out of 100">
          <div class="trait-fill" style="width:${pct}%"></div>
        </div>
        <p class="trait-blurb">${TRAITS[k].blurb}</p>
      </div>`;
  }).join("");
}

/* ---------- sharing ----------

   A result is just ten small integers, so it fits in the URL rather than
   needing anything stored. Every trait lands within -8 to +8, which shifted by
   18 sits inside a single base36 digit, so a whole profile is ten characters
   after a version marker. The marker is there so an old link can be rejected
   cleanly if the trait list ever changes, rather than silently decoding into
   the wrong person. */

const SHARE_VERSION = "1";
const SHARE_OFFSET = 18;

function encodeResult(raw) {
  return SHARE_VERSION + TRAIT_KEYS.map((k) => {
    const v = Math.round(raw[k] || 0) + SHARE_OFFSET;
    return Math.min(35, Math.max(0, v)).toString(36);
  }).join("");
}

/* The furthest a trait can actually travel, used to reject a hand-edited link
   rather than render a profile the quiz could never have produced. */
function traitReach(key) {
  let reach = 0;
  ITEMS.forEach((it) => (reach += Math.abs(it.w[key] || 0) * 2));
  return reach;
}

function decodeResult(code) {
  if (!code || code[0] !== SHARE_VERSION) return null;
  const body = code.slice(1);
  if (body.length !== TRAIT_KEYS.length) return null;
  const raw = {};
  for (let i = 0; i < TRAIT_KEYS.length; i += 1) {
    const key = TRAIT_KEYS[i];
    const n = parseInt(body[i], 36);
    if (Number.isNaN(n)) return null;
    const value = n - SHARE_OFFSET;
    if (Math.abs(value) > traitReach(key)) return null;
    raw[key] = value;
  }
  return raw;
}

function shareUrl(raw) {
  return location.origin + location.pathname + "#r=" + encodeResult(raw);
}

function resultAsText(raw) {
  const p = profile(raw);
  const ranked = rankGenres(raw);
  const top = ranked[0].genre;
  const lines = [];
  lines.push("READER TYPE");
  lines.push("");
  lines.push("Your closest match: " + top.name);
  lines.push(top.tagline);
  lines.push("");
  lines.push("START HERE");
  orderBooks(top, p).forEach((b, i) => {
    lines.push((i + 1) + ". " + b.title + ", " + b.author);
    lines.push("   " + b.note);
  });
  lines.push("");
  lines.push("ALSO CLOSE");
  ranked.slice(1, 3).forEach((r) => {
    lines.push(r.genre.name);
    orderBooks(r.genre, p).forEach((b) => lines.push("   " + b.title + ", " + b.author));
  });
  lines.push("");
  lines.push("YOUR PROFILE");
  TRAIT_KEYS.forEach((k) => {
    const pct = Math.round(p[k] * 100);
    lines.push("   " + (TRAITS[k].label + "            ").slice(0, 13) +
      String(pct).padStart(3) + "  " + "|".repeat(Math.round(pct / 5)));
  });
  lines.push("");
  lines.push("Your result: " + shareUrl(raw));
  lines.push("Take it yourself: " + location.origin + location.pathname);
  return lines.join("\n");
}

function flash(message) {
  const node = el("share-status");
  node.textContent = message;
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => { node.textContent = ""; }, 4000);
}

/* Clipboard writes fail in more situations than they succeed in some setups:
   no secure context when the file is opened straight off disk, no user
   activation, or a browser that simply refuses. Telling someone to copy it
   manually is useless on its own, so a failure puts the text on the page,
   selected, where they can actually copy it. */
function copyText(text, okMessage) {
  const showManually = () => {
    const box = el("share-fallback");
    box.value = text;
    box.hidden = false;
    box.focus();
    box.select();
    flash("Could not copy automatically. The text is selected below, copy it from there.");
  };
  el("share-fallback").hidden = true;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => flash(okMessage), showManually);
  } else {
    showManually();
  }
}

/* ---------- events ---------- */

function begin() {
  index = 0;
  answers = new Array(ITEMS.length).fill(null);
  el("shared-banner").hidden = true;
  try { history.replaceState(null, "", location.pathname); } catch (_) {}
  renderItem();
  show("quiz");
}

el("start").addEventListener("click", begin);
el("restart").addEventListener("click", begin);

el("scale").addEventListener("click", (e) => {
  const btn = e.target.closest(".scale-btn");
  if (btn) answer(Number(btn.dataset.value));
});

el("back").addEventListener("click", () => {
  if (index > 0) { index -= 1; renderItem(); }
});

el("copy-link").addEventListener("click", () => {
  if (lastResult) copyText(shareUrl(lastResult.raw), "Link copied.");
});

el("copy-text").addEventListener("click", () => {
  if (lastResult) copyText(resultAsText(lastResult.raw), "Result copied.");
});

el("download").addEventListener("click", () => {
  if (!lastResult) return;
  const name = rankGenres(lastResult.raw)[0].genre.id;
  const blob = new Blob([resultAsText(lastResult.raw)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reader-type-" + name + ".txt";
  a.click();
  URL.revokeObjectURL(url);
  flash("Downloaded.");
});

el("take-it").addEventListener("click", begin);

document.addEventListener("keydown", (e) => {
  if (screens.quiz.hidden) return;
  if (e.key >= "1" && e.key <= "5") { e.preventDefault(); answer(Number(e.key)); }
  if (e.key === "Backspace" && index > 0) { e.preventDefault(); index -= 1; renderItem(); }
});

/* ---------- theme ---------- */

const toggle = el("theme-toggle");
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  toggle.textContent = theme === "dark" ? "Light" : "Dark";
  toggle.setAttribute("aria-pressed", String(theme === "dark"));
  try { localStorage.setItem("readertype-theme", theme); } catch (_) {}
}
let saved = "light";
try { saved = localStorage.getItem("readertype-theme") || "light"; } catch (_) {}
setTheme(saved);
toggle.addEventListener("click", () => {
  setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* ---------- feedback capture ----------

   The genre vectors in data.js are hand-authored guesses. The only way out of
   guessing is real responses, so each verdict stores the reader's raw trait
   scores alongside what the model said and what they say is actually right.
   That is exactly the shape needed to fit the vectors later instead of
   inventing them.

   Local only. It writes to localStorage and nothing else, so no network call
   exists to review, and the reader can export or delete the lot. */

const STORE_KEY = "readertype-responses";

function loadResponses() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch (_) { return []; }
}

function saveResponses(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
  catch (_) { return false; }
}

function resetFeedback() {
  el("correction").hidden = true;
  el("feedback-status").textContent = "";
  [...el("verdicts").querySelectorAll("button")].forEach((b) =>
    b.removeAttribute("aria-pressed"));
  renderStoredCount();
}

function renderStoredCount() {
  const n = loadResponses().length;
  el("feedback-data").hidden = n === 0;
  if (n > 0) {
    el("feedback-status").textContent =
      `${n} response${n === 1 ? "" : "s"} saved in this browser.`;
  }
}

function recordVerdict(verdict) {
  if (!lastResult) return;
  const list = loadResponses();
  list.push({
    at: new Date().toISOString(),
    raw: lastResult.raw,
    predicted: lastResult.ranked.slice(0, 3).map((r) => r.genre.id),
    verdict,
    actual: null
  });
  const ok = saveResponses(list);
  el("feedback-status").textContent = ok
    ? "Saved. Thank you."
    : "Could not save. This browser is blocking local storage.";
  el("correction").hidden = verdict === "yes";
  renderStoredCount();
}

function recordCorrection(genreId) {
  const list = loadResponses();
  if (!list.length) return;
  list[list.length - 1].actual = genreId || null;
  saveResponses(list);
  el("feedback-status").textContent = genreId
    ? "Saved, with your correction. Thank you."
    : "Saved.";
}

el("verdicts").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-verdict]");
  if (!btn) return;
  [...el("verdicts").querySelectorAll("button")].forEach((b) =>
    b.setAttribute("aria-pressed", String(b === btn)));
  recordVerdict(btn.dataset.verdict);
});

el("actual-genre").addEventListener("change", (e) => recordCorrection(e.target.value));

el("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(loadResponses(), null, 2)],
    { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reader-type-responses.json";
  a.click();
  URL.revokeObjectURL(url);
});

el("clear").addEventListener("click", () => {
  const n = loadResponses().length;
  if (!n) return;
  if (!window.confirm(`Delete all ${n} saved responses? This cannot be undone.`)) return;
  try { localStorage.removeItem(STORE_KEY); } catch (_) {}
  el("feedback-status").textContent = "Deleted.";
  el("feedback-data").hidden = true;
});

function renderGenreOptions() {
  el("actual-genre").innerHTML =
    `<option value="">Pick one</option>` +
    [...GENRES].sort((a, b) => a.name.localeCompare(b.name))
      .map((g) => `<option value="${g.id}">${g.name}</option>`).join("");
}

renderGenreOptions();
renderLegend();

/* A shared link opens on the result it encodes. An unreadable or outdated code
   falls through to the intro rather than erroring, since a bad link should look
   like an ordinary visit. */
(function openSharedResult() {
  const match = /^#r=([0-9a-z]+)$/i.exec(location.hash || "");
  if (!match) return;
  const raw = decodeResult(match[1]);
  if (!raw) { try { history.replaceState(null, "", location.pathname); } catch (_) {} return; }
  renderResult(raw);
  el("shared-banner").hidden = false;
  show("result");
})();
