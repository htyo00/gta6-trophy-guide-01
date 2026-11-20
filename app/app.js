// Sunset Platinum — main module. Wires the data, the saved state and the views.
import data from './data/trophies.json' with { type: 'json' };
import {
  loadState,
  saveState,
  exportState,
  importState,
  resetState,
  stateSizeBytes,
  STORAGE_KEY,
} from './store.js';
import {
  KIND_LABELS,
  computeAudit,
  renderAuditStrip,
  renderTrophyList,
  renderDetail,
  renderRoadmap,
  renderMissables,
  renderPlanner,
  renderTrackerSide,
  renderSourceMatrix,
  trophyMatches,
} from './views.js';

const TABS = ['tracker', 'roadmap', 'missables', 'planner', 'sources', 'settings'];

let state = loadState();
let selectedId = 28;
let currentTab = 'tracker';
const filters = { kind: 'all', grade: 'all', only: 'all', q: '' };

const $ = (id) => document.getElementById(id);

function filteredList() {
  return data.trophies.filter((t) => trophyMatches(t, filters, state));
}

function renderProgress() {
  const earned = data.trophies.filter((t) => state.earned[t.id]);
  $('progress-text').textContent = `${earned.length} of ${data.trophies.length} trophies earned`;
  $('progress-fill').style.width = `${Math.round((earned.length / data.trophies.length) * 100)}%`;
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  earned.forEach((t) => { grades[t.grade] += 1; });
  $('grade-counts').textContent =
    `Platinum ${grades.platinum}/1 · Gold ${grades.gold}/2 · Silver ${grades.silver}/6 · Bronze ${grades.bronze}/46`;
}

function renderList() {
  const list = filteredList();
  $('trophy-list').innerHTML = renderTrophyList(data, state, filters, selectedId);
  $('result-count').textContent = `${list.length} of ${data.trophies.length} trophies`;
}

function renderDetailPanel() {
  $('trophy-detail').innerHTML = renderDetail(data, state, selectedId);
}

function renderAll() {
  document.documentElement.dataset.theme = state.settings.theme;
  $('theme-toggle').textContent = state.settings.theme === 'night' ? 'Paper theme' : 'Night theme';
  $('filter-spoiler').checked = state.settings.spoiler;
  renderProgress();
  $('audit-strip').innerHTML = renderAuditStrip(data, state);
  renderList();
  renderDetailPanel();
  $('tracker-side').innerHTML = renderTrackerSide(data, state, selectedId);
  $('roadmap-list').innerHTML = renderRoadmap(data, state);
  $('missables-list').innerHTML = renderMissables(data, state);
  $('planner-list').innerHTML = renderPlanner(data, state);
  $('source-matrix').innerHTML = renderSourceMatrix(data);
  $('storage-info').textContent =
    `Saved under key ${STORAGE_KEY} in this browser's localStorage. Current saved state: ${stateSizeBytes(state)} bytes.`;
  document.querySelectorAll('[data-tab]').forEach((button) => {
    const active = button.dataset.tab === currentTab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  TABS.forEach((tab) => {
    $(`tab-${tab}`).hidden = tab !== currentTab;
  });
}

function switchTab(tab) {
  if (!TABS.includes(tab)) return;
  currentTab = tab;
  renderAll();
  if (history.replaceState) history.replaceState(null, '', `#${tab}`);
}

function clampCount(trophy, value) {
  if (!trophy || !trophy.target) return 0;
  const n = Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, Math.min(trophy.target, n));
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = Number(target.dataset.id || 0);
  if (action === 'select' && id) {
    selectedId = id;
    if (target.dataset.goto) switchTab(target.dataset.goto);
    else renderAll();
  } else if (action === 'toggle-earned' && id) {
    state.earned[id] = !state.earned[id];
    if (state.earned[id]) delete state.revealed[id];
    saveState(state);
    renderAll();
  } else if (action === 'reveal' && id) {
    state.revealed[id] = true;
    saveState(state);
    renderAll();
  } else if (action === 'count-dec' && id) {
    const trophy = data.trophies.find((t) => t.id === id);
    state.counts[id] = clampCount(trophy, (state.counts[id] || 0) - 1);
    saveState(state);
    renderAll();
  } else if (action === 'count-inc' && id) {
    const trophy = data.trophies.find((t) => t.id === id);
    state.counts[id] = clampCount(trophy, (state.counts[id] || 0) + 1);
    saveState(state);
    renderAll();
  } else if (action === 'tab') {
    switchTab(target.dataset.tab);
  } else if (action === 'goto-sources') {
    event.preventDefault();
    switchTab('sources');
  } else if (action === 'theme-toggle') {
    state.settings.theme = state.settings.theme === 'night' ? 'paper' : 'night';
    saveState(state);
    renderAll();
  } else if (action === 'export') {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sunset-platinum-save.json';
    link.click();
    URL.revokeObjectURL(url);
  } else if (action === 'import') {
    $('import-file').click();
  } else if (action === 'reset') {
    if (window.confirm('Reset all earned trophies, counts, notes and settings?')) {
      state = resetState();
      selectedId = 28;
      renderAll();
    }
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (target.id === 'filter-search') {
    filters.q = target.value;
    renderList();
  } else if (target.matches('[data-note-id]')) {
    state.notes[Number(target.dataset.noteId)] = target.value;
    saveState(state);
  } else if (target.matches('[data-count-id]')) {
    const id = Number(target.dataset.countId);
    const trophy = data.trophies.find((t) => t.id === id);
    state.counts[id] = clampCount(trophy, Number(target.value));
    saveState(state);
    renderProgress();
    $('audit-strip').innerHTML = renderAuditStrip(data, state);
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'filter-kind') {
    filters.kind = target.value;
    renderList();
  } else if (target.id === 'filter-grade') {
    filters.grade = target.value;
    renderList();
  } else if (target.id === 'filter-only') {
    filters.only = target.value;
    renderList();
  } else if (target.id === 'filter-spoiler') {
    state.settings.spoiler = target.checked;
    saveState(state);
    renderAll();
  } else if (target.id === 'import-file' && target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = importState(String(reader.result));
        saveState(state);
        renderAll();
        window.alert('Save imported.');
      } catch (error) {
        window.alert(`Import failed: ${error.message}`);
      }
      target.value = '';
    };
    reader.readAsText(file);
  }
});

// Deep-link a tab from the URL hash, e.g. app/index.html#roadmap.
const initialTab = (location.hash || '').slice(1);
if (TABS.includes(initialTab)) currentTab = initialTab;

renderAll();
