// Sunset Platinum — all rendering, written from the data file only.
// No text is copied from any earlier version of this guide.

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
};

export const ROADMAP_STAGES = [
  { n: 0, title: 'Goal: 100% & platinum', blurb: 'The two trophies that are the whole point: the Platinum itself, and A Long Road — the 100% completion checklist.' },
  { n: 1, title: 'Opening & Chapter 1', blurb: 'The story opening, plus the one thing you must not miss: the Chapter 1 balcony meditation for Positive Mental Attitude.' },
  { n: 2, title: 'Chapters 2–3', blurb: 'Character questlines open here, and so do the stranger strands. Do Race Against Yago the moment it appears.' },
  { n: 3, title: 'Chapter 4 to the finale', blurb: 'The heist chapters, the bank-vault unlock, and the final mission. Which chapter the finale belongs to is disputed — see trophy #7.' },
  { n: 4, title: 'Strangers & side stories', blurb: 'The one side strand that runs on its own clock: Bret\u2019s hunt.' },
  { n: 5, title: 'Activities & collectibles', blurb: 'The long grind: stunts, ranges, races, cards, scans and the map itself.' },
  { n: 6, title: 'Feats, finds & fortune', blurb: 'One-offs, money, and the two trophies whose triggers nobody has confirmed yet.' },
];

const GUIDE_NUMBERS = [1, 2, 3, 9, 10];
const LIST_NUMBERS = [0, 4, 5, 6, 7, 8];

