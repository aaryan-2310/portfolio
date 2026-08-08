/**
 * WORLDLINE — shared content data.
 * Ported from .mockups/worldline.html. Single source of truth for all HUD panels.
 * Both engines read from this file; never duplicate content inline.
 */

export interface Mission {
  no: string;
  title: string;
  status: 'done' | 'active' | 'archived';
  statusLabel: string;
  overview: string;
  tech: string;
}

export interface Signal {
  id: string;
  date: string;
  headline: string;
  body: string;
}

export interface TimelineEvent {
  year: string;
  label: string;
  note: string;
}

// ── MISSIONS — powers HUD_Constellation and Mission Console ──────────────────
export const MISSIONS: Mission[] = [
  {
    no: '001', title: 'QR-DINE', status: 'done', statusLabel: 'COMPLETE',
    overview: 'Multi-tenant restaurant ordering — scan the table, order, pay; the kitchen sees it before the waiter does.',
    tech: 'Spring Boot · React · Kafka · Razorpay · WebSocket · PostgreSQL',
  },
  {
    no: '002', title: 'JOB HUNT', status: 'active', statusLabel: 'ACTIVE',
    overview: 'Career intelligence — a résumé goes in, a filled profile comes out. Gemini parses; Kafka keeps the UI from waiting on it.',
    tech: 'Spring WebFlux · Gemini · Kafka · React · PostgreSQL',
  },
  {
    no: '003', title: 'FINANCE CONTROL TOWER', status: 'done', statusLabel: 'COMPLETE',
    overview: 'A personal ledger that has to reconcile — transactions, budgets, cards, investments, reports in INR.',
    tech: 'Spring Boot · React · PostgreSQL · Docker',
  },
  {
    no: '004', title: 'HYPERLOCAL EMARKET', status: 'done', statusLabel: 'COMPLETE',
    overview: 'Web + Flutter storefront for same-day delivery. Cart, checkout, and discovery driven by intent.',
    tech: 'React · Flutter · Spring Boot · Razorpay',
  },
  {
    no: '005', title: 'PORTFOLIO & CMS', status: 'active', statusLabel: 'ACTIVE',
    overview: 'This vessel, and the headless CMS behind it. Angular front, Spring API, React admin.',
    tech: 'Angular · Spring Boot · React · PostgreSQL',
  },
  {
    no: '006', title: 'LOAN APPROVAL MODEL', status: 'archived', statusLabel: 'ARCHIVED',
    overview: 'An early ML system scoring loan applications — where the data habit started. 2021.',
    tech: 'Python · scikit-learn',
  },
];

// ── SIGNALS — powers HUD_Journal (transmission archive) ─────────────────────
export const SIGNALS: Signal[] = [
  {
    id: 'TX_003', date: '2026.07.14',
    headline: 'Validating a query language at the caret, not on submit',
    body: 'Error-on-submit trains users to guess. When the parser runs on every keystroke, the grammar becomes something you can feel — the caret tells you where the sentence broke before you finish thinking it.',
  },
  {
    id: 'TX_002', date: '2026.05.02',
    headline: 'Exactly-once is a lie you tell your product manager',
    body: 'What you actually get is at-least-once plus idempotency, and a webhook you trust more than the browser. The honest version of the promise is: charged once, or refunded loudly.',
  },
  {
    id: 'TX_001', date: '2026.03.19',
    headline: 'What Gemini gets wrong when it reads a résumé',
    body: 'The pinned schema catches most of it. What remains is the confident wrong answer — which is worse than an empty box, because nobody double-checks a filled field.',
  },
];

// ── WORLDLINE TIMELINE — powers HUD_Timeline ─────────────────────────────────
export const TIMELINE: TimelineEvent[] = [
  { year: '2019', label: 'LEARNING',     note: 'B.Tech years — fundamentals, first code that survived contact with users.' },
  { year: '2021', label: 'FIRST SYSTEM', note: 'Loan approval model shipped. Where the data habit started.' },
  { year: '2022', label: 'HIGHRADIUS',   note: 'Order-to-cash microservices. Enterprise A/R, Java, first production pager.' },
  { year: '2024', label: 'CLARIVATE',    note: 'Patent search. ANTLR grammar, CodeMirror validation, 100k-row grids.' },
  { year: '2026', label: 'NOW',          note: 'Building worldline systems. Accepting work.' },
];

// ── SYSTEM READOUT — powers HUD_System ──────────────────────────────────────
export const SYSTEM = {
  vesselId: 'WLV-01',
  designation: 'WORLDLINE COMMAND DECK',
  status: 'NOMINAL',
  missions: {
    total:    MISSIONS.length,
    active:   MISSIONS.filter(m => m.status === 'active').length,
    complete: MISSIONS.filter(m => m.status === 'done').length,
  },
  transmissions: SIGNALS.length,
  orbit: 'WORLDLINE  2019 → 2026',
};

// ── HUD Canvas Drawers ───────────────────────────────────────────────────────
// Each draws into a supplied canvas. Call these identically from Three.js and
// PlayCanvas — no engine-specific code inside.

const DARK  = '#07080b';
const AMBER = '#d9a648';
const TEAL  = '#5fb8a8';
const DIM   = '#3a3f4a';
const FONT  = '500 {size}px "Courier New", monospace';

