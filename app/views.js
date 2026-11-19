/* Sunset Platinum — view renderers.
   Pure DOM building from the trophy data and the saved state. */

export const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  online: "Online",
};

export const ROADMAP_STAGES = [
  { n: 1, title: "Play the story", blurb: "Chapters 1–4, the named missions and the final mission. Story trophies pop as you play — just keep the main missions moving." },
  { n: 2, title: "Strangers & side strands", blurb: "Andy, Kenton, Billy, Randy and Tyrone, plus 8 stranger strands across Leonida. Clear strands between story missions." },
  { n: 3, title: "Activities & races", blurb: "Races, fishing, the arcade, meditation spots and the cocktail on Ocean Beach. Sample everything once for Master of None." },
  { n: 4, title: "One-shot feats — do these before cleanup", blurb: "The 14 missable trophies. Each needs one clean attempt, so plan it, save first where the game allows, and retry on a miss." },
  { n: 5, title: "Collectibles & long counts", blurb: "Cards, WAiNK spots, vehicles, areas, garages, the shooting range and the money goals. The grind stage — chip away while exploring." },
  { n: 6, title: "100% Completion & platinum", blurb: "A Long Road, then Vice Got a Price! pops on its own once the other 54 are earned." },
];

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function spoilerHidden(trophy, state) {
  return state.settings.spoiler && trophy.kind === "story" && !state.earned[trophy.id];
}

export function displayName(trophy, state) {
  return spoilerHidden(trophy, state) ? "Hidden story trophy" : trophy.name;
}

export function displayDescription(trophy, state) {
  return spoilerHidden(trophy, state)
    ? "Name and description hidden until earned — spoiler setting is on."
    : trophy.description;
}