const WATCH_WINDOWS = {
  8: 'A one-time scene inside Breakfast Run.',
  9: 'A one-time moment in The Cartel Heist set-piece.',
  10: 'A one-time errand window mid-mission in Child\u2019s Play.',
  11: 'A one-time moment in the Headliners venue set-piece.',
  12: 'A one-time window in the VCIA Takedown.',
  13: 'A one-time approach window in Operation Savage Glory, before the alarm state changes.',
};

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function gradeLabel(grade) {
  return { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' }[grade] || grade;
}

export function spoilerHidden(trophy, state) {
  return Boolean(
    state.settings.spoiler && trophy.hidden && !state.earned[trophy.id] && !state.revealed[trophy.id],
  );
}

export function displayName(trophy, state) {
  return spoilerHidden(trophy, state) ? 'Hidden trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return spoilerHidden(trophy, state)
    ? 'This trophy is hidden on PSN, so its name and guide stay hidden here while spoilers are off.'
    : trophy.description;
}

export function sourceNumberByName(data, name) {
  const found = data.sources.find((s) => s.name.split(' — ')[0] === name);
  return found ? found.n : null;
}

export function trophyById(data, id) {
  return data.trophies.find((t) => t.id === id) || null;
}

export function trophyMatches(trophy, filters, state) {
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.only === 'unearned' && state.earned[trophy.id]) return false;
  if (filters.only === 'earned' && !state.earned[trophy.id]) return false;
  if (filters.only === 'watch' && !['possibly', 'disputed', 'watch'].includes(trophy.missableStatus)) return false;
  if (filters.q) {
    const hay = `${displayName(trophy, state)} ${displayDescription(trophy, state)} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(filters.q.toLowerCase())) return false;
  }
  return true;
}

export function computeAudit(data) {
  const trophies = data.trophies;
  const gradeCounts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  trophies.forEach((t) => { gradeCounts[t.grade] += 1; });
  const steps = trophies.flatMap((t) => t.steps);
  const citedSteps = steps.filter((s) => s.cites && s.cites.length > 0).length;
  const citedBy = {};
  data.sources.forEach((s) => { citedBy[s.n] = 0; });
  trophies.forEach((t) => {
    [...new Set(t.steps.flatMap((s) => s.cites || []))].forEach((n) => {
      citedBy[n] = (citedBy[n] || 0) + 1;
    });
  });
  const singleSource = trophies.filter(
    (t) => new Set(t.steps.flatMap((s) => s.cites || [])).size === 1,
  ).length;
  const listOnly = trophies.filter((t) => {
    const nums = [...new Set(t.steps.flatMap((s) => s.cites || []))];
    return nums.length > 0 && nums.every((n) => LIST_NUMBERS.includes(n));
  }).length;
  let green = 0;
  let amber = 0;
  trophies.forEach((t) => {
    const nums = [...new Set(t.steps.flatMap((s) => s.cites || []))];
    const hasGuide = nums.some((n) => GUIDE_NUMBERS.includes(n));
    // Every trophy's name, description and grade is backed by the PSN list
    // sources [7][8][0], so list backing is universal; green then means a
    // guided method plus that list backing, with no disagreement and a
    // confirmed trigger. Amber is everything else.
    if (hasGuide && !t.disagreement && !t.unconfirmed) green += 1;
    else amber += 1;
  });
  return {
    total: trophies.length,
    gradeCounts,
    hidden: trophies.filter((t) => t.hidden).length,
    gamerscore: trophies.reduce((a, t) => a + (t.gamerscore || 0), 0),
    guidesCiting: trophies.filter((t) => t.steps.length > 0 && t.steps.every((s) => s.cites && s.cites.length > 0)).length,
    totalSteps: steps.length,
    citedSteps,
    sourcesRead: data.sources.length,
    readDate: data.sources[0] ? data.sources[0].read : '',
    possibly: trophies.filter((t) => t.missableStatus === 'possibly').length,
    disputed: trophies.filter((t) => t.missableStatus === 'disputed').length,
    watch: trophies.filter((t) => t.missableStatus === 'watch').length,
    unconfirmed: trophies.filter((t) => t.unconfirmed).length,
    singleSource,
    listOnly,
    disagree: trophies.filter((t) => t.disagreement).length,
    green,
    amber,
    citedBy,
  };
}

export function renderAuditStrip(data, state) {
  const a = computeAudit(data);
  const earned = data.trophies.filter((t) => state.earned[t.id]).length;
  const items = [
    `${a.total} official`,
    `${a.gradeCounts.platinum}P ${a.gradeCounts.gold}G ${a.gradeCounts.silver}S ${a.gradeCounts.bronze}B`,
    `${a.hidden} hidden`,
    `${a.gamerscore}G on Xbox`,
    `${a.guidesCiting}/${a.total} guides cite a source`,
    `${a.citedSteps}/${a.totalSteps} steps cited`,
    `${a.sourcesRead} sources read ${esc(a.readDate)}`,
    `${a.possibly} possibly missable`,
    `${a.disputed} disputed`,
    `${a.watch} watch`,
    `${a.unconfirmed} trigger not known`,
    `${a.singleSource} single-source`,
    `${a.disagree} disagree`,
    `${a.green} green · ${a.amber} amber`,
    `${earned}/${a.total} earned by you`,
  ];
  return items.map((item) => `<span class="audit-item">${esc(item)}</span>`).join('');
}

function missableChip(trophy) {
  const label = {
    possibly: 'POSSIBLY MISSABLE',
    disputed: 'DISPUTED',
    watch: 'WATCH',
    safe: 'Safe',
  }[trophy.missableStatus];
  return `<span class="chip chip-${trophy.missableStatus}">${esc(label)}</span>`;
}

function gradeChip(trophy) {
  return `<span class="grade grade-${trophy.grade}">${esc(gradeLabel(trophy.grade))}${trophy.gamerscore ? ` · ${trophy.gamerscore}G` : ''}</span>`;
}

function citesHtml(step) {
  return (step.cites || []).map((n) => `<a class="cite" href="#sources" data-action="goto-sources">[${n}]</a>`).join('');
}

export function renderTrophyList(data, state, filters, selectedId) {
  const list = data.trophies.filter((t) => trophyMatches(t, filters, state));
  if (list.length === 0) {
    return `<p class="empty">No trophies match these filters. Clear the search or widen the filters.</p>`;
  }
  return list.map((t) => {
    const earned = Boolean(state.earned[t.id]);
    const hidden = spoilerHidden(t, state);
    return `<button type="button" class="trophy-row${earned ? ' is-earned' : ''}${t.id === selectedId ? ' is-selected' : ''}" data-action="select" data-id="${t.id}">
      <span class="row-check" aria-hidden="true">${earned ? '✓' : ''}</span>
      <span class="row-main">
        <span class="row-name">${esc(displayName(t, state))}</span>
        <span class="row-sub">${esc(displayDescription(t, state))}</span>
      </span>
      <span class="row-tags">${gradeChip(t)}<span class="chip">${esc(KIND_LABELS[t.kind] || t.kind)}</span>${t.target ? `<span class="chip chip-target">${t.target} ${esc(t.targetLabel || '')}</span>` : ''}${hidden ? '<span class="chip chip-hidden">Hidden</span>' : ''}${missableChip(t)}</span>
    </button>`;
  }).join('');
}

export function renderDetail(data, state, selectedId) {
  const t = trophyById(data, selectedId);
  if (!t) {
    return `<p class="empty">Pick a trophy on the left to read its guide.</p>`;
  }
  if (spoilerHidden(t, state)) {
    return `<div class="spoiler-box">
      <h3>Hidden trophy</h3>
      <p>This trophy is hidden on PSN, so its name and guide stay hidden here while spoilers are off. Reveal it only if you want the spoiler.</p>
      <button type="button" class="btn" data-action="reveal" data-id="${t.id}">Reveal this trophy</button>
    </div>`;
  }
  const count = state.counts[t.id] || 0;
  const note = state.notes[t.id] || '';
  const stepsHtml = t.steps.map((s, i) => `<li><span class="step-text">${esc(s.text)}</span> ${citesHtml(s)}</li>`).join('');
  const sourcesHtml = t.sources.map((s) => {
    const n = sourceNumberByName(data, s.name);
    return `<li>[${n}] ${esc(s.name)} — <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></li>`;
  }).join('');
  const counterHtml = t.target ? `<div class="counter-box">
      <div class="counter-head"><strong>YOUR COUNT</strong><span>${count} / ${t.target} ${esc(t.targetLabel || '')}</span></div>
      <div class="counter-controls">
        <button type="button" class="btn counter-btn" data-action="count-dec" data-id="${t.id}" aria-label="Decrease count">−</button>
        <input type="number" min="0" max="${t.target}" value="${count}" data-count-id="${t.id}" aria-label="Your count for ${esc(t.name)}">
        <button type="button" class="btn counter-btn" data-action="count-inc" data-id="${t.id}" aria-label="Increase count">+</button>
      </div>
      <div class="bar"><span style="width:${Math.min(100, Math.round((count / t.target) * 100))}%"></span></div>
      ${t.target100 ? `<p class="counter-note">The 100% checklist wants ${t.target100} ${esc(t.target100Label || '')} — more than this trophy.</p>` : ''}
    </div>` : '';
  return `<article class="detail">
    <div class="detail-head">
      <div>
        <h3>${esc(t.name)}</h3>
        <p class="detail-sub">#${t.id} · ${esc(KIND_LABELS[t.kind] || t.kind)} · Stage ${t.roadmap}</p>
      </div>
      <div class="detail-tags">${gradeChip(t)}${missableChip(t)}</div>
    </div>
    <p class="official"><strong>Official description:</strong> ${esc(t.description)}</p>
    <p class="guide-short"><strong>IN SHORT:</strong> ${esc(t.guide)}</p>
    ${t.unconfirmed ? `<div class="box box-unconfirmed"><strong>TRIGGER NOT KNOWN.</strong> No guide read for this list has confirmed how this trophy unlocks. The step below says so plainly rather than inventing a method.</div>` : ''}
    <h4>HOW TO GET IT</h4>
    <ol class="steps">${stepsHtml}</ol>
    <div class="box box-missable"><strong>MISSABLE?</strong> ${esc(t.missableNote)}</div>
    ${t.disagreement ? `<div class="box box-disagree"><strong>SOURCES DISAGREE — BOTH VERSIONS SHOWN.</strong> ${esc(t.disagreement)}</div>` : ''}
    ${counterHtml}
    <label class="note-label">Your note
      <textarea data-note-id="${t.id}" rows="2" placeholder="e.g. where you left off…">${esc(note)}</textarea>
    </label>
    <div class="detail-actions">
      <button type="button" class="btn" data-action="toggle-earned" data-id="${t.id}">${state.earned[t.id] ? 'Mark as not earned' : 'Mark as earned'}</button>
    </div>
    <h4>SOURCES FOR THIS TROPHY</h4>
    <ul class="detail-sources">${sourcesHtml}</ul>
  </article>`;
}

export function renderRoadmap(data, state) {
  return ROADMAP_STAGES.map((stage) => {
    const members = data.trophies.filter((t) => t.roadmap === stage.n);
    const earned = members.filter((t) => state.earned[t.id]).length;
    const pct = members.length ? Math.round((earned / members.length) * 100) : 0;
    const coverage = {};
    members.forEach((t) => {
      [...new Set(t.steps.flatMap((s) => s.cites || []))].forEach((n) => {
        coverage[n] = (coverage[n] || 0) + 1;
      });
    });
    const coverageHtml = Object.keys(coverage).sort((a, b) => a - b)
      .map((n) => `[${n}] ${coverage[n]}`).join(' · ');
    const chips = members.map((t) => {
      const isEarned = Boolean(state.earned[t.id]);
      return `<button type="button" class="stage-chip${isEarned ? ' is-earned' : ''}${spoilerHidden(t, state) ? ' is-hidden' : ''}" data-action="select" data-id="${t.id}" data-goto="tracker">${isEarned ? '✓ ' : ''}${esc(displayName(t, state))}</button>`;
    }).join('');
    return `<section class="stage">
      <div class="stage-head">
        <h3>S${stage.n} — ${esc(stage.title)}</h3>
        <span class="stage-count">${earned}/${members.length} earned</span>
      </div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <p class="stage-blurb">${esc(stage.blurb)}</p>
      <p class="stage-coverage"><strong>STAGE SOURCE COVERAGE</strong> ${esc(coverageHtml)}</p>
      <div class="stage-chips">${chips}</div>
    </section>`;
  }).join('');
}

function missableCard(data, state, t, windowText, confirmText, notConfirmText, safePlayText) {
  if (spoilerHidden(t, state)) {
    return `<article class="missable-card">
      <h4>Hidden trophy</h4>
      <p>This trophy is hidden on PSN, so its name and window stay hidden here while spoilers are off.</p>
      <button type="button" class="btn" data-action="reveal" data-id="${t.id}">Reveal this trophy</button>
    </article>`;
  }
  return `<article class="missable-card">
    <h4>#${t.id} — ${esc(t.name)}</h4>
    <p><strong>WINDOW</strong> ${esc(windowText)}</p>
    <p><strong>WHAT THE SOURCES CONFIRM</strong> ${esc(confirmText)}</p>
    <p><strong>WHAT THEY DO NOT CONFIRM</strong> ${esc(notConfirmText)}</p>
    <p><strong>THE SAFE PLAY</strong> ${esc(safePlayText)}</p>
  </article>`;
}

export function renderMissables(data, state) {
  const byId = (id) => trophyById(data, id);
  const possibly = [byId(28)];
  const disputed = [byId(25), byId(37)];
  const watch = [8, 9, 10, 11, 12, 13].map(byId);
  const possiblyHtml = possibly.map((t) => missableCard(data, state, t,
    'Chapter 1, the morning after Down to Earth — Lucia in the kitchen at Jason\u2019s house, then the balcony.',
    'The balcony meditation is gone after Chapter 1 [1][2], and the counter rises +1 [1].',
    'Whether the trophy needs that spot: PowerPyx [1] says it is unclear; OutputLag [2] says it counts.',
    'Do it in Chapter 1, and keep a Chapter 1 manual save until the trophy pops.')).join('');
  const disputedHtml = disputed.map((t) => {
    if (t.id === 25) {
      return missableCard(data, state, t,
        'Chapter 3 — Race Against Yago, marked with an hourglass icon.',
        'OutputLag [2] and TechWiser [10] call the race time-sensitive and say the strand counts toward this trophy.',
        'PowerPyx [1] says all stranger strands are still there after the story.',
        'Race the moment it appears; save first.');
    }
    return missableCard(data, state, t,
      'A story window at VCIA, claimed by another entry — not by any guide read here.',
      'PowerPyx [1] and GTABase [9] give a free-roam method: a docked jet at gates E3/E4, flown 1 km away.',
      'No guide read here mentions a story window, or says the method cannot be repeated in free roam.',
      'Save before trying, and try it in free roam first.');
  }).join('');
  const watchHtml = watch.map((t) => missableCard(data, state, t,
    WATCH_WINDOWS[t.id],
    'Nothing in the guides read here confirms a window.',
    'PowerPyx [1] and OutputLag [2] describe these as automatic story trophies, with no window mentioned.',
    'Play the mission normally. The claim is unverified, so do not replay the game over it — but keep chapter saves as a habit.')).join('');
  return `<h3>Possibly missable — 1</h3>${possiblyHtml}
    <h3>Disputed — 2</h3>${disputedHtml}
    <h3>Watch — 6</h3>${watchHtml}
    <p class="missable-foot">The other 46 trophies are safe after the credits: free roam, the side-story finales and the whole 100% checklist stay available [1][2].</p>`;
}

export function renderPlanner(data, state) {
  const remaining = data.trophies
    .filter((t) => !state.earned[t.id])
    .sort((a, b) => (a.roadmap - b.roadmap) || (a.id - b.id));
  const earned = data.trophies.length - remaining.length;
  const next = remaining.slice(0, 8);
  const rows = next.map((t) => `<li><button type="button" class="planner-row" data-action="select" data-id="${t.id}" data-goto="tracker">
    <span class="planner-stage">S${t.roadmap}</span>
    <span class="planner-name">${esc(displayName(t, state))}</span>
    <span class="planner-guide">${esc(spoilerHidden(t, state) ? 'Hidden on PSN — reveal it in the Tracker to read the guide.' : t.guide)}</span>
  </button></li>`).join('');
  return `<p class="planner-summary"><strong>${earned} of ${data.trophies.length} earned · ${remaining.length} left.</strong> Next up, in roadmap order:</p>
    <p class="planner-warning">Do Positive Mental Attitude\u2019s balcony step before you finish Chapter 1 — it is the only step in this list that can disappear.</p>
    <ol class="planner-list">${rows}</ol>`;
}

export function renderSourceMatrix(data) {
  const a = computeAudit(data);
  const ordered = [...data.sources].sort((x, y) => {
    if (x.n === 0) return 1;
    if (y.n === 0) return -1;
    return x.n - y.n;
  });
  const rows = ordered.map((s) => {
    const cited = a.citedBy[s.n] || 0;
    const pct = Math.round((cited / data.trophies.length) * 100);
    return `<tr>
      <td>[${s.n}]</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.role)}</td>
      <td>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\//, ''))}</a>` : 'Included in the contest kit'}</td>
      <td>${esc(s.read)}</td>
      <td>${cited} of ${data.trophies.length} guides (${pct}%)</td>
    </tr>`;
  }).join('');
  const disagreeIds = data.trophies.filter((t) => t.disagreement).map((t) => `#${t.id}`).join(', ');
  const listOnlyNames = ordered.filter((s) => (a.citedBy[s.n] || 0) === 0 && LIST_NUMBERS.includes(s.n))
    .map((s) => `[${s.n}] ${esc(s.name.split(' — ')[0])}`).join('; ');
  return `<table class="source-table">
    <thead><tr><th>#</th><th>Source</th><th>Role</th><th>URL</th><th>Read</th><th>Cited by</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p><strong>Trophies resting on a single source:</strong> ${a.singleSource === 0 ? 'none — every guide cites at least two sources.' : `${a.singleSource} (see the Tracker).`}</p>
  <p><strong>List-only backing:</strong> ${listOnlyNames || 'none'} — these back the official names, descriptions and grades of all 55 trophies, not the methods, so they are cited by 0 of 55 guides.</p>
  <p><strong>Source disagreements:</strong> ${a.disagree} trophies carry a SOURCES DISAGREE box (${esc(disagreeIds)}). Open the trophy in the Tracker to read both versions.</p>
  <p><strong>How citations were assigned:</strong> every numbered step cites the guide it comes from. Names, descriptions and grades come from the PSN list [7][8][0]. Where the guides give no number or no method, this guide says so instead of inventing one.</p>`;
}
