import { BOOKS } from './references.js';

const LS_KEY = 'ophir.plansData';

// Loader perezoso de planes desde /data/plans/*.json
const GLOB = import.meta.glob('@data/plans/*.json', { eager: true });

export const PLANS = Object.values(GLOB).map((mod) => mod.default ?? mod);

export function loadPlan(id) {
  return PLANS.find((p) => p.id === id) || null;
}

function todayEpoch(iso) {
  if (!iso) return 0;
  const d = new Date(iso);
  return Math.floor(d.getTime() / 864e5);
}

// ---------- localStorage helpers ----------

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStore(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

// Obtiene el estado de un plan (lo crea al vuelo si no existe).
export function getPlanState(planId) {
  const store = readStore();
  if (!store[planId]) {
    store[planId] = { startedAt: null, cursor: 1, done: [] };
    writeStore(store);
  }
  return store[planId];
}

export function savePlanState(planId, patch) {
  const store = readStore();
  store[planId] = { ...(store[planId] || { startedAt: null, cursor: 1, done: [] }), ...patch };
  writeStore(store);
}

export function startPlan(planId) {
  const now = new Date().toISOString();
  savePlanState(planId, { startedAt: now, cursor: 1, done: [] });
  return getPlanState(planId);
}

// Número de día natural del plan que corresponde a hoy (1..N).
export function currentDay(planId) {
  const plan = loadPlan(planId);
  const state = getPlanState(planId);
  if (!plan || !state.startedAt) return 1;
  const diff = todayEpoch(new Date().toISOString()) - todayEpoch(state.startedAt);
  return Math.min(Math.max(1, diff + 1), plan.days);
}

// Marca / desmarca un día como leído.
export function toggleDay(planId, day) {
  const state = getPlanState(planId);
  const done = state.done.includes(day)
    ? state.done.filter((d) => d !== day)
    : [...state.done, day];
  savePlanState(planId, { done, cursor: day });
}

// Calcula la racha (días consecutivos terminados hasta hoy o ayer).
export function streak(planId) {
  const state = getPlanState(planId);
  if (!state.startedAt || state.done.length === 0) return 0;
  const doneDates = state.done.map((d) => todayEpoch(state.startedAt) + d - 1);
  const doneSet = new Set(doneDates);
  let today = todayEpoch(new Date().toISOString());
  let count = 0;
  if (doneSet.has(today)) {
    count = 1;
    today--;
  } else if (doneSet.has(today - 1)) {
    count = 1;
    today -= 2;
  } else {
    return 0;
  }
  while (doneSet.has(today)) {
    count++;
    today--;
  }
  return count;
}

// Resuelve un ref de lectura (bookId, chapter) en {book, chapter} para el Lector.
export function resolvePlanRef(ref) {
  const book = BOOKS.find((b) => b.id === ref.bookId);
  if (!book) return null;
  return { book, chapter: ref.chapter, verseStart: null, verseEnd: null };
}