function ctx(cv: HTMLCanvasElement) { return cv.getContext('2d')!; }
function bg(cv: HTMLCanvasElement, x: CanvasRenderingContext2D) {
  x.fillStyle = DARK; x.fillRect(0, 0, cv.width, cv.height);
}
function rule(x: CanvasRenderingContext2D, y: number, W: number) {
  x.strokeStyle = AMBER; x.globalAlpha = 0.35; x.lineWidth = 1;
  x.beginPath(); x.moveTo(16, y); x.lineTo(W - 16, y); x.stroke(); x.globalAlpha = 1;
}

export function drawTimeline(cv: HTMLCanvasElement): void {
  const [W, H] = [cv.width, cv.height]; const x = ctx(cv); bg(cv, x);
  // Header
  x.fillStyle = AMBER; x.font = FONT.replace('{size}', '18');
  x.fillText('WORLDLINE TIMELINE', 16, 28);
  rule(x, 40, W);
  // Timeline track
  const track = { y: 72, x0: 40, x1: W - 40 };
  x.strokeStyle = DIM; x.lineWidth = 2;
  x.beginPath(); x.moveTo(track.x0, track.y); x.lineTo(track.x1, track.y); x.stroke();
  // Events
  const step = (track.x1 - track.x0) / (TIMELINE.length - 1);
  TIMELINE.forEach((ev, i) => {
    const ex = track.x0 + i * step;
    const isNow = ev.label === 'NOW';
    x.fillStyle = isNow ? TEAL : AMBER;
    x.beginPath(); x.arc(ex, track.y, isNow ? 7 : 4, 0, Math.PI * 2); x.fill();
    // Year label
    x.font = FONT.replace('{size}', '13'); x.textAlign = 'center';
    x.fillText(ev.year, ex, track.y - 14);
    // Station label
    x.font = FONT.replace('{size}', '11');
    x.fillStyle = isNow ? TEAL : DIM;
    x.fillText(ev.label, ex, track.y + 22);
    x.textAlign = 'left';
  });
  // Footer note
  x.font = FONT.replace('{size}', '11'); x.fillStyle = DIM;
  x.fillText('◆ NOW 2026 · ACCEPTING WORK', 16, H - 12);
}

export function drawConstellation(cv: HTMLCanvasElement): void {
  const [W, H] = [cv.width, cv.height]; const x = ctx(cv); bg(cv, x);
  x.fillStyle = AMBER; x.font = FONT.replace('{size}', '16');
  x.fillText('PROJECT CONSTELLATION', 16, 26);
  rule(x, 36, W);
  const rowH = Math.floor((H - 60) / MISSIONS.length);
  MISSIONS.forEach((m, i) => {
    const y = 56 + i * rowH;
    let col = AMBER;
    if (m.status === 'active') col = TEAL;
    if (m.status === 'archived') col = DIM;
    x.fillStyle = col; x.font = FONT.replace('{size}', '13');
    x.fillText(m.no, 16, y);
    x.fillStyle = m.status === 'archived' ? DIM : AMBER;
    x.font = FONT.replace('{size}', '13');
    x.fillText(m.title, 52, y);
    x.fillStyle = col; x.font = FONT.replace('{size}', '11');
    x.textAlign = 'right';
    x.fillText(m.statusLabel, W - 14, y);
    x.textAlign = 'left';
  });
}

export function drawJournal(cv: HTMLCanvasElement): void {
  const [W, H] = [cv.width, cv.height]; const x = ctx(cv); bg(cv, x);
  x.fillStyle = AMBER; x.font = FONT.replace('{size}', '16');
  x.fillText('TRANSMISSION ARCHIVE', 16, 26);
  rule(x, 36, W);
  let y = 56;
  SIGNALS.forEach(s => {
    x.fillStyle = DIM; x.font = FONT.replace('{size}', '11');
    x.fillText(`${s.id}  ${s.date}`, 16, y); y += 18;
    x.fillStyle = AMBER; x.font = FONT.replace('{size}', '13');
    // Word-wrap headline at ~45 chars
    const words = s.headline.split(' '); let line = '';
    for (const w of words) {
      if ((line + w).length > 38) {
        x.fillText(line.trim(), 16, y); y += 18; line = '';
      }
      line += w + ' ';
    }
    if (line.trim()) { x.fillText(line.trim(), 16, y); y += 18; }
    y += 10;
    if (y > H - 20) return;
  });
}

export function drawSystem(cv: HTMLCanvasElement): void {
  const [W, H] = [cv.width, cv.height]; const x = ctx(cv); bg(cv, x);
  x.fillStyle = TEAL; x.font = FONT.replace('{size}', '16');
  x.fillText('WLV-01  //  SYSTEM', 16, 26);
  rule(x, 36, W);
  const rows: [string, string, string][] = [
    ['VESSEL',  SYSTEM.designation,      AMBER],
    ['STATUS',  SYSTEM.status,           TEAL],
    ['MISSIONS',`${SYSTEM.missions.total} TOTAL · ${SYSTEM.missions.active} ACTIVE`, AMBER],
    ['SIGNALS', `${SYSTEM.transmissions} TRANSMISSIONS`, AMBER],
    ['ORBIT',   SYSTEM.orbit,            DIM],
  ];
  const rowH = Math.floor((H - 56) / rows.length);
  rows.forEach(([label, value, col], i) => {
    const y = 60 + i * rowH;
    x.fillStyle = DIM; x.font = FONT.replace('{size}', '11');
    x.fillText(label, 16, y);
    x.fillStyle = col; x.font = FONT.replace('{size}', '13');
    x.fillText(value, 110, y);
  });
}
