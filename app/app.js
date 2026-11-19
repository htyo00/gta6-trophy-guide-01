/* Sunset Platinum — app boot and wiring.
   Loads the trophy data, restores the saved state, and wires every control.
   The app fetches only its own data/trophies.json and makes no other request. */

import {
  loadState,
  saveState,
  toggleEarned,
  setNote,
  setCount,
  setSetting,
  exportState,
  importStateText,
  seedDemoProgress,
} from "./store.js";
import {
  KIND_LABELS,
  renderTrophyRow,
  renderDetail,
  renderRoadmap,
  renderMissables,
  renderPlanner,
  renderProgress,
  trophyMatches,
} from "./views.js";

const state = loadState();
let trophies = [];
let selectedId = null;
const filters = { q: "", kind: "all", grade: "all", only: "all" };

function applyTheme() {
  document.documentElement.dataset.theme = state.settings.theme || "paper";
  const btn = document.getElementById("theme-toggle");
  btn.textContent = state.settings.theme === "night" ? "Paper theme" : "Night theme";
}

function renderAll() {
  renderProgress(trophies, state);
  const list = document.getElementById("trophy-list");
  list.innerHTML = "";
  const shown = trophies.filter((t) => trophyMatches(t, filters, state));
  for (const t of shown) {
    const row = renderTrophyRow(t, state, selectedId);
    row.addEventListener("click", () => {
      selectedId = t.id;
      renderAll();
      document.getElementById("detail").scrollIntoView({ block: "nearest" });
    });
    const box = row.querySelector('input[type="checkbox"]');
    box.addEventListener("change", () => {
      toggleEarned(state, t.id);
      renderAll();
    });
    list.appendChild(row);
  }
  document.getElementById("result-count").textContent =
    shown.length + " of " + trophies.length + " trophies shown";
  const selected = trophies.find((t) => t.id === selectedId) || trophies[0] || null;
  renderDetail(selected, state);
  renderRoadmap(trophies, state);
  renderMissables(trophies, state);
  renderPlanner(trophies, state);
  document.getElementById("spoiler-toggle").checked = !!state.settings.spoiler;
  document.getElementById("spoiler-note").textContent = state.settings.spoiler
    ? "Spoilers on: story trophy names and descriptions stay hidden until earned."
    : "Spoilers off: every name and description is visible.";
  wireDetailInputs();
}

function wireDetailInputs() {
  const note = document.querySelector("#detail textarea[data-note-for]");
  if (note) {
    note.addEventListener("change", () => {
      setNote(state, Number(note.dataset.noteFor), note.value.trim());
      renderProgress(trophies, state);
      renderAll();
    });
  }
  const counter = document.querySelector('#detail input[type="number"][data-count-for]');
  if (counter) {
    counter.addEventListener("change", () => {
      setCount(state, Number(counter.dataset.countFor), counter.value);
      renderAll();
    });
  }
}

function showTab(name) {
  for (const tab of document.querySelectorAll(".tabs button")) {
    tab.classList.toggle("active", tab.dataset.tab === name);
    tab.setAttribute("aria-pressed", tab.dataset.tab === name ? "true" : "false");
  }
  for (const section of document.querySelectorAll("[data-view]")) {
    section.classList.toggle("hidden", section.dataset.view !== name);
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function boot() {
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  trophies = data.trophies || data;
  trophies.sort((a, b) => a.id - b.id);
  if (new URLSearchParams(location.search).get("seed") === "1" && Object.keys(state.earned).length === 0) {
    seedDemoProgress(state);
  }
  if (!selectedId) selectedId = trophies.length ? trophies[0].id : null;
  applyTheme();
  document.getElementById("theme-toggle").addEventListener("click", () => {
    setSetting(state, "theme", state.settings.theme === "night" ? "paper" : "night");
    applyTheme();
  });
  document.getElementById("search").addEventListener("input", (ev) => {
    filters.q = ev.target.value;
    renderAll();
  });
  document.getElementById("kind-filter").addEventListener("change", (ev) => {
    filters.kind = ev.target.value;
    renderAll();
  });
  document.getElementById("grade-filter").addEventListener("change", (ev) => {
    filters.grade = ev.target.value;
    renderAll();
  });
  document.getElementById("only-filter").addEventListener("change", (ev) => {
    filters.only = ev.target.value;
    renderAll();
  });
  document.getElementById("spoiler-toggle").addEventListener("change", (ev) => {
    setSetting(state, "spoiler", ev.target.checked);
    renderAll();
  });
  for (const tab of document.querySelectorAll(".tabs button")) {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  }
  document.getElementById("export-btn").addEventListener("click", () => {
    download("sunset-platinum-save.json", exportState(state));
  });
  document.getElementById("import-file").addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const next = importStateText(text);
      Object.assign(state, next);
      saveState(state);
      applyTheme();
      renderAll();
      document.getElementById("import-status").textContent = "Save imported.";
    } catch (err) {
      document.getElementById("import-status").textContent = "That file is not a Sunset Platinum save.";
    }
    ev.target.value = "";
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!window.confirm("Clear all earned trophies, notes and counters?")) return;
    const fresh = { earned: {}, notes: {}, counts: {}, settings: state.settings };
    Object.assign(state, fresh);
    saveState(state);
    selectedId = trophies.length ? trophies[0].id : null;
    renderAll();
  });
  renderAll();
}

boot();