export function trophyMatches(trophy, filters, state) {
  if (filters.kind !== "all" && trophy.kind !== filters.kind) return false;
  if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
  if (filters.only === "missing" && state.earned[trophy.id]) return false;
  if (filters.only === "earned" && !state.earned[trophy.id]) return false;
  if (filters.only === "missable" && !trophy.missable) return false;
  if (filters.q) {
    const hay = (trophy.name + " " + trophy.description + " " + trophy.guide).toLowerCase();
    if (!hay.includes(filters.q.toLowerCase())) return false;
  }
  return true;
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function renderTrophyRow(trophy, state, selectedId) {
  const row = el("li", "trophy-row" + (state.earned[trophy.id] ? " earned" : "") + (trophy.id === selectedId ? " selected" : ""));
  row.dataset.id = String(trophy.id);
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = !!state.earned[trophy.id];
  check.setAttribute("aria-label", "Earned: " + trophy.name);
  check.addEventListener("click", (ev) => ev.stopPropagation());
  row.appendChild(check);
  const body = el("div");
  const name = el("div", "trophy-name" + (spoilerHidden(trophy, state) ? " spoiler-hidden" : ""), displayName(trophy, state));
  const desc = el("div", "trophy-desc", displayDescription(trophy, state));
  const meta = el("div", "trophy-meta");
  const gradeChip = el("span", "chip grade-" + trophy.grade, gradeLabel(trophy.grade));
  meta.appendChild(gradeChip);
  meta.appendChild(el("span", "chip", KIND_LABELS[trophy.kind] || trophy.kind));
  if (trophy.missable && trophy.kind !== "missable") meta.appendChild(el("span", "chip missable", "MISSABLE"));
  if (trophy.targetLabel) meta.appendChild(el("span", "chip target", "Target: " + trophy.targetLabel));
  if (state.notes[trophy.id]) meta.appendChild(el("span", "chip", "Note saved"));
  body.append(name, desc, meta);
  row.appendChild(body);
  const dot = el("span", "grade-dot " + trophy.grade);
  dot.title = gradeLabel(trophy.grade);
  row.appendChild(dot);
  return row;
}

export function renderDetail(trophy, state) {
  const host = document.getElementById("detail");
  host.innerHTML = "";
  if (!trophy) {
    host.appendChild(el("p", "muted", "Select a trophy from the checklist to read its guide."));
    return;
  }
  host.appendChild(el("h2", null, displayName(trophy, state)));
  const meta = el("div", "trophy-meta");
  meta.appendChild(el("span", "chip grade-" + trophy.grade, gradeLabel(trophy.grade)));
  meta.appendChild(el("span", "chip", KIND_LABELS[trophy.kind] || trophy.kind));
  if (trophy.missable && trophy.kind !== "missable") meta.appendChild(el("span", "chip missable", "MISSABLE — one clean attempt"));
  if (trophy.targetLabel) meta.appendChild(el("span", "chip target", "PSN target: " + trophy.targetLabel));
  host.appendChild(meta);
  host.appendChild(el("p", "trophy-desc", displayDescription(trophy, state)));
  host.appendChild(el("h3", null, "Guide"));
  host.appendChild(el("p", "guide-text", trophy.guide));
  host.appendChild(el("h3", null, "Sources"));
  const list = el("ul", "sources");
  for (const src of trophy.sources || []) {
    const item = el("li");
    const link = document.createElement("a");
    link.href = src.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = src.name;
    item.appendChild(link);
    list.appendChild(item);
  }
  const honesty = el("li", "muted", "Names and descriptions are PlayStation's official list. Steps beyond the official description are marked in the guide when they have not been checked in the game.");
  list.appendChild(honesty);
  host.appendChild(list);
  if (trophy.target) {
    host.appendChild(el("h3", null, "Your progress toward the PSN target"));
    const box = el("div", "counter-box");
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = String(trophy.target);
    input.value = String(state.counts[trophy.id] || 0);
    input.dataset.countFor = String(trophy.id);
    input.setAttribute("aria-label", "Count toward " + trophy.targetLabel);
    box.appendChild(input);
    box.appendChild(el("span", "muted", "of " + trophy.target + " — " + trophy.targetLabel));
    host.appendChild(box);
  }
  host.appendChild(el("h3", null, "Your note"));
  const note = document.createElement("textarea");
  note.value = state.notes[trophy.id] || "";
  note.placeholder = "Where you found it, what worked, what to retry…";
  note.dataset.noteFor = String(trophy.id);
  note.setAttribute("aria-label", "Note for " + trophy.name);
  host.appendChild(note);
  const hint = el("p", "muted", "Notes and counters save in this browser automatically. Export them from Settings.");
  host.appendChild(hint);
}

export function renderRoadmap(trophies, state) {
  const host = document.getElementById("roadmap-list");
  host.innerHTML = "";
  for (const stage of ROADMAP_STAGES) {
    const items = trophies.filter((t) => t.roadmap === stage.n);
    const done = items.filter((t) => state.earned[t.id]).length;
    const box = el("div", "roadmap-stage");
    const head = el("div", "stage-head");
    head.appendChild(el("h3", null, "Stage " + stage.n + " — " + stage.title));
    head.appendChild(el("span", "chip", done + " / " + items.length + " earned"));
    box.appendChild(head);
    box.appendChild(el("p", "muted", stage.blurb));
    const names = el("p", null, items.map((t) => displayName(t, state)).join(" · "));
    box.appendChild(names);
    host.appendChild(box);
  }
}

export function renderMissables(trophies, state) {
  const host = document.getElementById("missable-list");
  host.innerHTML = "";
  const missed = trophies.filter((t) => t.missable);
  const done = missed.filter((t) => state.earned[t.id]).length;
  host.appendChild(el("p", "muted", done + " of " + missed.length + " missable trophies earned. Each of these needs one clean attempt — plan it before you start, and save first where the game allows it. Flags are built from the official descriptions only."));
  const list = el("ul", "trophy-list");
  for (const t of missed) list.appendChild(renderTrophyRow(t, state, null));
  host.appendChild(list);
}

export function nextUpList(trophies, state) {
  const remaining = trophies.filter((t) => !state.earned[t.id]);
  const byStage = (a, b) => a.roadmap - b.roadmap || a.id - b.id;
  const missableFirst = remaining.filter((t) => t.missable).sort(byStage);
  const storyNext = remaining.filter((t) => !t.missable && t.kind === "story").sort(byStage);
  const rest = remaining.filter((t) => !t.missable && t.kind !== "story").sort(byStage);
  return [...missableFirst, ...storyNext, ...rest].slice(0, 5);
}

export function renderPlanner(trophies, state) {
  const host = document.getElementById("planner-list");
  host.innerHTML = "";
  const picks = nextUpList(trophies, state);
  if (picks.length === 0) {
    host.appendChild(el("p", null, "Everything is earned — Vice Got a Price! should have popped. Leonida Legend."));
    return;
  }
  const list = document.createElement("ol");
  for (const t of picks) {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = displayName(t, state);
    item.appendChild(name);
    item.appendChild(document.createTextNode(" — " + (KIND_LABELS[t.kind] || t.kind) + ", " + gradeLabel(t.grade) + (t.missable ? ", MISSABLE" : "") + (t.targetLabel ? ", target " + t.targetLabel : "")));
    list.appendChild(item);
  }
  host.appendChild(list);
  host.appendChild(el("p", "muted", "Planner order: missable trophies first (they need one clean attempt), then the next story trophies, then the nearest count and collectible goals."));
}

export function renderProgress(trophies, state) {
  const total = trophies.length;
  const done = Object.keys(state.earned).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-text").textContent = done + " / " + total + " trophies earned — " + pct + "% to platinum";
  document.getElementById("progress-fill").style.width = pct + "%";
  const counts = document.getElementById("grade-counts");
  counts.innerHTML = "";
  for (const grade of ["platinum", "gold", "silver", "bronze"]) {
    const all = trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => state.earned[t.id]).length;
    const span = document.createElement("span");
    const dot = el("span", "swatch " + grade);
    span.appendChild(dot);
    span.appendChild(document.createTextNode(gradeLabel(grade) + " " + got + "/" + all.length));
    counts.appendChild(span);
  }
}
