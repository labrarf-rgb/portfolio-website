/* Quiz state machine, scoring, and rendering.

   The scoring here is the same machinery its sibling app arrived at after
   three rewrites: double z-scoring against both the population and the
   catalog, correlation rather than dot product, and a seeded per-form
   calibration so no form wins through geometry. What changed is only what is
   being ranked. */

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
    const reach = traitReach(k);
    scaled[k] = reach === 0 ? 0.5 : Math.min(1, Math.max(0, (raw[k] + reach) / (2 * reach)));
  });
  return scaled;
}

/* Two separate normalizations, for two separate distortions.

   1. Against other respondents. Traits carried by more items produce bigger
      raw numbers. On a five-point scale answered at random each item
      contributes mean 0 and variance 2 to its traits, and variances add, so
      the population spread is exact rather than simulated.

   2. Against other forms. "High repetition" only means something relative to
      what the other twenty three forms score.

   The result is normalized by both vector lengths, which makes it their
   correlation. That step matters as much as the centering: an unnormalized dot
   product permanently favours whichever forms sit furthest from average,
   because a longer vector yields a bigger product regardless of shape. */
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

function formStats() {
  const st = {};
  TRAIT_KEYS.forEach((k) => {
    const v = FORMS.map((f) => f.v[k] || 0);
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length) || 1;
    st[k] = { mean: m, sd };
  });
  return st;
}

const POP = populationStats();
const FRM = formStats();

function rawMatch(raw, form) {
  let dot = 0, nReader = 0, nForm = 0;
  TRAIT_KEYS.forEach((k) => {
    const zReader = (raw[k] - POP[k].mean) / POP[k].sd;
    const zForm = ((form.v[k] || 0) - FRM[k].mean) / FRM[k].sd;
    dot += zReader * zForm;
    nReader += zReader * zReader;
    nForm += zForm * zForm;
  });
  return nReader && nForm ? dot / Math.sqrt(nReader * nForm) : 0;
}

/* Per-form calibration.

   Some forms sit closer to the middle of the catalog's shape distribution than
   others, and those win far less often through no fault of the reader. So each
   form's score is standardized against how that same form scores for a
   randomly answering reader, and what ranks is how far above its own baseline
   a form lands rather than its raw affinity.

   One rule applied identically to all twenty four, which is the point.
   Correcting individual forms by hand is how an author's taste leaks into
   everyone else's results. The simulation is seeded, so calibration is
   identical on every machine and every run. */
function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function calibrate(samples) {
  const rand = mulberry32(20260827);
  const scores = FORMS.map(() => []);
  for (let n = 0; n < samples; n++) {
    const raw = {};
    TRAIT_KEYS.forEach((k) => (raw[k] = 0));
    ITEMS.forEach((it) => {
      const value = 1 + Math.floor(rand() * 5);
      Object.keys(it.w).forEach((k) => (raw[k] += it.w[k] * centred(value)));
    });
    FORMS.forEach((f, i) => scores[i].push(rawMatch(raw, f)));
  }
  return FORMS.map((f, i) => {
    const v = scores[i];
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) * (b - mean), 0) / v.length) || 1;
    return { mean, sd };
  });
}

const CAL = calibrate(4000);

function match(raw, form, i) {
  const s = rawMatch(raw, form);
  return (s - CAL[i].mean) / CAL[i].sd;
}

