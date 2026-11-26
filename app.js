// ==========================================================
// PAUSAS ACTIVAS SST · v3
// Base compartida en Google Sheets + funcionamiento sin señal
// Las rutinas están en routines.js (constante ROUTINES)
// ==========================================================

const ADMIN_PASS = "admin123";

// URL del Apps Script publicado (/exec). Es la MISMA para todos los dispositivos.
const DEFAULT_SHEETS_URL = "https://script.google.com/macros/s/AKfycbyI-cy6u02mW0hcJLxtEJLtEOptv6OoYoq_2uyneZ6bGC1naGwQJ7B42SGFa2yBwV4v/exec";

// Debe ser IDÉNTICA a la variable API_KEY del archivo apps-script.gs
const API_KEY = "pausas-sst-2026";

const DEFAULT_SHIFTS = [
  { name: "Turno 1 · Día",   start: "06:00", slots: ["08:00", "10:00", "12:00", "14:00", "16:00"] },
  { name: "Turno 2 · Noche", start: "18:00", slots: ["20:00", "22:00", "00:00", "02:00", "04:00"] }
];
const SLOTS_ANTIGUAS = ["06:00", "09:00", "12:00", "15:00"];

const STORAGE_KEYS = {
  STAFF: "pausas_sst_staff_v1",
  ATTENDANCE: "pausas_sst_attendance_v1",
  SETTINGS: "pausas_sst_settings_v1",
  PENDING: "pausas_sst_pending_v1",
  STAFF_DIRTY: "pausas_sst_staff_dirty_v1"
};
const AUTO_SYNC_MS = 60000;

let staff = loadJSON(STORAGE_KEYS.STAFF, []);
let attendance = loadJSON(STORAGE_KEYS.ATTENDANCE, []);
let pending = loadJSON(STORAGE_KEYS.PENDING, []);
let staffDirty = localStorage.getItem(STORAGE_KEYS.STAFF_DIRTY) === "1";

let settings = Object.assign({
  companyName: "Pausas Activas SST",
  logoDataUrl: "",
  sheetsUrl: DEFAULT_SHEETS_URL,
  allowSkip: false,
  qrUrl: "",
  dailyGoal: 5,
  adminPassHash: "",
  minGapMinutes: 60,
  sstEmail: "",
  shiftMode: "dos",
  shifts: null,
  leaderPassHash: ""
}, loadJSON(STORAGE_KEYS.SETTINGS, {}));

// Migración desde versiones con 4 franjas sueltas y un solo turno
function migrarAjustes(cfg) {
  if (!Array.isArray(cfg.shifts) || !cfg.shifts.length) {
    const viejas = Array.isArray(cfg.slots) && cfg.slots.length ? cfg.slots : null;
    const personalizadas = viejas && viejas.join(",") !== SLOTS_ANTIGUAS.join(",");
    cfg.shifts = [
      { name: DEFAULT_SHIFTS[0].name, start: DEFAULT_SHIFTS[0].start,
        slots: personalizadas ? viejas.slice() : DEFAULT_SHIFTS[0].slots.slice() },
      { name: DEFAULT_SHIFTS[1].name, start: DEFAULT_SHIFTS[1].start, slots: DEFAULT_SHIFTS[1].slots.slice() }
    ];
  }
  if (!cfg.shifts[1]) cfg.shifts[1] = JSON.parse(JSON.stringify(DEFAULT_SHIFTS[1]));
  if (cfg.shiftMode !== "uno" && cfg.shiftMode !== "dos") cfg.shiftMode = "dos";
  delete cfg.slots;
  delete cfg.shiftStartHour;
  return cfg;
}
settings = migrarAjustes(settings);
if (!settings.sheetsUrl) settings.sheetsUrl = DEFAULT_SHEETS_URL;

let activeRoutine = null;
let activeParticipant = null;
let currentExIndex = 0;
let exRemaining = 0;
let exInterval = null;
let exPaused = false;
let pendingCompletedRecord = null;
let workerInView = null;
let lastSyncAt = null;
let syncing = false;

// El hash de administrador solo vive mientras la pestaña está abierta.
function getAdminHash() { try { return sessionStorage.getItem("pausas_sst_admin_hash") || ""; } catch { return ""; } }
function setAdminHash(h) { try { sessionStorage.setItem("pausas_sst_admin_hash", h || ""); } catch {} }

// ==========================================================
// UTILIDADES
// ==========================================================
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (err) { console.warn("No se pudo guardar en el dispositivo:", err); }
}

function pad2(n) { return String(n).padStart(2, "0"); }

function formatHMS(totalSec) {
  totalSec = Math.max(0, Math.floor(totalSec));
  return `${pad2(Math.floor(totalSec / 3600))}:${pad2(Math.floor((totalSec % 3600) / 60))}:${pad2(totalSec % 60)}`;
}

function formatMS(totalSec) {
  totalSec = Math.max(0, Math.floor(totalSec));
  return `${pad2(Math.floor(totalSec / 60))}:${pad2(totalSec % 60)}`;
}

