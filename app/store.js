// Sunset Platinum — saved state (localStorage only, no account, no network).
export const STORAGE_KEY = 'sunset-platinum.v3';

export function defaultState() {
  return {
    earned: {},
    notes: {},
    counts: {},
    revealed: {},
    settings: { spoiler: true, theme: 'paper', onlyUnearned: false },
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function loadState() {
  const state = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return state;
    for (const key of ['earned', 'notes', 'counts', 'revealed']) {
      if (isPlainObject(parsed[key])) state[key] = parsed[key];
    }
    if (isPlainObject(parsed.settings)) {
      state.settings = { ...state.settings, ...parsed.settings };
    }
    return state;
  } catch {
    return state;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

export function importState(text) {
  const parsed = JSON.parse(text);
  if (!isPlainObject(parsed)) throw new Error('Import is not a JSON object.');
  const state = defaultState();
  for (const key of ['earned', 'notes', 'counts', 'revealed']) {
    if (parsed[key] !== undefined && !isPlainObject(parsed[key])) {
      throw new Error(`Import field "${key}" must be an object.`);
    }
    if (isPlainObject(parsed[key])) state[key] = parsed[key];
  }
  if (parsed.settings !== undefined) {
    if (!isPlainObject(parsed.settings)) throw new Error('Import field "settings" must be an object.');
    state.settings = { ...state.settings, ...parsed.settings };
  }
  return state;
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable; the fresh default is still returned.
  }
  return defaultState();
}

export function stateSizeBytes(state) {
  return new TextEncoder().encode(JSON.stringify(state)).length;
}
