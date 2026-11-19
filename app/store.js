/* Sunset Platinum — save store.
   Progress, notes, counters and settings live in localStorage only.
   Nothing here touches the network. */

export const STORE_KEY = "sunset-platinum-v1";

/* The thirteen trophies the demo screenshots start earned with. */
export const SEED_EARNED = [2, 3, 4, 8, 10, 15, 21, 35, 44, 46, 51, 53, 55];

export function blankState() {
  return {
    earned: {},
    notes: {},
    counts: {},
    settings: { spoiler: true, theme: "paper" },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    const base = blankState();
    return {
      earned: parsed.earned || base.earned,
      notes: parsed.notes || base.notes,
      counts: parsed.counts || base.counts,
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch (err) {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function toggleEarned(state, id) {
  if (state.earned[id]) delete state.earned[id];
  else state.earned[id] = true;
  saveState(state);
  return state;
}

export function setNote(state, id, text) {
  if (text) state.notes[id] = text;
  else delete state.notes[id];
  saveState(state);
  return state;
}

export function setCount(state, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n > 0) state.counts[id] = n;
  else delete state.counts[id];
  saveState(state);
  return state;
}

export function setSetting(state, key, value) {
  state.settings[key] = value;
  saveState(state);
  return state;
}

export function earnedCount(state) {
  return Object.keys(state.earned).length;
}

export function exportState(state) {
  return JSON.stringify(
    { app: "sunset-platinum", version: 1, exportedAt: new Date().toISOString(), state },
    null,
    2
  );
}

export function importStateText(text) {
  const parsed = JSON.parse(text);
  const inner = parsed && parsed.state ? parsed.state : parsed;
  if (!inner || typeof inner !== "object") throw new Error("not a Sunset Platinum save file");
  const base = blankState();
  return {
    earned: inner.earned || base.earned,
    notes: inner.notes || base.notes,
    counts: inner.counts || base.counts,
    settings: { ...base.settings, ...(inner.settings || {}) },
  };
}

export function seedDemoProgress(state) {
  for (const id of SEED_EARNED) state.earned[id] = true;
  state.counts[15] = 120;
  state.counts[31] = 40;
  state.counts[35] = 61;
  state.counts[42] = 22;
  saveState(state);
  return state;
}