function isoOf(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

// Fecha de JORNADA: con turno nocturno, lo ocurrido antes de la hora de
// inicio pertenece a la jornada del día anterior.
function jornadaStartHour() {
  const t = (Array.isArray(settings.shifts) && settings.shifts[0]) || DEFAULT_SHIFTS[0];
  return Math.floor(minutesOf(t.start || "00:00") / 60);
}

function jornadaISO(d) {
  const base = d || new Date();
  const h = jornadaStartHour();
  const x = new Date(base.getTime());
  if (h > 0 && x.getHours() < h) x.setDate(x.getDate() - 1);
  return isoOf(x);
}

function escapeHTML(str) {
  return String(str === null || str === undefined ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function makeRid() {
  return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256Hex(text) {
  try {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {}
  return "plain:" + text;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.add("hidden"), 4000);
}

function playBeep(freq = 880, duration = 0.25, delay = 0) {
  const chk = document.getElementById("chk-sound");
  if (chk && !chk.checked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.18, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(start); osc.stop(start + duration);
  } catch {}
}

function playStartChime() { playBeep(523.25, 0.16, 0); playBeep(783.99, 0.24, 0.15); }
function playEndChime()   { playBeep(880, 0.18, 0); playBeep(1046.5, 0.35, 0.18); }

function speakSpanish(text) {
  const chk = document.getElementById("chk-voice");
  if (!chk || !chk.checked || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES"; u.rate = 0.98;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ==========================================================
// TURNOS Y FRANJAS HORARIAS
// El turno y la rutina se deciden por la HORA en que el colaborador
// inicia su pausa, así que funciona igual aunque los turnos roten.
// ==========================================================
function minutesOf(hhmm) {
  const partes = String(hhmm || "00:00").split(":");
  return (Number(partes[0]) || 0) * 60 + (Number(partes[1]) || 0);
}

function hhmmOf(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

// Minutos transcurridos desde el inicio del turno (maneja el cruce de medianoche)
function relMin(mins, inicio) { return (mins - inicio + 1440) % 1440; }

function allShifts() {
  const lista = Array.isArray(settings.shifts) && settings.shifts.length ? settings.shifts : DEFAULT_SHIFTS;
  return [lista[0] || DEFAULT_SHIFTS[0], lista[1] || DEFAULT_SHIFTS[1]];
}

function activeShifts() {
  const todos = allShifts();
  return settings.shiftMode === "dos" ? todos : [todos[0]];
}

function shiftSlots(si) {
  const turnos = activeShifts();
  const t = turnos[si] || turnos[0];
  const inicio = minutesOf(t.start);
  return (t.slots || []).slice().sort((a, b) => relMin(minutesOf(a), inicio) - relMin(minutesOf(b), inicio));
}

function shiftEnd(si) {
  const turnos = activeShifts();
  if (turnos.length < 2) return turnos[0].start;
  return turnos[(si + 1) % turnos.length].start;
}

function shiftIndexForTime(d) {
  const turnos = activeShifts();
  if (turnos.length < 2) return 0;
  const m = (d || new Date()).getHours() * 60 + (d || new Date()).getMinutes();
  const s1 = minutesOf(turnos[0].start);
  const s2 = minutesOf(turnos[1].start);
  const enPrimero = s1 < s2 ? (m >= s1 && m < s2) : !(m >= s2 && m < s1);
  return enPrimero ? 0 : 1;
}

function shiftNameForTime(d) {
  const t = activeShifts()[shiftIndexForTime(d || new Date())];
  return (t && t.name) || "Turno único";
}

function blockForTime(d) {
  const ahora = d || new Date();
  const si = shiftIndexForTime(ahora);
  const turno = activeShifts()[si];
  const inicio = minutesOf(turno.start);
  const slots = shiftSlots(si);
  const actual = relMin(ahora.getHours() * 60 + ahora.getMinutes(), inicio);
  let idx = -1;
  slots.forEach((h, i) => { if (actual >= relMin(minutesOf(h), inicio)) idx = i; });
  if (idx < 0) idx = Math.max(0, slots.length - 1);
  return {
    shiftIndex: si,
    slotIndex: idx,
    routineIndex: slots.length ? idx % ROUTINES.length : 0,
    slot: slots[idx] || turno.start
  };
}

function routineIndexForNow(d) { return blockForTime(d).routineIndex; }

function nextSlotInfo(d) {
  const ahora = d || new Date();
  const m = ahora.getHours() * 60 + ahora.getMinutes();
  const seg = ahora.getSeconds();
  const todos = [];
  activeShifts().forEach((t, si) => shiftSlots(si).forEach(h => todos.push({ si, mins: minutesOf(h), label: h })));
  todos.sort((a, b) => a.mins - b.mins);
  if (!todos.length) return { label: "--:--", seconds: 0, tomorrow: true, si: 0 };
  const sig = todos.find(x => x.mins > m);
  if (sig) return Object.assign({}, sig, { seconds: (sig.mins - m) * 60 - seg, tomorrow: false });
  const primero = todos[0];
  return Object.assign({}, primero, { seconds: ((1440 - m) + primero.mins) * 60 - seg, tomorrow: true });
}

// Horas en las que se usa cada bloque de rutina (para el catálogo)
function horasDeBloque(ri) {
  const out = [];
  activeShifts().forEach((t, si) => shiftSlots(si).forEach((h, i) => {
    if (i % ROUTINES.length === ri) out.push(h);
  }));
  return [...new Set(out)].sort();
}

let scheduleViewShift = null;   // null = sigue al turno activo
let lastScheduleKey = "";

function renderSchedule() {
  const list = document.getElementById("schedule-list");
  if (!list) return;

  const turnos = activeShifts();
  const info = blockForTime();
  const verSi = scheduleViewShift === null ? info.shiftIndex : Math.min(scheduleViewShift, turnos.length - 1);
  const turno = turnos[verSi];
  const slots = shiftSlots(verSi);
  const esActivo = verSi === info.shiftIndex;

  const clave = JSON.stringify([verSi, esActivo ? info.slotIndex : -1, turnos]);
  if (clave !== lastScheduleKey) {
    let html = `<div class="shift-head">
        <span class="shift-name">${escapeHTML(turno.name)}${esActivo ? ' <em>en curso</em>' : ""}</span>
        <span class="shift-hours">${escapeHTML(turno.start)} a ${escapeHTML(shiftEnd(verSi))}</span>
      </div>`;

    html += slots.length
      ? slots.map((hora, i) => {
          const activo = esActivo && i === info.slotIndex;
          const nombre = ROUTINES[i % ROUTINES.length].name.replace(/^Bloque \d+:\s*/, "");
          return `<div class="schedule-slot ${activo ? "is-now" : ""}">
            <span class="slot-time">${escapeHTML(hora)}</span>
            <span class="slot-name">${escapeHTML(nombre)}</span>
            <span class="slot-tag">${activo ? "Ahora" : ""}</span>
          </div>`;
        }).join("")
      : `<p class="muted">Este turno no tiene franjas configuradas.</p>`;

    if (turnos.length > 1) {
      const otro = turnos[(verSi + 1) % turnos.length];
      html += `<button type="button" class="btn-link shift-toggle" id="btn-toggle-shift">Ver ${escapeHTML(otro.name)}</button>`;
    }

    list.innerHTML = html;
    const btn = document.getElementById("btn-toggle-shift");
    if (btn) btn.addEventListener("click", () => {
      scheduleViewShift = (verSi + 1) % turnos.length;
      lastScheduleKey = "";
      renderSchedule();
    });
    lastScheduleKey = clave;
  }

  const next = nextSlotInfo();
  document.getElementById("kiosk-block-badge").textContent = `Bloque ${info.routineIndex + 1} de ${ROUTINES.length}`;
  document.getElementById("next-routine-name").textContent = ROUTINES[info.routineIndex].name;
  document.getElementById("countdown-display").textContent = formatHMS(next.seconds);

  const badge = document.getElementById("timer-status-badge");
  badge.textContent = next.tomorrow ? "Fuera de horario" : `Próxima ${next.label}`;
  badge.className = `badge ${next.tomorrow ? "badge-idle" : "badge-active"}`;
}

setInterval(renderSchedule, 1000);

// ==========================================================
// CONTROL ANTIFRAUDE: intervalo mínimo entre pausas
// ==========================================================
function recDateTime(r) {
  const [y, m, d] = String(r.date || "").split("-").map(Number);
  const [hh, mm] = String(r.time || "00:00").split(":").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

function recordsFor(id) {
  return attendance
    .filter(r => String(r.id) === String(id))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

// Devuelve los minutos que faltan para poder hacer la siguiente pausa (0 = puede)
function cooldownMinutes(id) {
  const gap = Number(settings.minGapMinutes) || 0;
  if (!gap) return 0;
  const recs = recordsFor(id);
  if (!recs.length) return 0;
  const diff = recDateTime(recs[0]).getTime() + gap * 60000 - Date.now();
  return diff > 0 ? Math.ceil(diff / 60000) : 0;
}

// ==========================================================
// SINCRONIZACIÓN CON GOOGLE SHEETS
// ==========================================================
function getSheetsUrl() { return (settings.sheetsUrl || DEFAULT_SHEETS_URL || "").trim(); }

function setSyncState(loading, text = "Sincronizando con Google Sheets...") {
  const bar = document.getElementById("sync-bar");
  const label = document.getElementById("sync-bar-text");
  if (!bar) return;
  if (label) label.textContent = text;
  bar.classList.toggle("hidden", !loading);
}

function renderSyncInfo(message, state) {
  const txt = message || (lastSyncAt
    ? `Base sincronizada · ${staff.length} colaboradores · ${lastSyncAt}`
    : "Sin sincronizar todavía");
  const extra = pending.length ? ` · ${pending.length} registro(s) por enviar` : "";
  const dirty = staffDirty ? " · personal pendiente de subir" : "";
  document.querySelectorAll(".sync-info").forEach(el => {
    el.textContent = txt + extra + dirty;
    el.dataset.state = state || (pending.length || staffDirty ? "warn" : "ok");
  });
}

async function apiGet(params) {
  const url = getSheetsUrl();
  if (!url) throw new Error("sin-url");
  const qs = new URLSearchParams(Object.assign({ key: API_KEY }, params)).toString();
  const res = await fetch(`${url}?${qs}`, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error("http-" + res.status);
  return await res.json();
}

async function apiPost(payload) {
  const url = getSheetsUrl();
  if (!url) throw new Error("sin-url");
  const body = JSON.stringify(Object.assign({ key: API_KEY, adminHash: getAdminHash() }, payload));
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body, redirect: "follow"
    });
    if (!res.ok) throw new Error("http-" + res.status);
    return await res.json();
  } catch (err) {
    // Respaldo: algunas redes corporativas bloquean el POST
    if (body.length < 6000) return await apiGet({ action: payload.action, payload: body });
    throw err;
  }
}

function mergeAttendance(remoteList) {
  const seen = new Set();
  const out = [];
  [...(remoteList || []), ...pending].forEach(r => {
    if (!r || !r.id || !r.date) return;
    const key = r.rid || `${r.date}|${r.time}|${r.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(r);
  });
  out.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  return out;
}

function applyRemoteConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return;
  if (cfg.companyName) settings.companyName = cfg.companyName;
  if (cfg.dailyGoal) settings.dailyGoal = Number(cfg.dailyGoal) || 3;
  if (typeof cfg.allowSkip !== "undefined") settings.allowSkip = Boolean(cfg.allowSkip);
  if (cfg.qrUrl) settings.qrUrl = cfg.qrUrl;
  if (cfg.logoDataUrl) settings.logoDataUrl = cfg.logoDataUrl;
  if (cfg.adminPassHash) settings.adminPassHash = cfg.adminPassHash;
  if (typeof cfg.leaderPassHash !== "undefined") settings.leaderPassHash = cfg.leaderPassHash;
  if (typeof cfg.minGapMinutes !== "undefined") settings.minGapMinutes = Number(cfg.minGapMinutes) || 0;
  if (cfg.shiftMode === "uno" || cfg.shiftMode === "dos") settings.shiftMode = cfg.shiftMode;
  if (cfg.shiftsJson) {
    try {
      const turnos = JSON.parse(cfg.shiftsJson);
      if (Array.isArray(turnos) && turnos.length) settings.shifts = turnos;
    } catch {}
  }
  if (cfg.sstEmail) settings.sstEmail = cfg.sstEmail;
  settings = migrarAjustes(settings);
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
}

async function flushPending() {
  if (!pending.length) return;

  // Una pausa grupal son muchos registros: se envían en un solo lote.
  let lotesSoportados = true;
  while (lotesSoportados && pending.length > 1) {
    const lote = pending.slice(0, 20).map(r => Object.assign({}, r, {
      queuedMs: r.createdAtMs ? Math.max(0, Date.now() - r.createdAtMs) : 0
    }));
    let resp = null;
    try {
      resp = await apiPost({ action: "addAttendanceBatch", records: lote });
    } catch { return; }
    if (!resp || !resp.ok) {
      // Apps Script sin soporte de lotes: se cae al envío uno por uno
      lotesSoportados = false;
      break;
    }
    const enviados = new Set(lote.map(x => x.rid));
    pending = pending.filter(p => !enviados.has(p.rid));
    saveJSON(STORAGE_KEYS.PENDING, pending);
  }

  for (const rec of [...pending]) {
    try {
      const envio = Object.assign({}, rec);
      // Delta de reloj propio: el servidor calcula el momento real aunque
      // el celular tenga la fecha mal configurada.
      envio.queuedMs = rec.createdAtMs ? Math.max(0, Date.now() - rec.createdAtMs) : 0;
      const r = await apiPost({ action: "addAttendance", record: envio });
      if (r && r.ok) {
        pending = pending.filter(p => p.rid !== rec.rid);
        saveJSON(STORAGE_KEYS.PENDING, pending);
      } else break;
    } catch { break; }
  }
}

async function pushStaff(removeIds) {
  try {
    const r = await apiPost({ action: "saveStaff", staff, removeIds: removeIds || [], mode: "merge" });
    if (r && r.ok) {
      staffDirty = false;
      localStorage.setItem(STORAGE_KEYS.STAFF_DIRTY, "0");
      if (Array.isArray(r.staff)) {
        staff = r.staff;
        saveJSON(STORAGE_KEYS.STAFF, staff);
      }
      return true;
    }
    if (r && r.error === "requiere-clave-administrador") {
      showToast("Para guardar personal debes ingresar como administrador en este dispositivo.");
    }
  } catch {}
  staffDirty = true;
  localStorage.setItem(STORAGE_KEYS.STAFF_DIRTY, "1");
  return false;
}

async function pushConfig() {
  const cfg = {
    companyName: settings.companyName || "",
    dailyGoal: settings.dailyGoal || 3,
    allowSkip: Boolean(settings.allowSkip),
    qrUrl: settings.qrUrl || "",
    adminPassHash: settings.adminPassHash || "",
    leaderPassHash: settings.leaderPassHash || "",
    minGapMinutes: Number(settings.minGapMinutes) || 0,
    shiftMode: settings.shiftMode || "dos",
    shiftsJson: JSON.stringify(allShifts()),
    shiftStartHour: jornadaStartHour(),
    sstEmail: settings.sstEmail || ""
  };
  // El logo viaja siempre (vacío = quitarlo en todos los dispositivos)
  cfg.logoDataUrl = (settings.logoDataUrl && settings.logoDataUrl.length < 45000) ? settings.logoDataUrl : "";
  try {
    const r = await apiPost({ action: "saveConfig", config: cfg });
    return Boolean(r && r.ok);
  } catch { return false; }
}

async function syncNow(silent = false) {
  if (syncing) return false;
  if (!getSheetsUrl()) {
    if (!silent) showToast("Falta configurar la URL de Google Sheets en Configuración.");
    renderSyncInfo("Sin URL de Google Sheets configurada", "error");
    return false;
  }
  syncing = true;
  if (!silent) setSyncState(true, "Sincronizando base de datos...");
  try {
    await flushPending();
    if (staffDirty) await pushStaff();

    const data = await apiGet({ action: "load" });
    if (!data || !data.ok) throw new Error((data && data.error) || "respuesta-invalida");

    if (!staffDirty && Array.isArray(data.staff)) {
      staff = data.staff;
      saveJSON(STORAGE_KEYS.STAFF, staff);
    }
    attendance = mergeAttendance(data.attendance);
    saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
    applyRemoteConfig(data.config);

    lastSyncAt = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    applyBranding();
    refreshAll();
    if (workerInView) renderWorkerHistory(workerInView);
    renderSyncInfo(null, "ok");
    if (!silent) showToast(`Base actualizada: ${staff.length} colaboradores y ${attendance.length} registros.`);
    return true;
  } catch {
    renderSyncInfo("Sin conexión con la base compartida · trabajando con los datos de este dispositivo", "error");
    if (!silent) showToast("No se pudo conectar con Google Sheets. Revisa la URL en Configuración.");
    return false;
  } finally {
    syncing = false;
    setSyncState(false);
  }
}

setInterval(() => { if (!activeRoutine) syncNow(true); }, AUTO_SYNC_MS);
document.addEventListener("visibilitychange", () => { if (!document.hidden && !activeRoutine) syncNow(true); });
window.addEventListener("online", () => syncNow(true));

// ==========================================================
// PANTALLA DEL COLABORADOR
// ==========================================================
const cedulaInput = document.getElementById("cedula-input");
const cedulaPreview = document.getElementById("cedula-preview");
const btnMyHistory = document.getElementById("btn-my-history");

function findPerson(doc) {
  const key = String(doc || "").trim().toLowerCase();
  if (!key) return null;
  return staff.find(p => String(p.id).trim().toLowerCase() === key) || null;
}

function renderCedulaPreview() {
  const doc = cedulaInput.value.trim();
  if (!doc) {
    cedulaPreview.classList.add("hidden");
    btnMyHistory.classList.add("hidden");
    return;
  }
  const found = findPerson(doc);
  cedulaPreview.classList.remove("hidden");

  if (!found) {
    btnMyHistory.classList.add("hidden");
    cedulaPreview.className = "cedula-preview not-found";
    cedulaPreview.innerHTML = staff.length === 0
      ? `Aún no se ha descargado el listado de personal. Toca <strong>Actualizar base</strong> o revisa tu conexión.`
      : `La cédula <strong>${escapeHTML(doc)}</strong> no está registrada. Solicita al administrador que te agregue.`;
    return;
  }

  btnMyHistory.classList.remove("hidden");
  const hoy = jornadaISO();
  const misHoy = attendance.filter(r => r.date === hoy && String(r.id) === String(found.id));
  const meta = Number(settings.dailyGoal) || 3;
  const espera = cooldownMinutes(found.id);

  let estado = misHoy.length > 0
    ? `Hoy llevas <strong>${misHoy.length} de ${meta}</strong> pausas (última a las ${escapeHTML(misHoy[0].time)}).`
    : `Hoy llevas <strong>0 de ${meta}</strong> pausas realizadas.`;

  if (espera > 0) {
    estado += `<br/><span class="cooldown-note">Podrás iniciar tu siguiente pausa en ${espera} minuto(s).</span>`;
  }
  if (found.medical) {
    estado += `<br/><span class="medical-note">Tienes recomendaciones médicas registradas.</span>`;
  }

  cedulaPreview.className = "cedula-preview";
  cedulaPreview.innerHTML = `<strong>${escapeHTML(found.name)}</strong> · ${escapeHTML(found.area)}<br/><span style="font-size:0.82rem;">${estado}</span>`;
}

cedulaInput.addEventListener("input", renderCedulaPreview);

document.getElementById("form-cedula-start").addEventListener("submit", async e => {
  e.preventDefault();
  const doc = cedulaInput.value.trim();
  if (!doc) return;

  let person = findPerson(doc);
  if (!person) { await syncNow(true); person = findPerson(doc); }

  if (!person) {
    cedulaPreview.classList.remove("hidden");
    cedulaPreview.className = "cedula-preview not-found";
    cedulaPreview.innerHTML = `No puedes iniciar: la cédula <strong>${escapeHTML(doc)}</strong> no está registrada en el listado de personal.`;
    showToast("Cédula no registrada. Solo el personal autorizado puede iniciar.");
    cedulaInput.focus();
    return;
  }

  const espera = cooldownMinutes(person.id);
  if (espera > 0) {
    const cuando = new Date(Date.now() + espera * 60000);
    cedulaPreview.classList.remove("hidden");
    cedulaPreview.className = "cedula-preview not-found";
    cedulaPreview.innerHTML = `Ya registraste una pausa hace poco. Tu siguiente pausa estará disponible a las <strong>${pad2(cuando.getHours())}:${pad2(cuando.getMinutes())}</strong>.`;
    showToast(`Debes esperar ${espera} minuto(s) entre pausas.`);
    return;
  }

  activeParticipant = person;

  if (person.medical) {
    document.getElementById("medical-text").textContent = person.medical;
    document.getElementById("medical-modal").classList.remove("hidden");
    speakSpanish("Atención: tienes recomendaciones médicas registradas. Realiza solo los ejercicios autorizados.");
    return;
  }
  startGuidedBreak();
});

document.getElementById("btn-medical-cancel").addEventListener("click", () => {
  document.getElementById("medical-modal").classList.add("hidden");
  activeParticipant = null;
});

document.getElementById("btn-medical-continue").addEventListener("click", () => {
  document.getElementById("medical-modal").classList.add("hidden");
  startGuidedBreak();
});

document.getElementById("btn-sync-kiosk").addEventListener("click", async () => {
  await syncNow(false);
  renderCedulaPreview();
});

// ==========================================================
// REPRODUCTOR DE PAUSA GUIADA
// ==========================================================
function startGuidedBreak(opciones) {
  const op = opciones || {};
  const ri = typeof op.routineIndex === "number" ? op.routineIndex : routineIndexForNow();
  activeRoutine = ROUTINES[ri];
  currentExIndex = 0;
  exPaused = false;

  document.getElementById("guided-player").classList.remove("hidden");
  document.getElementById("player-routine-title").textContent = activeRoutine.name;

  const etiqueta = document.getElementById("player-participant-label");
  const banner = document.getElementById("player-medical-banner");

  if (groupMode) {
    const area = document.getElementById("group-area").value;
    const partes = ["PAUSA GRUPAL"];
    if (area) partes.push(area);
    if (groupLeaderName) partes.push("dirige " + groupLeaderName);
    etiqueta.textContent = partes.join(" · ");
    banner.textContent = "Cada quien realiza solo los ejercicios que pueda. Si alguien siente dolor, debe detenerse y avisar al líder.";
    banner.classList.remove("hidden");
  } else {
    etiqueta.textContent = `Participante: ${activeParticipant.name} (C.C. ${activeParticipant.id} · ${activeParticipant.area})`;
    if (activeParticipant.medical) {
      banner.textContent = `Recomendación médica: ${activeParticipant.medical}. Omite cualquier ejercicio que te genere dolor.`;
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  }

  loadExercise(0);
  document.getElementById("guided-player").scrollIntoView({ behavior: "smooth" });
}

function calcTotalRemaining() {
  if (!activeRoutine) return 0;
  let total = Math.max(0, exRemaining);
  for (let i = currentExIndex + 1; i < activeRoutine.exercises.length; i++) {
    total += activeRoutine.exercises[i].duration;
  }
  return total;
}

function loadExercise(idx) {
  clearInterval(exInterval);
  currentExIndex = idx;
  const ex = activeRoutine.exercises[idx];
  exRemaining = ex.duration;
  exPaused = false;

  if (typeof mountExerciseAnimator === "function") {
    mountExerciseAnimator(document.getElementById("player-visual"), ex.svgKey);
  }

  document.getElementById("player-step-label").textContent = `Ejercicio ${idx + 1} de ${activeRoutine.exercises.length}`;
  document.getElementById("player-exercise-name").textContent = ex.name;
  document.getElementById("player-exercise-desc").textContent = ex.desc;
  document.getElementById("player-exercise-moving").textContent = ex.moving;
  document.getElementById("player-exercise-prevents").textContent = ex.prevents;
  const breathEl = document.getElementById("player-exercise-breath");
  if (breathEl) {
    breathEl.textContent = ex.breath ||
      "Respira lento y continuo, sin contener el aire. Suspende y avisa a SST ante cualquier dolor.";
  }
  document.getElementById("player-ex-timer").textContent = formatMS(exRemaining);
  document.getElementById("player-total-timer").textContent = formatMS(calcTotalRemaining());
  document.getElementById("btn-ex-toggle").textContent = "Pausar";
  document.getElementById("player-progress-fill").style.width = `${(idx / activeRoutine.exercises.length) * 100}%`;

  const showSkip = Boolean(settings.allowSkip);
  document.getElementById("btn-ex-prev").classList.toggle("hidden", !showSkip);
  document.getElementById("btn-ex-next").classList.toggle("hidden", !showSkip);
  // Quien tiene restricción médica siempre puede omitir un ejercicio
  document.getElementById("btn-ex-skip-medical").classList.toggle(
    "hidden", showSkip || !(activeParticipant && activeParticipant.medical)
  );

  playStartChime();
  speakSpanish(`Ejercicio ${idx + 1}: ${ex.name}. ${ex.desc}`);

  exInterval = setInterval(() => {
    if (exPaused) return;
    exRemaining--;
    document.getElementById("player-ex-timer").textContent = formatMS(exRemaining);
    document.getElementById("player-total-timer").textContent = formatMS(calcTotalRemaining());
    if (exRemaining === 3) speakSpanish("Tres, dos, uno");
    if (exRemaining > 0 && exRemaining <= 3) playBeep(660, 0.12);
    if (exRemaining <= 0) {
      playEndChime();
      if (currentExIndex + 1 < activeRoutine.exercises.length) loadExercise(currentExIndex + 1);
      else finishGuidedBreak();
    }
  }, 1000);
}

function advanceExercise() {
  if (!activeRoutine) return;
  if (currentExIndex + 1 < activeRoutine.exercises.length) loadExercise(currentExIndex + 1);
  else finishGuidedBreak();
}

function finishGuidedBreak() {
  clearInterval(exInterval);
  document.getElementById("player-progress-fill").style.width = "100%";
  playEndChime();

  if (groupMode) {
    document.getElementById("guided-player").classList.add("hidden");
    activeRoutine = null;
    speakSpanish("Pausa grupal terminada. El líder debe marcar quiénes participaron.");
    abrirListaGrupal();
    return;
  }

  if (activeParticipant && activeRoutine) {
    const ahora = new Date();
    pendingCompletedRecord = {
      rid: makeRid(),
      createdAtMs: Date.now(),
      date: jornadaISO(ahora),
      time: `${pad2(ahora.getHours())}:${pad2(ahora.getMinutes())}`,
      id: activeParticipant.id,
      name: activeParticipant.name,
      area: activeParticipant.area,
      routine: activeRoutine.name,
      shift: shiftNameForTime(ahora),
      feeling: "Bien",
      segment: "",
      mode: "Individual",
      leader: ""
    };
    document.getElementById("feeling-worker-name").textContent =
      `${activeParticipant.name}, ¿cómo te sientes hoy después de tu pausa?`;
    document.getElementById("feeling-step-1").classList.remove("hidden");
    document.getElementById("feeling-step-2").classList.add("hidden");
    document.getElementById("feeling-modal").classList.remove("hidden");
    speakSpanish(`Excelente ${activeParticipant.name}. Selecciona cómo te sientes hoy para guardar tu registro.`);
  }

  document.getElementById("guided-player").classList.add("hidden");
  activeRoutine = null;
}

async function guardarRegistro(record) {
  attendance.unshift(record);
  saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
  pending.push(record);
  saveJSON(STORAGE_KEYS.PENDING, pending);

  const nombre = record.name;
  pendingCompletedRecord = null;
  activeParticipant = null;

  document.getElementById("feeling-modal").classList.add("hidden");
  cedulaInput.value = "";
  cedulaPreview.classList.add("hidden");
  btnMyHistory.classList.add("hidden");
  refreshAll();
  showToast(`¡Gracias ${nombre}! Tu pausa activa quedó registrada.`);

  setSyncState(true, "Guardando registro en la base compartida...");
  await flushPending();
  setSyncState(false);
  renderSyncInfo();
}

document.querySelectorAll(".btn-feeling").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!pendingCompletedRecord) return;
    const feeling = btn.dataset.feeling || "Bien";
    pendingCompletedRecord.feeling = feeling;

    // Si hay molestia, se pregunta el segmento corporal (morbilidad sentida)
    if (feeling.toLowerCase().includes("molestia")) {
      document.getElementById("feeling-step-1").classList.add("hidden");
      document.getElementById("feeling-step-2").classList.remove("hidden");
      speakSpanish("¿En qué parte del cuerpo sientes la molestia?");
      return;
    }
    await guardarRegistro(pendingCompletedRecord);
  });
});

document.querySelectorAll(".btn-segment").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!pendingCompletedRecord) return;
    pendingCompletedRecord.segment = btn.dataset.segment || "";
    await guardarRegistro(pendingCompletedRecord);
  });
});

document.getElementById("btn-ex-toggle").addEventListener("click", () => {
  exPaused = !exPaused;
  document.getElementById("btn-ex-toggle").textContent = exPaused ? "Reanudar" : "Pausar";
  if (typeof activeCanvasAnimator !== "undefined" && activeCanvasAnimator) {
    activeCanvasAnimator.setPaused(exPaused);
  }
});

document.getElementById("btn-ex-prev").addEventListener("click", () => {
  if (!activeRoutine || currentExIndex <= 0) return;
  loadExercise(currentExIndex - 1);
});

document.getElementById("btn-ex-next").addEventListener("click", advanceExercise);
document.getElementById("btn-ex-skip-medical").addEventListener("click", () => {
  showToast("Ejercicio omitido por recomendación médica.");
  advanceExercise();
});

document.getElementById("btn-close-player").addEventListener("click", () => {
  clearInterval(exInterval);
  activeParticipant = null;
  activeRoutine = null;
  document.getElementById("guided-player").classList.add("hidden");
  if (groupMode) {
    document.getElementById("group-setup").classList.remove("hidden");
    document.getElementById("group-checklist").classList.add("hidden");
  }
});

// ==========================================================
// HISTORIAL PERSONAL DEL TRABAJADOR
// ==========================================================
function workerStats(person) {
  const recs = recordsFor(person.id);
  const meta = Number(settings.dailyGoal) || 3;
  const hoy = jornadaISO();
  const mes = hoy.slice(0, 7);

  const delMes = recs.filter(r => String(r.date).startsWith(mes));
  const porDia = {};
  recs.forEach(r => { porDia[r.date] = (porDia[r.date] || 0) + 1; });

  const diasMes = Object.keys(porDia).filter(d => d.startsWith(mes));
  const diasMeta = diasMes.filter(d => porDia[d] >= meta).length;

  // Racha: días consecutivos hacia atrás con al menos una pausa
  let racha = 0;
  const cursor = new Date();
  if (!porDia[jornadaISO(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (porDia[jornadaISO(cursor)]) { racha++; cursor.setDate(cursor.getDate() - 1); }

  // Últimos 7 días
  const semana = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = jornadaISO(d);
    semana.push({
      iso,
      etiqueta: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"][d.getDay()],
      n: porDia[iso] || 0
    });
  }

  return {
    recs, meta,
    hoy: porDia[hoy] || 0,
    mesTotal: delMes.length,
    diasMeta, racha, semana,
    molestias: recs.filter(r => (r.feeling || "").toLowerCase().includes("molestia")).length
  };
}

function renderWorkerHistory(person) {
  const fresh = findPerson(person.id) || person;
  workerInView = fresh;
  const s = workerStats(fresh);

  document.getElementById("worker-identity").innerHTML = `
    <strong>${escapeHTML(fresh.name)}</strong>
    <span class="muted">C.C. ${escapeHTML(fresh.id)} · ${escapeHTML(fresh.area)}</span>
    ${fresh.medical ? `<div class="medical-banner" style="margin-top:0.6rem;">Recomendación médica registrada: ${escapeHTML(fresh.medical)}</div>` : ""}
  `;

  document.getElementById("worker-stats").innerHTML = `
    <div class="stat-box ${s.hoy >= s.meta ? "stat-ok" : "stat-pending"}">
      <span class="stat-value">${s.hoy}/${s.meta}</span><span class="stat-label">Pausas de hoy</span>
    </div>
    <div class="stat-box"><span class="stat-value">${s.mesTotal}</span><span class="stat-label">Pausas este mes</span></div>
    <div class="stat-box stat-ok"><span class="stat-value">${s.diasMeta}</span><span class="stat-label">Días con meta cumplida</span></div>
    <div class="stat-box"><span class="stat-value">${s.racha}</span><span class="stat-label">Días seguidos activo</span></div>
  `;

  const max = Math.max(s.meta, ...s.semana.map(d => d.n), 1);
  document.getElementById("worker-week").innerHTML = s.semana.map(d => `
    <div class="week-col">
      <div class="week-bar-wrap">
        <div class="week-bar ${d.n >= s.meta ? "is-goal" : ""}" style="height:${Math.round((d.n / max) * 100)}%"></div>
      </div>
      <span class="week-n">${d.n}</span>
      <span class="week-label">${d.etiqueta}</span>
    </div>
  `).join("");

  const tbody = document.getElementById("worker-history-body");
  if (!s.recs.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Todavía no tienes pausas registradas. ¡Haz la primera hoy!</td></tr>`;
  } else {
    tbody.innerHTML = s.recs.slice(0, 60).map(r => {
      const f = r.feeling || "Bien";
      const badge = f.toLowerCase().includes("molestia")
        ? `<span class="badge badge-no">${escapeHTML(f)}${r.segment ? " · " + escapeHTML(r.segment) : ""}</span>`
        : f === "Cansado"
          ? `<span class="badge badge-alert">${escapeHTML(f)}</span>`
          : `<span class="badge badge-ok">${escapeHTML(f)}</span>`;
      return `<tr>
        <td>${escapeHTML(r.date)}</td>
        <td>${escapeHTML(r.time)}</td>
        <td>${escapeHTML(r.routine)}</td>
        <td>${badge}</td>
      </tr>`;
    }).join("");
  }
}

function showWorkerView(person) {
  renderWorkerHistory(person);
  document.getElementById("kiosk-view").classList.add("hidden");
  document.getElementById("worker-view").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

btnMyHistory.addEventListener("click", async () => {
  const person = findPerson(cedulaInput.value.trim());
  if (!person) return;
  await syncNow(true);
  showWorkerView(person);
});

document.getElementById("btn-close-worker").addEventListener("click", () => {
  workerInView = null;
  document.getElementById("worker-view").classList.add("hidden");
  document.getElementById("kiosk-view").classList.remove("hidden");
});

document.getElementById("btn-print-constancia").addEventListener("click", () => {
  if (!workerInView) return;
  const s = workerStats(workerInView);
  const filas = s.recs.slice(0, 200).map(r =>
    `<tr><td>${escapeHTML(r.date)}</td><td>${escapeHTML(r.time)}</td><td>${escapeHTML(r.routine)}</td><td>${escapeHTML(r.feeling || "Bien")}</td></tr>`
  ).join("");
  abrirImpresion(`
    <h1>${escapeHTML(settings.companyName || "Pausas Activas SST")}</h1>
    <h2>Constancia de participación en pausas activas</h2>
    <table class="datos">
      <tr><td><b>Nombre</b></td><td>${escapeHTML(workerInView.name)}</td></tr>
      <tr><td><b>Documento</b></td><td>${escapeHTML(workerInView.id)}</td></tr>
      <tr><td><b>Área</b></td><td>${escapeHTML(workerInView.area)}</td></tr>
      <tr><td><b>Pausas registradas en el mes</b></td><td>${s.mesTotal}</td></tr>
      <tr><td><b>Días con meta cumplida</b></td><td>${s.diasMeta}</td></tr>
      <tr><td><b>Total histórico</b></td><td>${s.recs.length}</td></tr>
    </table>
    <h3>Detalle de pausas</h3>
    <table class="grid"><thead><tr><th>Fecha</th><th>Hora</th><th>Rutina</th><th>Bienestar</th></tr></thead><tbody>${filas}</tbody></table>
    <p class="pie">Documento generado automáticamente el ${new Date().toLocaleString("es-CO")} por el programa de pausas activas del SG-SST.</p>
    <div class="firmas"><div>Firma del colaborador</div><div>Responsable SST</div></div>
  `, "Constancia de pausas activas");
});

// ==========================================================
// IMPRESIÓN (constancias e informes, sin librerías externas)
// ==========================================================
function abrirImpresion(contenidoHTML, titulo) {
  const win = window.open("", "_blank");
  if (!win) { showToast("Permite las ventanas emergentes para generar el documento."); return; }
  const logo = settings.logoDataUrl ? `<img class="logo" src="${settings.logoDataUrl}" alt="" />` : "";
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${escapeHTML(titulo)}</title>
  <style>
    body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;padding:34px;max-width:900px;margin:0 auto;}
    .logo{height:52px;float:right;}
    h1{color:#0f766e;font-size:21px;margin:0 0 2px;}
    h2{font-size:16px;margin:0 0 16px;color:#334155;font-weight:600;}
    h3{font-size:14px;margin:22px 0 7px;color:#0f766e;border-bottom:2px solid #99f6e4;padding-bottom:4px;}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;}
    table.grid th{background:#f0fdfa;text-align:left;border:1px solid #cbd5e1;padding:5px 7px;}
    table.grid td{border:1px solid #e2e8f0;padding:5px 7px;}
    table.datos td{padding:4px 7px;border-bottom:1px solid #e2e8f0;}
    .kpis{display:flex;gap:10px;margin:14px 0;}
    .kpi{flex:1;border:2px solid #99f6e4;border-radius:10px;padding:10px;text-align:center;}
    .kpi b{display:block;font-size:22px;color:#0f766e;}
    .kpi span{font-size:11px;color:#64748b;}
    .pie{font-size:10.5px;color:#64748b;margin-top:26px;}
    .firmas{display:flex;gap:40px;margin-top:46px;font-size:11px;text-align:center;}
    .firmas div{flex:1;border-top:1px solid #0f172a;padding-top:5px;}
    @media print{ body{padding:0;} }
  </style></head><body>${logo}${contenidoHTML}
  <script>window.onload=()=>window.print();<\/script></body></html>`);
  win.document.close();
}

// ==========================================================
// ADMINISTRADOR
// ==========================================================
function enterAdminMode() {
  document.getElementById("kiosk-view").classList.add("hidden");
  document.getElementById("worker-view").classList.add("hidden");
  document.getElementById("admin-view").classList.remove("hidden");
  document.getElementById("admin-nav").classList.remove("hidden");
  document.getElementById("btn-open-admin").classList.add("hidden");
  document.getElementById("btn-exit-admin").classList.remove("hidden");
  switchAdminTab("cumplimiento");
  refreshAll();
  syncNow(true);
}

function exitAdminMode() {
  document.getElementById("admin-view").classList.add("hidden");
  document.getElementById("admin-nav").classList.add("hidden");
  document.getElementById("btn-exit-admin").classList.add("hidden");
  document.getElementById("btn-open-admin").classList.remove("hidden");
  document.getElementById("kiosk-view").classList.remove("hidden");
}

function switchAdminTab(tabName) {
  document.querySelectorAll("#admin-nav .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll("#admin-view .tab-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${tabName}`));
}

document.querySelectorAll("#admin-nav .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchAdminTab(btn.dataset.tab));
});

document.getElementById("btn-open-admin").addEventListener("click", () => {
  document.getElementById("admin-pass-input").value = "";
  document.getElementById("admin-login-error").classList.add("hidden");
  document.getElementById("admin-modal").classList.remove("hidden");
  document.getElementById("admin-pass-input").focus();
});

document.getElementById("btn-cancel-admin").addEventListener("click", () => {
  document.getElementById("admin-modal").classList.add("hidden");
});

async function checkAdminPass(value) {
  const guardado = (settings.adminPassHash || "").trim();
  const hash = await sha256Hex(value);
  if (guardado) return hash === guardado;
  return value === ADMIN_PASS;
}

document.getElementById("form-admin-login").addEventListener("submit", async e => {
  e.preventDefault();
  const val = document.getElementById("admin-pass-input").value.trim();
  if (await checkAdminPass(val)) {
    setAdminHash(await sha256Hex(val));
    document.getElementById("admin-modal").classList.add("hidden");
    enterAdminMode();
  } else {
    document.getElementById("admin-login-error").classList.remove("hidden");
  }
});

document.getElementById("btn-exit-admin").addEventListener("click", exitAdminMode);
document.getElementById("btn-sync-admin").addEventListener("click", () => syncNow(false));

// ---------- Cumplimiento ----------
function buildComplianceRows(dateStr) {
  const dayRecs = attendance.filter(r => r.date === dateStr);
  const map = new Map();
  staff.forEach(p => map.set(String(p.id), { id: p.id, name: p.name, area: p.area, count: 0, lastTime: "-" }));
  dayRecs.forEach(r => {
    const k = String(r.id);
    if (!map.has(k)) map.set(k, { id: r.id, name: r.name, area: r.area, count: 0, lastTime: "-" });
    const row = map.get(k);
    row.count++;
    if (row.lastTime === "-" || r.time > row.lastTime) row.lastTime = r.time;
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
}

function buildAreaSummary(allRows, dayRecs) {
  const areaMap = new Map();
  allRows.forEach(r => {
    const area = r.area || "Sin área";
    if (!areaMap.has(area)) areaMap.set(area, { area, total: 0, yes: 0, no: 0, pain: 0 });
    const it = areaMap.get(area);
    it.total++;
    if (r.count > 0) it.yes++; else it.no++;
  });
  dayRecs.forEach(r => {
    if ((r.feeling || "").toLowerCase().includes("molestia")) {
      const area = r.area || "Sin área";
      if (areaMap.has(area)) areaMap.get(area).pain++;
    }
  });
  return Array.from(areaMap.values())
    .map(a => ({ ...a, pct: a.total > 0 ? Math.round((a.yes / a.total) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct || a.area.localeCompare(b.area));
}

function renderCompliance() {
  const dateInput = document.getElementById("comp-date");
  if (!dateInput.value) dateInput.value = jornadaISO();
  const dateStr = dateInput.value;
  const statusFilter = document.getElementById("comp-status-filter").value;
  const query = document.getElementById("comp-search").value.trim().toLowerCase();

  const allRows = buildComplianceRows(dateStr);
  const dayRecs = attendance.filter(r => r.date === dateStr);
  const yes = allRows.filter(r => r.count > 0).length;
  const pct = allRows.length ? Math.round((yes / allRows.length) * 100) : 0;

  document.getElementById("stat-staff-count").textContent = allRows.length;
  document.getElementById("stat-yes-count").textContent = yes;
  document.getElementById("stat-no-count").textContent = allRows.length - yes;
  document.getElementById("stat-compliance-pct").textContent = `${pct}%`;
  document.getElementById("stat-today-attendance").textContent = allRows.reduce((a, r) => a + r.count, 0);
  document.getElementById("stat-pain-count").textContent =
    dayRecs.filter(r => (r.feeling || "").toLowerCase().includes("molestia")).length;

  // Resumen por área
  const areas = buildAreaSummary(allRows, dayRecs);
  const abody = document.getElementById("area-summary-body");
  abody.innerHTML = areas.length === 0
    ? `<tr><td colspan="6" class="muted">Sin datos de áreas todavía.</td></tr>`
    : areas.map(a => `<tr>
        <td><strong>${escapeHTML(a.area)}</strong></td>
        <td>${a.total}</td>
        <td><span class="badge badge-ok">${a.yes}</span></td>
        <td><span class="badge badge-no">${a.no}</span></td>
        <td><div class="mini-bar-wrap"><div class="mini-bar"><div class="mini-bar-fill" style="width:${a.pct}%"></div></div><strong>${a.pct}%</strong></div></td>
        <td>${a.pain > 0 ? `<span class="badge badge-no">${a.pain}</span>` : "0"}</td>
      </tr>`).join("");

  renderShiftSummary(dateStr);
  renderSegmentChart(dateStr);

  const filtered = allRows.filter(r => {
    if (statusFilter === "yes" && r.count === 0) return false;
    if (statusFilter === "no" && r.count > 0) return false;
    if (query) {
      const m = String(r.id).toLowerCase().includes(query) ||
                String(r.name).toLowerCase().includes(query) ||
                String(r.area).toLowerCase().includes(query);
      if (!m) return false;
    }
    return true;
  });

  const tbody = document.getElementById("compliance-table-body");
  tbody.innerHTML = filtered.length === 0
    ? `<tr><td colspan="6" class="muted">No hay colaboradores para mostrar. Carga tu personal en la pestaña <strong>Personal</strong>.</td></tr>`
    : filtered.map(r => `<tr>
        <td>${escapeHTML(r.id)}</td>
        <td><strong>${escapeHTML(r.name)}</strong></td>
        <td>${escapeHTML(r.area)}</td>
        <td><strong>${r.count}</strong></td>
        <td>${escapeHTML(r.lastTime)}</td>
        <td>${r.count > 0 ? `<span class="badge badge-ok">Sí cumplió</span>` : `<span class="badge badge-no">No ha hecho</span>`}</td>
      </tr>`).join("");
}

// ---------- Cumplimiento por turno ----------
function shiftOfRecord(r) {
  if (r && r.shift) return r.shift;
  return shiftNameForTime(recDateTime(r));
}

function renderShiftSummary(dateStr) {
  const tbody = document.getElementById("shift-summary-body");
  const card = document.getElementById("shift-summary-card");
  if (!tbody || !card) return;

  const turnos = activeShifts();
  card.classList.toggle("hidden", turnos.length < 2);
  if (turnos.length < 2) return;

  const delDia = attendance.filter(r => r.date === dateStr);
  tbody.innerHTML = turnos.map((t, i) => {
    const propios = delDia.filter(r => shiftOfRecord(r) === t.name);
    const personas = new Set(propios.map(r => String(r.id))).size;
    const molestias = propios.filter(r => (r.feeling || "").toLowerCase().includes("molestia")).length;
    return `<tr>
      <td><strong>${escapeHTML(t.name)}</strong></td>
      <td>${escapeHTML(t.start)} a ${escapeHTML(shiftEnd(i))}</td>
      <td><span class="badge badge-ok">${personas}</span></td>
      <td><strong>${propios.length}</strong></td>
      <td>${molestias > 0 ? `<span class="badge badge-no">${molestias}</span>` : "0"}</td>
    </tr>`;
  }).join("");
}

// ---------- Morbilidad sentida por segmento ----------
function recordsInRange(dateStr, days) {
  if (Number(days) === 1) return attendance.filter(r => r.date === dateStr);
  const desde = new Date();
  desde.setDate(desde.getDate() - (Number(days) - 1));
  const desdeISO = isoOf(desde);
  return attendance.filter(r => r.date >= desdeISO);
}

function renderSegmentChart(dateStr) {
  const cont = document.getElementById("segment-chart");
  const alerts = document.getElementById("segment-alerts");
  if (!cont) return;
  const days = document.getElementById("segment-range").value;
  const recs = recordsInRange(dateStr, days).filter(r => (r.feeling || "").toLowerCase().includes("molestia"));

  if (!recs.length) {
    cont.innerHTML = `<p class="muted">Sin molestias reportadas en el periodo seleccionado.</p>`;
    alerts.innerHTML = "";
    return;
  }

  const porSegmento = {};
  const porPersona = {};
  recs.forEach(r => {
    const seg = r.segment || "Sin especificar";
    porSegmento[seg] = (porSegmento[seg] || 0) + 1;
    const k = `${r.id}|${r.name}|${r.area}`;
    porPersona[k] = (porPersona[k] || 0) + 1;
  });

  const orden = Object.entries(porSegmento).sort((a, b) => b[1] - a[1]);
  const max = orden[0][1];
  cont.innerHTML = orden.map(([seg, n]) => `
    <div class="seg-row">
      <span class="seg-name">${escapeHTML(seg)}</span>
      <div class="seg-bar-wrap"><div class="seg-bar" style="width:${Math.round((n / max) * 100)}%"></div></div>
      <strong class="seg-n">${n}</strong>
    </div>
  `).join("");

  const criticos = Object.entries(porPersona).filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1]);
  alerts.innerHTML = criticos.length
    ? `<div class="alert-box"><strong>Requieren seguimiento (3 o más reportes en el periodo):</strong><ul>${
        criticos.map(([k, n]) => {
          const [id, name, area] = k.split("|");
          return `<li>${escapeHTML(name)} — ${escapeHTML(area)} (C.C. ${escapeHTML(id)}): <strong>${n}</strong> reportes</li>`;
        }).join("")
      }</ul><span class="muted">Considera remisión a medicina laboral e inspección del puesto de trabajo.</span></div>`
    : "";
}

document.getElementById("comp-date").addEventListener("change", renderCompliance);
document.getElementById("comp-status-filter").addEventListener("change", renderCompliance);
document.getElementById("comp-search").addEventListener("input", renderCompliance);
document.getElementById("segment-range").addEventListener("change", renderCompliance);

// ---------- Historial detallado ----------
function renderAttendanceHistory() {
  const filterDate = document.getElementById("filter-date").value;
  const areaSelect = document.getElementById("filter-area");
  const filterArea = areaSelect.value;
  const shiftSelect = document.getElementById("filter-shift");
  const filterShift = shiftSelect ? shiftSelect.value : "";
  const tbody = document.getElementById("attendance-history-body");

  const areas = [...new Set([...staff.map(s => s.area), ...attendance.map(a => a.area)])].filter(Boolean).sort();
  areaSelect.innerHTML = `<option value="">Todas las áreas</option>` +
    areas.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join("");
  areaSelect.value = filterArea;

  if (shiftSelect) {
    const turnos = activeShifts().map(t => t.name);
    shiftSelect.innerHTML = `<option value="">Todos los turnos</option>` +
      turnos.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join("");
    shiftSelect.value = filterShift;
  }

  const filtered = attendance.filter(rec => {
    if (filterDate && rec.date !== filterDate) return false;
    if (filterArea && rec.area !== filterArea) return false;
    if (filterShift && shiftOfRecord(rec) !== filterShift) return false;
    return true;
  });

  tbody.innerHTML = filtered.length === 0
    ? `<tr><td colspan="8" class="muted">Sin registros de asistencia para los filtros seleccionados.</td></tr>`
    : filtered.slice(0, 500).map(rec => {
        const f = rec.feeling || "Bien";
        const badge = f.toLowerCase().includes("molestia")
          ? `<span class="badge badge-no">${escapeHTML(f)}${rec.segment ? " · " + escapeHTML(rec.segment) : ""}</span>`
          : f === "Cansado"
            ? `<span class="badge badge-alert">${escapeHTML(f)}</span>`
            : `<span class="badge badge-ok">${escapeHTML(f)}</span>`;
        return `<tr>
          <td>${escapeHTML(rec.date)} ${escapeHTML(rec.time)}</td>
          <td>${escapeHTML(rec.id)}</td>
          <td><strong>${escapeHTML(rec.name)}</strong></td>
          <td>${escapeHTML(rec.area)}</td>
          <td>${escapeHTML(shiftOfRecord(rec))}</td>
          <td>${escapeHTML(rec.routine)}</td>
          <td>${badge}</td>
          <td><span class="muted">${escapeHTML(rec.origin || (pending.some(p => p.rid === rec.rid) ? "Por enviar" : "—"))}</span></td>
        </tr>`;
      }).join("");
}

document.getElementById("filter-date").addEventListener("change", renderAttendanceHistory);
document.getElementById("filter-area").addEventListener("change", renderAttendanceHistory);
const filtroTurno = document.getElementById("filter-shift");
if (filtroTurno) filtroTurno.addEventListener("change", renderAttendanceHistory);

document.getElementById("btn-clear-history").addEventListener("click", async () => {
  if (!confirm("¿Seguro que deseas borrar TODO el historial de asistencia?\n\nSe borrará también en Google Sheets y en todos los dispositivos. Esta acción no se puede deshacer.")) return;
  setSyncState(true, "Borrando historial compartido...");
  let ok = false;
  try { const r = await apiPost({ action: "clearAttendance" }); ok = Boolean(r && r.ok); } catch {}
  setSyncState(false);
  attendance = []; pending = [];
  saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
  saveJSON(STORAGE_KEYS.PENDING, pending);
  refreshAll();
  showToast(ok ? "Historial borrado en la hoja y en todos los dispositivos." : "Historial borrado solo en este dispositivo.");
});

// ---------- Personal ----------
function renderStaff() {
  const query = document.getElementById("staff-search").value.trim().toLowerCase();
  const tbody = document.getElementById("staff-table-body");
  const filtered = staff.filter(p =>
    String(p.id).toLowerCase().includes(query) ||
    String(p.name).toLowerCase().includes(query) ||
    String(p.area).toLowerCase().includes(query));

  tbody.innerHTML = filtered.length === 0
    ? `<tr><td colspan="5" class="muted">No hay personal registrado aún. Sube un archivo Excel/CSV o agrega manualmente.</td></tr>`
    : filtered.map(p => `<tr>
        <td>${escapeHTML(p.id)}</td>
        <td><strong>${escapeHTML(p.name)}</strong></td>
        <td>${escapeHTML(p.area)}</td>
        <td>${p.medical ? `<span class="badge badge-alert" title="${escapeHTML(p.medical)}">Con restricción</span>` : "—"}</td>
        <td>
          <button class="btn btn-outline btn-sm" data-edit-id="${escapeHTML(p.id)}">Editar</button>
          <button class="btn btn-danger-outline btn-sm" data-del-id="${escapeHTML(p.id)}">Eliminar</button>
        </td>
      </tr>`).join("");

  tbody.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = findPerson(btn.dataset.editId);
      if (!p) return;
      document.getElementById("staff-id").value = p.id;
      document.getElementById("staff-name").value = p.name;
      document.getElementById("staff-area").value = p.area;
      document.getElementById("staff-medical").value = p.medical || "";
      document.getElementById("staff-id").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  tbody.querySelectorAll("[data-del-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delId;
      if (!confirm(`¿Eliminar a este colaborador del listado en todos los dispositivos?`)) return;
      staff = staff.filter(p => String(p.id) !== String(id));
      saveJSON(STORAGE_KEYS.STAFF, staff);
      staffDirty = true;
      localStorage.setItem(STORAGE_KEYS.STAFF_DIRTY, "1");
      refreshAll();
      setSyncState(true, "Actualizando personal en la base compartida...");
      const ok = await pushStaff([id]);
      setSyncState(false);
      refreshAll();
      showToast(ok ? "Colaborador eliminado en todos los dispositivos." : "Eliminado localmente. Se subirá cuando haya conexión.");
    });
  });

  const dl = document.getElementById("staff-datalist");
  if (dl) {
    dl.innerHTML = staff.map(p =>
      `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)} · ${escapeHTML(p.area)}</option>`).join("");
  }

  document.getElementById("staff-total-badge").textContent = staff.length;
}

document.getElementById("staff-search").addEventListener("input", renderStaff);

document.getElementById("form-add-staff").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("staff-id").value.trim();
  const name = document.getElementById("staff-name").value.trim();
  const area = document.getElementById("staff-area").value.trim() || "Operaciones";
  const medical = document.getElementById("staff-medical").value.trim();
  if (!id || !name) return;

  const pos = staff.findIndex(p => String(p.id) === id);
  if (pos >= 0) staff[pos] = { id, name, area, medical };
  else staff.push({ id, name, area, medical });

  saveJSON(STORAGE_KEYS.STAFF, staff);
  staffDirty = true;
  localStorage.setItem(STORAGE_KEYS.STAFF_DIRTY, "1");
  e.target.reset();
  refreshAll();

  setSyncState(true, "Guardando personal en la base compartida...");
  const ok = await pushStaff();
  setSyncState(false);
  refreshAll();
  showToast(ok ? "Colaborador guardado. Ya aparece en todos los celulares."
               : "Guardado en este dispositivo. Se subirá cuando haya conexión.");
});

document.getElementById("csv-file-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);

  const processRows = async rows => {
    let added = 0, updated = 0;
    rows.forEach((cols, idx) => {
      if (!Array.isArray(cols) || cols.length < 2) return;
      const c0 = String(cols[0] ?? "").trim();
      const c1 = String(cols[1] ?? "").trim();
      const c2 = String(cols[2] ?? "").trim() || "Operaciones";
      const c3 = String(cols[3] ?? "").trim();
      if (!c0 || !c1) return;
      if (idx === 0 && /documento|cedula|cédula|^id$|codigo|código/i.test(c0)) return;
      const pos = staff.findIndex(p => String(p.id) === c0);
      if (pos >= 0) { staff[pos] = { id: c0, name: c1, area: c2, medical: c3 }; updated++; }
      else { staff.push({ id: c0, name: c1, area: c2, medical: c3 }); added++; }
    });

    saveJSON(STORAGE_KEYS.STAFF, staff);
    staffDirty = true;
    localStorage.setItem(STORAGE_KEYS.STAFF_DIRTY, "1");
    e.target.value = "";
    refreshAll();

    const fb = document.getElementById("upload-feedback");
    fb.classList.remove("hidden");
    fb.textContent = `Procesado: ${added} nuevos y ${updated} actualizados. Subiendo a la base compartida...`;

    setSyncState(true, "Subiendo listado de personal a Google Sheets...");
    const ok = await pushStaff();
    setSyncState(false);
    refreshAll();

    fb.textContent = ok
      ? `Carga completada: ${added} nuevos y ${updated} actualizados. Total ${staff.length} colaboradores disponibles en TODOS los dispositivos.`
      : `Carga guardada en este dispositivo (${staff.length} colaboradores). Sin conexión con Google Sheets: se subirá al reconectar.`;
    fb.style.background = ok ? "#ecfdf5" : "#fff7ed";
    fb.style.color = ok ? "#065f46" : "#9a3412";
    fb.style.borderColor = ok ? "#a7f3d0" : "#fed7aa";
  };

  const reader = new FileReader();
  if (isExcel && typeof XLSX !== "undefined") {
    reader.onload = ev => {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
      processRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false }));
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = ev => {
      const text = String(ev.target.result || "").replace(/^﻿/, "");
      processRows(text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
        const sep = line.includes(";") ? ";" : ",";
        return line.split(sep).map(c => c.replace(/^"|"$/g, "").trim());
      }));
    };
    reader.readAsText(file, "UTF-8");
  }
});

document.getElementById("btn-download-template").addEventListener("click", () => {
  exportExcelWorkbook([{ name: "Personal", rows: [
    ["Documento", "Nombre", "Area", "Restriccion"],
    ["10203040", "Carlos Perez", "Bodega", ""],
    ["10506070", "Maria Gomez", "Produccion", "Embarazo: evitar sentadilla y cargas"],
    ["10809010", "Juan Rodriguez", "Logistica", ""]
  ]}], "plantilla_personal_pausas.xlsx");
});

document.getElementById("btn-export-staff").addEventListener("click", () => {
  exportExcelWorkbook([{ name: "Personal", rows: [
    ["Documento", "Nombre", "Area", "Restriccion"],
    ...staff.map(p => [p.id, p.name, p.area, p.medical || ""])
  ]}], "personal_pausas_activas.xlsx");
});

// ---------- Catálogo de rutinas ----------
function renderRoutines() {
  const grid = document.getElementById("routines-grid");
  grid.innerHTML = "";
  ROUTINES.forEach((r, i) => {
    const horas = horasDeBloque(i);
    const card = document.createElement("div");
    card.className = "card routine-card";
    card.innerHTML = `
      <div>
        <span class="badge badge-active">${horas.length ? "Se usa a las " + escapeHTML(horas.join(" · ")) : "Sin franja asignada"} · ${r.exercises.length} ejercicios</span>
        <h3 style="margin:0.6rem 0 0.25rem;">${escapeHTML(r.name)}</h3>
        <p class="muted" style="margin:0;">${escapeHTML(r.focus)}</p>
        <ul class="routine-ex-list">
          ${r.exercises.map(ex => `
            <li class="routine-ex-item">
              <div class="routine-thumb">${getExerciseIllustration(ex.svgKey)}</div>
              <div>
                <strong>${escapeHTML(ex.name)}</strong> <span class="muted">(${ex.duration}s)</span>
                <span class="routine-ergo-meta"><strong>Mueve:</strong> ${escapeHTML(ex.moving)}</span>
                <span class="routine-ergo-meta"><strong>Evita:</strong> ${escapeHTML(ex.prevents)}</span>
              </div>
            </li>`).join("")}
        </ul>
      </div>`;
    grid.appendChild(card);
  });
  if (typeof initMiniCanvases === "function") initMiniCanvases();
}

// ==========================================================
// EXPORTACIONES E INFORMES
// ==========================================================
function exportExcelWorkbook(sheets, filename) {
  if (typeof XLSX !== "undefined") {
    const wb = XLSX.utils.book_new();
    sheets.forEach(s => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.name.slice(0, 31)));
    XLSX.writeFile(wb, filename);
    showToast(`Archivo Excel generado: ${filename}`);
  } else {
    const rows = sheets[0].rows;
    const csv = "﻿" + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile(csv, filename.replace(/\.xlsx$/i, ".csv"), "text/csv;charset=utf-8;");
  }
}

function downloadFile(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btn-export-compliance").addEventListener("click", () => {
  const dateStr = document.getElementById("comp-date").value || jornadaISO();
  const rows = buildComplianceRows(dateStr);
  if (!rows.length) { showToast("No hay datos para exportar."); return; }
  exportExcelWorkbook([{ name: "Cumplimiento", rows: [
    ["Fecha", "Cedula", "Nombre", "Area", "Pausas_Hechas", "Ultima_Pausa", "Estado"],
    ...rows.map(r => [dateStr, r.id, r.name, r.area, r.count, r.lastTime, r.count > 0 ? "SI CUMPLIO" : "NO HA HECHO"])
  ]}], `cumplimiento_pausas_${dateStr}.xlsx`);
});

document.getElementById("btn-export-attendance").addEventListener("click", () => {
  if (!attendance.length) { showToast("No hay registros de asistencia para exportar."); return; }
  exportExcelWorkbook([{ name: "Historial", rows: [
    ["Fecha", "Hora", "Cedula", "Nombre", "Area", "Turno", "Rutina", "Bienestar", "Segmento", "Modo", "Lider", "Origen"],
    ...attendance.map(r => [r.date, r.time, r.id, r.name, r.area, shiftOfRecord(r), r.routine, r.feeling || "Bien", r.segment || "", r.mode || "Individual", r.leader || "", r.origin || ""])
  ]}], `historial_pausas_activas_${jornadaISO()}.xlsx`);
});

document.getElementById("btn-export-excel-full").addEventListener("click", () => {
  const dateStr = document.getElementById("comp-date").value || jornadaISO();
  const compRows = buildComplianceRows(dateStr);
  const dayRecs = attendance.filter(r => r.date === dateStr);
  const areaRows = buildAreaSummary(compRows, dayRecs);
  const segRecs = recordsInRange(dateStr, document.getElementById("segment-range").value)
    .filter(r => (r.feeling || "").toLowerCase().includes("molestia"));

  exportExcelWorkbook([
    { name: "Cumplimiento", rows: [
      ["Fecha", "Cedula", "Nombre", "Area", "Pausas_Hechas", "Ultima_Pausa", "Estado"],
      ...compRows.map(r => [dateStr, r.id, r.name, r.area, r.count, r.lastTime, r.count > 0 ? "SI CUMPLIO" : "NO HA HECHO"])]},
    { name: "Resumen_por_Area", rows: [
      ["Area", "Total_Personal", "Si_Cumplieron", "Pendientes", "Porcentaje_Cumplimiento", "Alertas_Molestia"],
      ...areaRows.map(a => [a.area, a.total, a.yes, a.no, `${a.pct}%`, a.pain])]},
    { name: "Morbilidad_Sentida", rows: [
      ["Fecha", "Hora", "Cedula", "Nombre", "Area", "Segmento_Corporal"],
      ...segRecs.map(r => [r.date, r.time, r.id, r.name, r.area, r.segment || "Sin especificar"])]},
    { name: "Historial_Detallado", rows: [
      ["Fecha", "Hora", "Cedula", "Nombre", "Area", "Turno", "Rutina", "Bienestar", "Segmento", "Modo", "Lider", "Origen"],
      ...attendance.map(r => [r.date, r.time, r.id, r.name, r.area, shiftOfRecord(r), r.routine, r.feeling || "Bien", r.segment || "", r.mode || "Individual", r.leader || "", r.origin || ""])]}
  ], `reporte_completo_sst_${dateStr}.xlsx`);
});

document.getElementById("btn-monthly-report").addEventListener("click", () => {
  const mes = document.getElementById("report-month").value || jornadaISO().slice(0, 7);
  const recs = attendance.filter(r => String(r.date).startsWith(mes));
  if (!recs.length) { showToast("No hay registros en el mes seleccionado."); return; }

  const meta = Number(settings.dailyGoal) || 3;
  const dias = [...new Set(recs.map(r => r.date))].sort();

  // Cumplimiento promedio de los días con actividad
  const pcts = dias.map(d => {
    const ids = new Set(recs.filter(r => r.date === d).map(r => String(r.id)));
    return staff.length ? Math.round(ids.size * 100 / staff.length) : 0;
  });
  const promedio = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;

  // Por área
  const areas = {};
  staff.forEach(p => {
    const a = p.area || "Sin área";
    areas[a] = areas[a] || { total: 0, pausas: 0, molestias: 0 };
    areas[a].total++;
  });
  recs.forEach(r => {
    const a = r.area || "Sin área";
    areas[a] = areas[a] || { total: 0, pausas: 0, molestias: 0 };
    areas[a].pausas++;
    if ((r.feeling || "").toLowerCase().includes("molestia")) areas[a].molestias++;
  });

  const segs = {};
  recs.filter(r => (r.feeling || "").toLowerCase().includes("molestia"))
      .forEach(r => { const s = r.segment || "Sin especificar"; segs[s] = (segs[s] || 0) + 1; });

  const porPersona = {};
  recs.forEach(r => { porPersona[String(r.id)] = (porPersona[String(r.id)] || 0) + 1; });
  const sinPausas = staff.filter(p => !porPersona[String(p.id)]);

  abrirImpresion(`
    <h1>${escapeHTML(settings.companyName || "Pausas Activas SST")}</h1>
    <h2>Informe mensual del programa de pausas activas · ${escapeHTML(mes)}</h2>
    <div class="kpis">
      <div class="kpi"><b>${promedio}%</b><span>Cumplimiento promedio</span></div>
      <div class="kpi"><b>${recs.length}</b><span>Pausas registradas</span></div>
      <div class="kpi"><b>${dias.length}</b><span>Días con actividad</span></div>
      <div class="kpi"><b>${Object.values(segs).reduce((a, b) => a + b, 0)}</b><span>Molestias reportadas</span></div>
    </div>

    <h3>Cumplimiento por área</h3>
    <table class="grid"><thead><tr><th>Área</th><th>Personal</th><th>Pausas del mes</th><th>Promedio por persona</th><th>Molestias</th></tr></thead><tbody>
      ${Object.entries(areas).sort((a, b) => b[1].pausas - a[1].pausas).map(([a, v]) =>
        `<tr><td>${escapeHTML(a)}</td><td>${v.total}</td><td>${v.pausas}</td><td>${v.total ? (v.pausas / v.total).toFixed(1) : "0"}</td><td>${v.molestias}</td></tr>`).join("")}
    </tbody></table>

    ${activeShifts().length > 1 ? `<h3>Cumplimiento por turno</h3>
    <table class="grid"><thead><tr><th>Turno</th><th>Horario</th><th>Pausas del mes</th><th>Colaboradores distintos</th><th>Molestias</th></tr></thead><tbody>
      ${activeShifts().map((t, i) => {
        const propios = recs.filter(r => shiftOfRecord(r) === t.name);
        const personas = new Set(propios.map(r => String(r.id))).size;
        const mol = propios.filter(r => (r.feeling || "").toLowerCase().includes("molestia")).length;
        return `<tr><td>${escapeHTML(t.name)}</td><td>${escapeHTML(t.start)} a ${escapeHTML(shiftEnd(i))}</td><td>${propios.length}</td><td>${personas}</td><td>${mol}</td></tr>`;
      }).join("")}
    </tbody></table>` : ""}

    <h3>Morbilidad sentida por segmento corporal</h3>
    ${Object.keys(segs).length ? `<table class="grid"><thead><tr><th>Segmento</th><th>Reportes</th></tr></thead><tbody>
      ${Object.entries(segs).sort((a, b) => b[1] - a[1]).map(([s, n]) => `<tr><td>${escapeHTML(s)}</td><td>${n}</td></tr>`).join("")}
    </tbody></table>` : `<p>Sin molestias reportadas en el periodo.</p>`}

    <h3>Personal sin pausas registradas en el mes (${sinPausas.length})</h3>
    ${sinPausas.length ? `<table class="grid"><thead><tr><th>Cédula</th><th>Nombre</th><th>Área</th></tr></thead><tbody>
      ${sinPausas.map(p => `<tr><td>${escapeHTML(p.id)}</td><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.area)}</td></tr>`).join("")}
    </tbody></table>` : `<p>Todo el personal registró al menos una pausa.</p>`}

    <p class="pie">Meta definida: ${meta} pausas por colaborador al día. Informe generado el ${new Date().toLocaleString("es-CO")}.
    Las molestias reportadas constituyen morbilidad sentida y son insumo del sistema de vigilancia epidemiológica de desórdenes músculo-esqueléticos.</p>
    <div class="firmas"><div>Responsable SG-SST</div><div>Representante COPASST</div></div>
  `, `Informe pausas activas ${mes}`);
});

// ==========================================================
// CONFIGURACIÓN
// ==========================================================
function applyBranding() {
  document.getElementById("brand-title").textContent = settings.companyName || "Pausas Activas SST";

  const logoWrap = document.getElementById("brand-logo-wrap");
  document.body.classList.toggle("tiene-logo", Boolean(settings.logoDataUrl));
  if (settings.logoDataUrl) {
    logoWrap.classList.add("has-logo");
    logoWrap.innerHTML = `<img src="${settings.logoDataUrl}" alt="${escapeHTML(settings.companyName || "Logo de la empresa")}" />`;
  } else {
    logoWrap.classList.remove("has-logo");
    logoWrap.textContent = "SST";
  }

  const prev = document.getElementById("logo-preview");
  if (prev) {
    prev.innerHTML = settings.logoDataUrl
      ? `<img src="${settings.logoDataUrl}" alt="Vista previa del logo" />`
      : `<span class="muted">Sin logo</span>`;
  }

  const sub = document.getElementById("brand-subtitle");
  if (sub) {
    sub.textContent = settings.shiftMode === "dos"
      ? "Dos turnos de 12 horas · Personal de pie y esfuerzo físico"
      : "Personal de pie y esfuerzo físico";
  }

  document.getElementById("cfg-company").value = settings.companyName || "";
  document.getElementById("cfg-daily-goal").value = String(settings.dailyGoal || 5);
  document.getElementById("cfg-sheets-url").value = settings.sheetsUrl || "";
  document.getElementById("cfg-allow-skip").checked = Boolean(settings.allowSkip);
  document.getElementById("cfg-min-gap").value = String(Number(settings.minGapMinutes) || 0);
  document.getElementById("cfg-sst-email").value = settings.sstEmail || "";
  document.getElementById("cfg-shift-mode").value = settings.shiftMode || "dos";
  renderShiftsEditor();

  const qr = settings.qrUrl || (location.href.startsWith("http") ? location.href.split("?")[0] : "https://sstfritosjs.github.io/pausasactivas/");
  document.getElementById("cfg-qr-url").value = qr;
  updateQRPreview(qr);
}

// Turnos mostrados en el formulario (según el modo elegido, aún sin guardar)
function editorShifts() {
  const sel = document.getElementById("cfg-shift-mode");
  const modo = (sel && sel.value) || settings.shiftMode || "dos";
  const todos = allShifts();
  return modo === "dos" ? todos : [todos[0]];
}

function renderShiftsEditor() {
  const cont = document.getElementById("shifts-editor");
  if (!cont) return;
  const turnos = editorShifts();

  cont.innerHTML = turnos.map((t, i) => `
    <fieldset class="shift-card">
      <legend>${escapeHTML(t.name || "Turno " + (i + 1))}</legend>
      <div class="form-row">
        <div class="form-group">
          <label for="shift-name-${i}">Nombre del turno</label>
          <input type="text" id="shift-name-${i}" value="${escapeHTML(t.name || "")}" />
        </div>
        <div class="form-group">
          <label for="shift-start-${i}">Hora de inicio</label>
          <input type="time" id="shift-start-${i}" value="${escapeHTML(t.start || "06:00")}" />
        </div>
      </div>
      <div class="form-group">
        <label for="shift-slots-${i}">Horas de pausa (separadas por coma)</label>
        <input type="text" id="shift-slots-${i}" value="${escapeHTML((t.slots || []).join(", "))}" />
        <small class="muted">Las ${ROUTINES.length} rutinas rotan en el orden de estas horas.</small>
      </div>
      <button type="button" class="btn btn-outline btn-sm" data-gen-slots="${i}">Generar cada 2 horas</button>
    </fieldset>
  `).join("");

  cont.querySelectorAll("[data-gen-slots]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.genSlots);
      const inicio = minutesOf(document.getElementById(`shift-start-${i}`).value || "06:00");
      const n = Number(document.getElementById("cfg-daily-goal").value) || 5;
      const horas = [];
      for (let k = 1; k <= n; k++) horas.push(hhmmOf(inicio + k * 120));
      document.getElementById(`shift-slots-${i}`).value = horas.join(", ");
      showToast(`Franjas generadas cada 2 horas desde las ${hhmmOf(inicio)}.`);
    });
  });
}

document.getElementById("cfg-shift-mode").addEventListener("change", renderShiftsEditor);

function updateQRPreview(url) {
  const clean = (url || "").trim();
  if (!clean) return;
  document.getElementById("qr-image").src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(clean)}`;
  document.getElementById("qr-caption").textContent = clean;
}

// El logo se reduce y comprime: un archivo grande no cabe en la hoja de
// Google y por eso antes no llegaba a los demás dispositivos.
const LOGO_MAX_CHARS = 28000;

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

async function comprimirLogo(file) {
  const img = await cargarImagen(file);
  const escala = Math.min(420 / img.width, 140 / img.height, 1);
  const w = Math.max(1, Math.round(img.width * escala));
  const h = Math.max(1, Math.round(img.height * escala));

  const lienzo = document.createElement("canvas");
  lienzo.width = w; lienzo.height = h;
  lienzo.getContext("2d").drawImage(img, 0, 0, w, h);

  let url = lienzo.toDataURL("image/png");   // conserva la transparencia
  if (url.length > LOGO_MAX_CHARS) {
    const plano = document.createElement("canvas");
    plano.width = w; plano.height = h;
    const ctx = plano.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.85, 0.72, 0.6, 0.5, 0.4]) {
      url = plano.toDataURL("image/jpeg", q);
      if (url.length <= LOGO_MAX_CHARS) break;
    }
  }
  return url;
}

document.getElementById("cfg-logo-file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    setSyncState(true, "Optimizando el logo...");
    settings.logoDataUrl = await comprimirLogo(file);
    saveJSON(STORAGE_KEYS.SETTINGS, settings);
    applyBranding();
    const ok = await pushConfig();
    setSyncState(false);
    const kb = Math.round(settings.logoDataUrl.length / 1024);
    showToast(ok
      ? `Logo actualizado (${kb} KB). Ya se ve en todos los dispositivos.`
      : `Logo guardado en este dispositivo (${kb} KB). Se subirá al reconectar.`);
  } catch {
    setSyncState(false);
    showToast("No se pudo procesar la imagen. Intenta con un archivo PNG o JPG.");
  }
  e.target.value = "";
});

document.getElementById("btn-remove-logo").addEventListener("click", async () => {
  settings.logoDataUrl = "";
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  applyBranding();
  setSyncState(true, "Quitando el logo en todos los dispositivos...");
  const ok = await pushConfig();
  setSyncState(false);
  showToast(ok ? "Logo eliminado en todos los dispositivos." : "Logo eliminado en este dispositivo.");
});

document.getElementById("form-settings").addEventListener("submit", async e => {
  e.preventDefault();
  settings.companyName = document.getElementById("cfg-company").value.trim() || "Pausas Activas SST";
  settings.dailyGoal = Number(document.getElementById("cfg-daily-goal").value) || 3;
  settings.sheetsUrl = document.getElementById("cfg-sheets-url").value.trim();
  settings.allowSkip = document.getElementById("cfg-allow-skip").checked;
  settings.minGapMinutes = Number(document.getElementById("cfg-min-gap").value) || 0;
  settings.sstEmail = document.getElementById("cfg-sst-email").value.trim();

  const modo = document.getElementById("cfg-shift-mode").value === "dos" ? "dos" : "uno";
  const previos = allShifts();
  const leidos = editorShifts().map((t, i) => {
    const nombre = (document.getElementById(`shift-name-${i}`).value || "").trim() || `Turno ${i + 1}`;
    const inicio = (document.getElementById(`shift-start-${i}`).value || "").trim() || DEFAULT_SHIFTS[i].start;
    const horas = (document.getElementById(`shift-slots-${i}`).value || "")
      .split(",")
      .map(x => x.trim())
      .filter(x => /^\d{1,2}:\d{2}$/.test(x))
      .map(x => hhmmOf(minutesOf(x)));
    return { name: nombre, start: inicio, slots: horas.length ? horas : previos[i].slots.slice() };
  });

  settings.shiftMode = modo;
  settings.shifts = modo === "dos" ? leidos : [leidos[0], previos[1]];
  settings = migrarAjustes(settings);
  lastScheduleKey = "";
  scheduleViewShift = null;

  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  applyBranding();
  renderSchedule();
  renderRoutines();
  refreshAll();
  renderShiftsEditor();

  setSyncState(true, "Guardando configuración compartida...");
  const ok = await pushConfig();
  setSyncState(false);
  showToast(ok ? "Configuración guardada para todos los dispositivos." : "Configuración guardada solo en este dispositivo.");
});

document.getElementById("btn-test-conn").addEventListener("click", async () => {
  const fb = document.getElementById("conn-feedback");
  const url = document.getElementById("cfg-sheets-url").value.trim();
  if (url) settings.sheetsUrl = url;
  fb.classList.remove("hidden");
  fb.textContent = "Probando conexión con Google Sheets...";
  fb.style.background = "#f8fafc"; fb.style.color = "#334155"; fb.style.borderColor = "#e2e8f0";
  try {
    const r = await apiGet({ action: "ping" });
    if (!r || !r.ok) throw new Error((r && r.error) || "sin-respuesta");
    fb.textContent = `Conexión correcta. La hoja tiene ${r.staff} colaboradores cargados.`;
    fb.style.background = "#ecfdf5"; fb.style.color = "#065f46"; fb.style.borderColor = "#a7f3d0";
    saveJSON(STORAGE_KEYS.SETTINGS, settings);
    await syncNow(true);
  } catch (err) {
    fb.textContent = `No hay conexión con la hoja (${String(err.message || err)}). Verifica que publicaste el Apps Script como "Aplicación web" con acceso "Cualquier persona" y que la URL termina en /exec.`;
    fb.style.background = "#fef2f2"; fb.style.color = "#991b1b"; fb.style.borderColor = "#fecaca";
  }
});

document.getElementById("form-change-pass").addEventListener("submit", async e => {
  e.preventDefault();
  const cur = document.getElementById("cfg-pass-current").value.trim();
  const next = document.getElementById("cfg-pass-new").value.trim();
  const conf = document.getElementById("cfg-pass-confirm").value.trim();
  const fb = document.getElementById("pass-feedback");

  const msg = (t, err = false) => {
    fb.textContent = t;
    fb.classList.remove("hidden");
    fb.style.background = err ? "#fef2f2" : "#ecfdf5";
    fb.style.color = err ? "#991b1b" : "#065f46";
    fb.style.borderColor = err ? "#fecaca" : "#a7f3d0";
    showToast(t);
  };

  if (!(await checkAdminPass(cur))) return msg("La clave actual es incorrecta.", true);
  if (next.length < 4) return msg("La nueva clave debe tener al menos 4 caracteres.", true);
  if (next !== conf) return msg("La confirmación no coincide con la nueva clave.", true);

  settings.adminPassHash = await sha256Hex(next);
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  setAdminHash(settings.adminPassHash);
  e.target.reset();

  const ok = await pushConfig();
  msg(ok ? "Clave actualizada en todos los dispositivos. Úsala en tu próximo ingreso."
         : "Clave actualizada solo en este dispositivo (sin conexión con la hoja).");
});

document.getElementById("btn-gen-qr").addEventListener("click", async () => {
  const url = document.getElementById("cfg-qr-url").value.trim();
  if (!url) return;
  settings.qrUrl = url;
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  updateQRPreview(url);
  await pushConfig();
  showToast("Código QR actualizado.");
});

document.getElementById("btn-print-qr").addEventListener("click", () => {
  const url = document.getElementById("cfg-qr-url").value.trim();
  abrirImpresion(`
    <div style="text-align:center;border:4px solid #0f766e;border-radius:18px;padding:28px;">
      <h1 style="font-size:26px;">${escapeHTML(settings.companyName || "Pausas Activas SST")}</h1>
      <h2 style="color:#ea580c;font-size:19px;">PAUSAS ACTIVAS · 5 MINUTOS</h2>
      <p style="font-size:15px;">Escanea el código QR con tu celular, ingresa tu <strong>número de cédula</strong> y realiza tu pausa activa.</p>
      <img style="width:280px;height:280px;" src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}" alt="QR" />
      <p style="font-size:12px;color:#64748b;">${escapeHTML(url)}</p>
    </div>`, "Cartel QR Pausas Activas");
});

document.getElementById("btn-backup-export").addEventListener("click", () => {
  downloadFile(JSON.stringify({ exportedAt: new Date().toISOString(), staff, attendance, settings }, null, 2),
    `respaldo_pausas_sst_${jornadaISO()}.json`, "application/json");
  showToast("Respaldo descargado.");
});

document.getElementById("btn-backup-import").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data.staff)) staff = data.staff;
      if (Array.isArray(data.attendance)) attendance = data.attendance;
      if (data.settings) settings = { ...settings, ...data.settings };
      saveJSON(STORAGE_KEYS.STAFF, staff);
      saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
      saveJSON(STORAGE_KEYS.SETTINGS, settings);
      staffDirty = true;
      localStorage.setItem(STORAGE_KEYS.STAFF_DIRTY, "1");
      applyBranding(); refreshAll();
      setSyncState(true, "Subiendo respaldo a la base compartida...");
      await pushStaff();
      setSyncState(false);
      refreshAll();
      showToast("Respaldo restaurado y sincronizado.");
    } catch { showToast("Archivo de respaldo inválido."); }
    e.target.value = "";
  };
  reader.readAsText(file, "UTF-8");
});

// ==========================================================
// CONSEJOS SST
// ==========================================================
const SST_TIPS = [
  "Manipulación de cargas: Antes de levantar un objeto, evalúa su peso y tamaño. Si supera los 25 kg (hombres) o 12.5 kg (mujeres), pide ayuda o usa una ayuda mecánica.",
  "Técnica de levantamiento: Separa los pies al ancho de los hombros, flexiona las rodillas (no la espalda) y haz la fuerza con las piernas al subir.",
  "Carga pegada al cuerpo: Mantén la caja u objeto lo más cerca posible de tu abdomen; alejar la carga multiplica la presión sobre tu columna lumbar.",
  "Cero giros de cintura: Nunca gires el tronco mientras sostienes peso. Da pasos cortos con los pies para girar todo el cuerpo en bloque.",
  "Agarre seguro: Sujeta la carga con toda la palma de la mano y no solo con la punta de los dedos, para evitar lesiones de muñeca y caídas de objetos.",
  "Planifica el recorrido: Antes de levantar una carga, verifica que el camino esté despejado, seco y sin obstáculos.",
  "Usa ayudas mecánicas: Si hay carretillas, estibadores o carros disponibles, úsalos. Empujar una carga es más seguro para la espalda que halarla.",
  "Descarga controlada: Al dejar una carga en el piso, vuelve a doblar las rodillas con la espalda recta; evita soltar el peso de golpe.",
  "Altura segura: Evita ubicar cargas pesadas por encima del nivel de los hombros; usa escaleras seguras o pide apoyo.",
  "Trabajo de pie prolongado: Alterna el peso del cuerpo entre una pierna y otra, y apoya brevemente un pie sobre un reposapiés si tu puesto lo permite.",
  "Hidratación constante: Toma un vaso de agua al terminar tu pausa activa para mantener los músculos oxigenados y prevenir calambres.",
  "Uso de EPP: Verifica que tus guantes, botas de seguridad y demás elementos de protección estén en buen estado antes de iniciar tu labor.",
  "Orden y aseo (5S): Mantén tu área y los pasillos libres de cajas, cables o derrames. Un lugar ordenado previene la mayoría de las caídas.",
  "Reporte oportuno: Si identificas un piso resbaloso, una estiba rota o una herramienta dañada, repórtalo de inmediato a SST.",
  "Respeta tus pausas: Cinco minutos de estiramiento ayudan a reducir la fatiga muscular acumulada al final del turno.",
  "Escucha a tu cuerpo: Si sientes dolor punzante en la espalda, hormigueo en manos o mareo, detén la actividad y avisa a tu jefe o a SST.",
  "Descanso y concentración: La fatiga disminuye tus reflejos. Si manejas cargas o equipos y te sientes agotado, haz una micro-pausa.",
  "Trabajo en equipo: Al cargar objetos largos o pesados entre dos personas, coordinen el conteo antes de levantar y bajar al mismo tiempo."
];
let currentTipIdx = 0;
document.getElementById("btn-next-tip").addEventListener("click", () => {
  currentTipIdx = (currentTipIdx + 1) % SST_TIPS.length;
  document.getElementById("sst-tip-text").textContent = SST_TIPS[currentTipIdx];
});

// ==========================================================
// MODO GRUPAL
// Un líder dirige la pausa para todo el grupo y al terminar
// marca quiénes participaron. Pensado para una tablet o TV en planta.
// ==========================================================
let groupMode = false;
let groupRoutineIndex = 0;
let groupLeaderName = "";
const groupSelected = new Set();
const groupSegments = new Map();
let groupSegmentTarget = null;

async function checkGroupPass(valor) {
  const h = await sha256Hex(valor);
  if (settings.leaderPassHash && h === settings.leaderPassHash) return true;
  return await checkAdminPass(valor);
}

function fillGroupSelectors() {
  const sel = document.getElementById("group-block");
  const actual = routineIndexForNow();
  const previo = sel.value;
  sel.innerHTML = ROUTINES.map((r, i) =>
    `<option value="${i}">${escapeHTML(r.name)}${i === actual ? " — corresponde ahora" : ""}</option>`
  ).join("");
  sel.value = previo !== "" && ROUTINES[previo] ? previo : String(actual);

  const areas = [...new Set(staff.map(p => p.area))].filter(Boolean).sort();
  const opciones = `<option value="">Todas las áreas</option>` +
    areas.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join("");

  const sArea = document.getElementById("group-area");
  const prevA = sArea.value;
  sArea.innerHTML = opciones;
  sArea.value = prevA;

  const sFiltro = document.getElementById("group-filter-area");
  const prevF = sFiltro.value;
  sFiltro.innerHTML = opciones;
  sFiltro.value = prevF;
}

function enterGroupMode() {
  groupMode = true;
  groupSelected.clear();
  groupSegments.clear();
  fillGroupSelectors();
  document.getElementById("kiosk-view").classList.add("hidden");
  document.getElementById("worker-view").classList.add("hidden");
  document.getElementById("guided-player").classList.add("hidden");
  document.getElementById("group-view").classList.remove("hidden");
  document.getElementById("group-setup").classList.remove("hidden");
  document.getElementById("group-checklist").classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitGroupMode() {
  groupMode = false;
  clearInterval(exInterval);
  activeRoutine = null;
  activeParticipant = null;
  groupSelected.clear();
  groupSegments.clear();
  document.getElementById("guided-player").classList.add("hidden");
  document.getElementById("group-view").classList.add("hidden");
  document.getElementById("kiosk-view").classList.remove("hidden");
}

document.getElementById("btn-group-mode").addEventListener("click", () => {
  document.getElementById("group-pass-input").value = "";
  document.getElementById("group-login-error").classList.add("hidden");
  document.getElementById("group-modal").classList.remove("hidden");
  document.getElementById("group-pass-input").focus();
});

document.getElementById("btn-cancel-group").addEventListener("click", () => {
  document.getElementById("group-modal").classList.add("hidden");
});

document.getElementById("form-group-login").addEventListener("submit", async e => {
  e.preventDefault();
  const val = document.getElementById("group-pass-input").value.trim();
  if (await checkGroupPass(val)) {
    document.getElementById("group-modal").classList.add("hidden");
    enterGroupMode();
  } else {
    document.getElementById("group-login-error").classList.remove("hidden");
  }
});

document.getElementById("btn-exit-group").addEventListener("click", exitGroupMode);

document.getElementById("btn-fullscreen").addEventListener("click", () => {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || function () {}).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  } catch {}
});

function leerLiderGrupal() {
  const texto = (document.getElementById("group-leader").value || "").trim();
  if (!texto) return "";
  const persona = findPerson(texto) ||
    staff.find(p => String(p.name).toLowerCase() === texto.toLowerCase());
  return persona ? persona.name : texto;
}

document.getElementById("btn-start-group").addEventListener("click", () => {
  if (!staff.length) { showToast("Aún no hay personal cargado en la base."); return; }
  groupRoutineIndex = Number(document.getElementById("group-block").value) || 0;
  groupLeaderName = leerLiderGrupal();
  document.getElementById("group-setup").classList.add("hidden");
  startGuidedBreak({ routineIndex: groupRoutineIndex });
});

document.getElementById("btn-group-skip-to-list").addEventListener("click", () => {
  if (!staff.length) { showToast("Aún no hay personal cargado en la base."); return; }
  groupRoutineIndex = Number(document.getElementById("group-block").value) || 0;
  groupLeaderName = leerLiderGrupal();
  abrirListaGrupal();
});

function abrirListaGrupal() {
  document.getElementById("group-setup").classList.add("hidden");
  document.getElementById("group-checklist").classList.remove("hidden");
  document.getElementById("group-view").classList.remove("hidden");

  const area = document.getElementById("group-area").value;
  if (area) document.getElementById("group-filter-area").value = area;

  const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("group-routine-label").textContent =
    `${ROUTINES[groupRoutineIndex].name} · ${hora}` + (groupLeaderName ? ` · dirige ${groupLeaderName}` : "");

  renderGroupList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function actualizarConteoGrupal() {
  const n = groupSelected.size;
  document.getElementById("group-count").textContent = `${n} marcado${n === 1 ? "" : "s"}`;
  document.getElementById("btn-group-save").textContent =
    n > 0 ? `Guardar asistencia de ${n}` : "Guardar asistencia";
}

function personalFiltradoGrupal() {
  const q = document.getElementById("group-search").value.trim().toLowerCase();
  const area = document.getElementById("group-filter-area").value;
  return staff.filter(p => {
    if (area && p.area !== area) return false;
    if (q && !(String(p.id).toLowerCase().includes(q) || String(p.name).toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderGroupList() {
  const cont = document.getElementById("group-list");
  const lista = personalFiltradoGrupal();

  if (!lista.length) {
    cont.innerHTML = `<p class="muted">No hay colaboradores con ese filtro.</p>`;
    actualizarConteoGrupal();
    return;
  }

  cont.innerHTML = lista.map(p => {
    const id = String(p.id);
    const espera = cooldownMinutes(p.id);
    const marcado = groupSelected.has(id);
    const seg = groupSegments.get(id);
    return `<div class="group-row ${marcado ? "is-on" : ""} ${espera ? "is-locked" : ""}" data-id="${escapeHTML(id)}" role="button" tabindex="0" aria-pressed="${marcado}">
      <span class="group-check">${marcado ? "✓" : ""}</span>
      <span class="group-info">
        <strong>${escapeHTML(p.name)}</strong>
        <span class="muted">C.C. ${escapeHTML(p.id)} · ${escapeHTML(p.area)}</span>
        ${espera ? `<span class="group-note">Ya registró una pausa hace poco · faltan ${espera} min</span>` : ""}
        ${p.medical ? `<span class="group-note group-note-med">Con recomendación médica</span>` : ""}
        ${seg ? `<span class="group-note group-note-pain">Molestia: ${escapeHTML(seg)}</span>` : ""}
      </span>
      <button type="button" class="group-flag ${seg ? "is-on" : ""}" data-flag="${escapeHTML(id)}" title="Reportar molestia">!</button>
    </div>`;
  }).join("");

  actualizarConteoGrupal();
}

document.getElementById("group-list").addEventListener("click", e => {
  const flag = e.target.closest("[data-flag]");
  if (flag) {
    const id = flag.dataset.flag;
    const p = findPerson(id);
    groupSegmentTarget = id;
    document.getElementById("group-segment-name").textContent = p ? p.name : id;
    document.getElementById("group-segment-modal").classList.remove("hidden");
    return;
  }
  const fila = e.target.closest(".group-row");
  if (!fila) return;
  const id = String(fila.dataset.id);
  const espera = cooldownMinutes(id);
  if (espera > 0 && !groupSelected.has(id)) {
    showToast(`Esta persona ya registró una pausa hace poco. Podrá volver en ${espera} minuto(s).`);
    return;
  }
  if (groupSelected.has(id)) {
    groupSelected.delete(id);
    groupSegments.delete(id);
  } else {
    groupSelected.add(id);
  }
  renderGroupList();
});

document.getElementById("group-list").addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const fila = e.target.closest(".group-row");
  if (!fila) return;
  e.preventDefault();
  fila.click();
});

document.getElementById("group-search").addEventListener("input", renderGroupList);
document.getElementById("group-filter-area").addEventListener("change", renderGroupList);

document.getElementById("btn-group-all").addEventListener("click", () => {
  personalFiltradoGrupal().forEach(p => {
    if (cooldownMinutes(p.id) === 0) groupSelected.add(String(p.id));
  });
  renderGroupList();
  showToast("Marcados todos los que pueden registrar pausa ahora.");
});

document.getElementById("btn-group-none").addEventListener("click", () => {
  groupSelected.clear();
  groupSegments.clear();
  renderGroupList();
});

document.querySelectorAll(".btn-group-segment").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!groupSegmentTarget) return;
    groupSegments.set(groupSegmentTarget, btn.dataset.segment || "");
    groupSelected.add(groupSegmentTarget);   // si reporta molestia, también participó
    groupSegmentTarget = null;
    document.getElementById("group-segment-modal").classList.add("hidden");
    renderGroupList();
  });
});

document.getElementById("btn-group-segment-clear").addEventListener("click", () => {
  if (groupSegmentTarget) groupSegments.delete(groupSegmentTarget);
  groupSegmentTarget = null;
  document.getElementById("group-segment-modal").classList.add("hidden");
  renderGroupList();
});

document.getElementById("btn-group-cancel").addEventListener("click", () => {
  groupSelected.clear();
  groupSegments.clear();
  document.getElementById("group-checklist").classList.add("hidden");
  document.getElementById("group-setup").classList.remove("hidden");
});

document.getElementById("btn-group-save").addEventListener("click", async () => {
  const ids = [...groupSelected];
  if (!ids.length) { showToast("No has marcado a nadie todavía."); return; }

  const ahora = new Date();
  const rutina = ROUTINES[groupRoutineIndex].name;
  const turno = shiftNameForTime(ahora);
  const nuevos = [];
  let omitidos = 0;

  ids.forEach(id => {
    const p = findPerson(id);
    if (!p) return;
    if (cooldownMinutes(p.id) > 0) { omitidos++; return; }   // no infla el cumplimiento
    const seg = groupSegments.get(String(p.id)) || "";
    nuevos.push({
      rid: makeRid(),
      createdAtMs: Date.now(),
      date: jornadaISO(ahora),
      time: `${pad2(ahora.getHours())}:${pad2(ahora.getMinutes())}`,
      id: p.id, name: p.name, area: p.area,
      routine: rutina,
      shift: turno,
      feeling: seg ? "Con molestia física" : "Bien",
      segment: seg,
      mode: "Grupal",
      leader: groupLeaderName || ""
    });
  });

  if (!nuevos.length) {
    showToast(`Nadie quedó registrado: ${omitidos} ya tenían una pausa reciente.`);
    return;
  }

  nuevos.forEach(r => attendance.unshift(r));
  attendance.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
  nuevos.forEach(r => pending.push(r));
  saveJSON(STORAGE_KEYS.PENDING, pending);

  groupSelected.clear();
  groupSegments.clear();
  document.getElementById("group-checklist").classList.add("hidden");
  document.getElementById("group-setup").classList.remove("hidden");
  refreshAll();
  fillGroupSelectors();

  setSyncState(true, `Guardando ${nuevos.length} registros en la base compartida...`);
  await flushPending();
  setSyncState(false);
  renderSyncInfo();

  showToast(`${nuevos.length} asistencia(s) registradas` +
    (omitidos ? ` · ${omitidos} omitida(s) por tener una pausa reciente` : "") + ".");
});

// Clave de líder (permite dirigir pausas grupales sin acceso al panel)
document.getElementById("form-leader-pass").addEventListener("submit", async e => {
  e.preventDefault();
  const fb = document.getElementById("leader-pass-feedback");
  const val = document.getElementById("cfg-leader-pass").value.trim();
  const msg = (t, err = false) => {
    fb.textContent = t;
    fb.classList.remove("hidden");
    fb.style.background = err ? "#fef2f2" : "#ecfdf5";
    fb.style.color = err ? "#991b1b" : "#065f46";
    fb.style.borderColor = err ? "#fecaca" : "#a7f3d0";
    showToast(t);
  };
  if (val.length < 4) return msg("La clave de líder debe tener al menos 4 caracteres.", true);

  settings.leaderPassHash = await sha256Hex(val);
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  e.target.reset();
  const ok = await pushConfig();
  msg(ok ? "Clave de líder guardada para todos los dispositivos."
         : "Clave de líder guardada solo en este dispositivo.");
});

document.getElementById("btn-clear-leader-pass").addEventListener("click", async () => {
  settings.leaderPassHash = "";
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  const ok = await pushConfig();
  showToast(ok ? "Clave de líder eliminada. El modo grupal pedirá la de administrador."
               : "Clave de líder eliminada en este dispositivo.");
});

// ==========================================================
// INICIALIZACIÓN
// ==========================================================
function refreshAll() {
  renderStaff();
  renderCompliance();
  renderAttendanceHistory();
  renderSchedule();
  renderSyncInfo();
}

// App instalable y uso sin señal
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", () => {
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
            document.getElementById("update-banner").classList.remove("hidden");
          }
        });
      });
    }).catch(() => {});
  });
}
document.getElementById("btn-reload-app").addEventListener("click", () => location.reload());

document.getElementById("report-month").value = jornadaISO().slice(0, 7);
applyBranding();
renderRoutines();
refreshAll();
renderSyncInfo(staff.length ? null : "Descargando base de datos compartida...", "warn");
syncNow(true).then(() => renderCedulaPreview());