function rankForms(raw) {
  return FORMS
    .map((f, i) => ({ form: f, score: match(raw, f, i) }))
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

/* Order a form's poems to this particular reader.

   A form is a shape, not a mood: the villanelle holds both "Do not go gentle"
   and "The Waking", and someone who said plainly that they would rather not be
   wrecked should not be handed the bleakest one first purely because it sits
   in the right bucket. `light` is weighted above `demand` for the same reason
   its sibling weights hope above demand: a poem that lands the wrong way
   emotionally is a worse miss than one that asks slightly too much.

   Wanting to be moved is read as wanting less consolation, which is what the
   feeling item actually says. Appetite for work comes from constraint, since
   that is the trait about enjoying something difficult on purpose. */
function orderPoems(form, p) {
  const wantLight = 1 - p.feeling;
  const wantDemand = p.constraint;
  return [...form.poems].sort((a, b) => {
    const miss = (x) => Math.abs(x.light - wantLight) + 0.7 * Math.abs(x.demand - wantDemand);
    return miss(a) - miss(b);
  });
}

function poemList(form, p) {
  return orderPoems(form, p).map((poem) => `
    <li class="poem">
      <div class="poem-title">${poem.title}</div>
      <div class="poem-poet">${poem.poet}</div>
      <p class="poem-note">${poem.note}</p>
      <a class="poem-link" target="_blank" rel="noopener noreferrer"
         href="https://openlibrary.org/search?q=${encodeURIComponent(poem.title + " " + poem.poet)}">Look it up</a>
    </li>`).join("");
}

function familyMates(form) {
  return FORMS.filter((f) => f.family === form.family && f.id !== form.id);
}

function renderResult(rawOverride) {
  const raw = rawOverride || rawScores();
  const p = profile(raw);
  const ranked = rankForms(raw);
  const top = ranked[0].form;

  lastResult = { raw, ranked };
  resetFeedback();

  /* The address bar becomes the shareable thing, so copying the URL by hand
     works as well as pressing the button. replaceState keeps the back button
     pointing where the reader came from rather than at every result. */
  try { history.replaceState(null, "", "#r=" + encodeResult(raw)); } catch (_) {}

  el("result-name").textContent = top.name;
  el("result-tagline").textContent = top.tagline;
  el("result-why").textContent = top.why;

  /* If the answers sat near neutral, or the top forms are separated by almost
     nothing, say so. Every quiz can name a winner; not every set of answers
     supports one, and presenting a coin toss as a reading of someone is the
     failure mode worth avoiding. With twenty four forms the shelf below is
     doing more of the work anyway, so the hedge points at it. */
  const gap = ranked[0].score - ranked[1].score;
  /* Thresholds measured against this catalog rather than inherited. Twenty
     four forms crowd the top more than sixteen genres did, so the gap between
     first and second is naturally smaller: the sibling app's 0.12 fires on 31%
     of random responses here, which is a hedge frequent enough to be noise.
     These sit near the fifth percentile of top scores and the tenth of gaps,
     and fire together on about 15%. */
  const weak = ranked[0].score < 1.15 || gap < 0.04;
  el("result-confidence").hidden = !weak;
  if (weak) {
    el("result-confidence").textContent = ranked[0].score < 1.1
      ? "Your answers sat close to the middle on most things, so this is a soft match rather than a strong one. Treat the shelf below as the real answer."
      : "This one edged out the next by very little. The shelf below is close enough that any of the top few would be a fair place to start.";
  }

  el("poems").innerHTML = poemList(top, p);

  el("rules-text").textContent = top.rules;
  el("prompt-text").textContent = top.prompt;
  el("form-note").hidden = !top.note;
  if (top.note) el("form-note").textContent = top.note;

  /* The family is the honest answer to "what else is like this", and it is not
     the same question as the ranking. Two forms can score adjacently while
     having nothing in common, so the neighbours are named structurally rather
     than by score. */
  const fam = FAMILIES[top.family];
  const mates = familyMates(top);
  el("family-name").textContent = fam.label;
  el("family-blurb").textContent = fam.blurb;
  el("family-mates").innerHTML = mates.map((f) =>
    `<li><span class="mate-name">${f.name}</span> <span class="mate-line">${f.tagline}</span></li>`
  ).join("");

  /* A shelf of five rather than a single crowned answer, because one form out
     of twenty four is a narrow thing to hand someone who is trying to find out
     what they like. Ranks two to five open into their own poems. Deliberately
     no percentage: scores across twenty four forms sit close together, so a
     number would be fake precision. Rank is the honest report. */
  el("shelf").innerHTML = ranked.slice(1, 5).map((r, i) => `
    <details class="runner">
      <summary class="runner-head">
        <span class="runner-rank">${i + 2}</span>
        <span class="runner-name">${r.form.name}</span>
        <span class="runner-family">${FAMILIES[r.form.family].label}</span>
      </summary>
      <div class="runner-body">
        <p class="runner-tagline">${r.form.tagline}</p>
        <p class="runner-rules"><strong>How it works.</strong> ${r.form.rules}</p>
        <ul class="poems" role="list">${poemList(r.form, p)}</ul>
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

   A result is ten small integers, so it fits in the URL rather than needing
   anything stored. Every trait lands within -8 to +8, which shifted by 18 sits
   inside a single base36 digit, so a whole profile is ten characters after a
   version marker. The marker is there so an old link can be rejected cleanly
   if the trait list ever changes, rather than silently decoding into the wrong
   person. */

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
  const ranked = rankForms(raw);
  const top = ranked[0].form;
  const lines = [];
  lines.push("POEM TYPE");
  lines.push("");
  lines.push("Your closest form: " + top.name);
  lines.push(top.tagline);
  lines.push("");
  lines.push("START HERE");
  orderPoems(top, p).forEach((poem, i) => {
    lines.push((i + 1) + ". " + poem.title + ", " + poem.poet);
    lines.push("   " + poem.note);
  });
  lines.push("");
  lines.push("IF YOU EVER WANT TO WRITE ONE");
  lines.push("   " + top.rules);
  lines.push("   Try this: " + top.prompt);
  lines.push("");
  lines.push("THE REST OF THE SHELF");
  ranked.slice(1, 5).forEach((r, i) => {
    lines.push("   " + (i + 2) + ". " + r.form.name + " - " + r.form.tagline);
  });
  lines.push("");
  lines.push("ITS FAMILY: " + FAMILIES[top.family].label);
  familyMates(top).forEach((f) => lines.push("   " + f.name));
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
  const name = rankForms(lastResult.raw)[0].form.id;
  const blob = new Blob([resultAsText(lastResult.raw)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "poem-type-" + name + ".txt";
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

/* The site stores its theme under "theme", and this app is part of that site,
   so it reads and writes the same key. Someone who picked dark on labrarf.com,
   or in the sibling quiz, arrives here already in dark. */
const toggle = el("theme-toggle");
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  toggle.setAttribute("aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  toggle.setAttribute("aria-pressed", String(theme === "dark"));
  try { localStorage.setItem("theme", theme); } catch (_) {}
}
let saved = "light";
try { saved = localStorage.getItem("theme") || "light"; } catch (_) {}
setTheme(saved);
toggle.addEventListener("click", () => {
  setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* ---------- feedback capture ----------

   The register values in these vectors are judgment calls, and the only way
   out of guessing is real responses, so each verdict stores the reader's raw
   trait scores alongside what the model said and what they say is actually
   right. That is the shape needed to fit them later instead of inventing them.

   Local only. It writes to localStorage and nothing else, so no network call
   exists to review, and the reader can export or delete the lot. */

const STORE_KEY = "poemtype-responses";

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
    predicted: lastResult.ranked.slice(0, 5).map((r) => r.form.id),
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

function recordCorrection(formId) {
  const list = loadResponses();
  if (!list.length) return;
  list[list.length - 1].actual = formId || null;
  saveResponses(list);
  el("feedback-status").textContent = formId
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

el("actual-form").addEventListener("change", (e) => recordCorrection(e.target.value));

el("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(loadResponses(), null, 2)],
    { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "poem-type-responses.json";
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

/* Grouped by family, because twenty four names in one flat alphabetical list
   is a worse thing to search than seven short lists. */
function renderFormOptions() {
  el("actual-form").innerHTML =
    `<option value="">Pick one</option>` +
    Object.keys(FAMILIES).map((key) => {
      const inFamily = FORMS.filter((f) => f.family === key)
        .sort((a, b) => a.name.localeCompare(b.name));
      return `<optgroup label="${FAMILIES[key].label}">` +
        inFamily.map((f) => `<option value="${f.id}">${f.name}</option>`).join("") +
        `</optgroup>`;
    }).join("");
}

renderFormOptions();
renderLegend();

/* A shared link opens on the result it encodes. An unreadable or outdated code
   falls through to the intro rather than erroring, since a bad link should look
   like an ordinary visit. */
(function openSharedResult() {
  const found = /^#r=([0-9a-z]+)$/i.exec(location.hash || "");
  if (!found) return;
  const raw = decodeResult(found[1]);
  if (!raw) { try { history.replaceState(null, "", location.pathname); } catch (_) {} return; }
  renderResult(raw);
  el("shared-banner").hidden = false;
  show("result");
})();
