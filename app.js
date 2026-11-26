// ==========================================
// DATOS DE RUTINAS (4 BLOQUES CADA 2 HORAS · MÍNIMO 5 MIN)
// Enfoque: Personal de pie y esfuerzo físico
// ==========================================
const ROUTINES = [
  {
    id: "bloque-1",
    name: "Bloque 1: Descarga Lumbar y Piernas",
    schedule: "Cada 2h · Turno 1 (6 ejercicios · 5 min)",
    focus: "Alivia la presión en espalda baja y activa el retorno venoso por permanecer de pie.",
    exercises: [
      {
        name: "Elevación de talones (bombeo venoso)",
        zone: "Pantorrillas y tobillos",
        moving: "Músculos gemelos, sóleo, tendón de Aquiles y articulación de los tobillos.",
        prevents: "Várices, insuficiencia venosa, hinchazón de pies, calambres y fascitis plantar.",
        duration: 50,
        svgKey: "talones",
        desc: "De pie, sube lentamente en puntas de pies sosteniendo 2 segundos y baja controlado. Repite de forma fluida."
      },
      {
        name: "Extensión lumbar con manos en cintura",
        zone: "Zona lumbar",
        moving: "Columna lumbar, músculos paravertebrales y abdomen anterior.",
        prevents: "Lumbalgia, hernias discales por compresión y contracturas en la espalda baja.",
        duration: 50,
        svgKey: "lumbar",
        desc: "Coloca las manos en la espalda baja, pies al ancho de hombros e inclina suavemente el tronco hacia atrás mirando al frente."
      },
      {
        name: "Sentadilla parcial controlada (sin peso)",
        zone: "Glúteos, muslos y zona lumbar",
        moving: "Glúteos, cuádriceps, rodillas y estabilizadores lumbares.",
        prevents: "Fatiga lumbar por estar de pie, debilidad de glúteos y sobrecarga articular.",
        duration: 50,
        svgKey: "sentadilla",
        desc: "Pies al ancho de hombros, baja ligeramente llevando la cadera atrás con espalda recta y brazos al frente, luego sube suave."
      },
      {
        name: "Estiramiento de cuádriceps con apoyo",
        zone: "Muslos y rodillas",
        moving: "Cuádriceps (parte frontal del muslo), flexores de cadera y rodillas.",
        prevents: "Tendinitis rotuliana, sobrecarga de rodillas y fatiga muscular en muslos.",
        duration: 50,
        svgKey: "cuadriceps",
        desc: "Apoya una mano en una superficie firme, lleva el talón al glúteo (25s pierna derecha y 25s pierna izquierda)."
      },
      {
        name: "Marcha suave elevando rodillas",
        zone: "Cadera y circulación",
        moving: "Flexores de cadera, rodillas, tobillos y circulación de miembros inferiores.",
        prevents: "Rigidez de cadera, entumecimiento de piernas y fatiga circulatoria por bipedestación prolongada.",
        duration: 50,
        svgKey: "marcha",
        desc: "Eleva alternadamente las rodillas a altura cómoda sin impacto, acompañando con respiración profunda."
      },
      {
        name: "Respiración diafragmática profunda",
        zone: "Recuperación general",
        moving: "Diafragma, caja torácica y sistema nervioso.",
        prevents: "Fatiga física acumulada y tensión muscular general.",
        duration: 50,
        svgKey: "respiracion",
        desc: "Inhala profundo en 4 segundos elevando brazos y exhala lento en 6 segundos bajándolos."
      }
    ]
  },
  {
    id: "bloque-2",
    name: "Bloque 2: Hombros, Espalda Alta y Cuello",
    schedule: "Cada 2h · Turno 2 (6 ejercicios · 5 min)",
    focus: "Libera tensión acumulada por levantamiento de peso, empuje y tracción.",
    exercises: [
      {
        name: "Círculos amplios de hombros hacia atrás",
        zone: "Hombros y trapecio",
        moving: "Articulación del hombro, manguito rotador, trapecio superior y escápulas.",
        prevents: "Tendinitis del manguito rotador, bursitis de hombro y tensión en trapecios.",
        duration: 50,
        svgKey: "hombros",
        desc: "Rota ambos hombros hacia atrás con movimientos lentos y amplios, abriendo el pecho al inhalar."
      },
      {
        name: "Estiramiento lateral de cuello",
        zone: "Cervicales y trapecio",
        moving: "Columna cervical, esternocleidomastoideo y fibras superiores del trapecio.",
        prevents: "Cervicalgia, tortícolis, cefaleas tensionales y pinzamientos cervicales.",
        duration: 50,
        svgKey: "cuello",
        desc: "Inclina la oreja hacia el hombro manteniendo el hombro contrario abajo (25s cada lado, sin forzar)."
      },
      {
        name: "Rotación suave de torso (columna torácica)",
        zone: "Espalda media y cintura",
        moving: "Columna torácica, oblicuos y musculatura paravertebral.",
        prevents: "Rigidez dorsal y lesiones por giros repetitivos al mover o apilar cargas.",
        duration: 50,
        svgKey: "rotacion",
        desc: "Cruza los brazos sobre el pecho, mantén la cadera fija al frente y gira suavemente el torso de un lado a otro."
      },
      {
        name: "Apertura pectoral (manos entrelazadas atrás)",
        zone: "Pecho y espalda alta",
        moving: "Músculos pectorales, cara anterior del hombro y caja torácica.",
        prevents: "Hombros caídos (cifosis postural), sobrecarga dorsal y compresión de hombros.",
        duration: 50,
        svgKey: "pectoral",
        desc: "Entrelaza las manos detrás de la espalda, junta los omóplatos y abre el pecho respirando profundo."
      },
      {
        name: "Estiramiento dorsal (abrazo al frente)",
        zone: "Espalda media y omóplatos",
        moving: "Romboides, dorsal ancho y musculatura entre los omóplatos.",
        prevents: "Dorsalgia, espasmos entre escápulas y fatiga por levantar o empujar cargas.",
        duration: 50,
        svgKey: "dorsal",
        desc: "Estira los brazos al frente entrelazando dedos, redondea suavemente la espalda alta y empuja hacia adelante."
      },
      {
        name: "Inclinación lateral de tronco",
        zone: "Costados y espalda",
        moving: "Oblicuos, dorsal ancho y cuadrado lumbar.",
        prevents: "Sobrecarga lateral de espalda por manejo de cargas asimétricas.",
        duration: 50,
        svgKey: "lateral",
        desc: "Eleva un brazo sobre la cabeza e inclina el tronco suavemente hacia el lado contrario (25s por lado)."
      }
    ]
  },
  {
    id: "bloque-3",
    name: "Bloque 3: Caderas, Rodillas y Tobillos",
    schedule: "Cada 2h · Turno 3 (6 ejercicios · 5 min)",
    focus: "Reduce la rigidez articular de miembros inferiores tras varias horas de pie.",
    exercises: [
      {
        name: "Balanceo controlado de cadera",
        zone: "Cadera y zona lumbar",
        moving: "Articulación coxofemoral (cadera), pelvis y parte baja de la espalda.",
        prevents: "Rigidez pélvica, ciática por tensión muscular y bloqueo lumbar.",
        duration: 50,
        svgKey: "cadera",
        desc: "Con rodillas ligeramente flexionadas, realiza círculos suaves con la cadera (25s a cada lado)."
      },
      {
        name: "Sentadilla parcial controlada (sin peso)",
        zone: "Glúteos y rodillas",
        moving: "Glúteos, cuádriceps y articulación de rodillas.",
        prevents: "Sobrecarga lumbar y fatiga por bipedestación prolongada.",
        duration: 50,
        svgKey: "sentadilla",
        desc: "Flexiona suavemente las rodillas manteniendo la espalda recta y los talones apoyados en el piso."
      },
      {
        name: "Estiramiento de isquiotibiales (talón al frente)",
        zone: "Parte posterior de piernas",
        moving: "Isquiotibiales (parte trasera del muslo) y zona posterior de la rodilla.",
        prevents: "Desgarros posteriores de muslo, tirón lumbar y acortamiento muscular.",
        duration: 50,
        svgKey: "isquios",
        desc: "Adelanta un pie apoyando el talón, flexiona ligeramente la otra rodilla e inclina el tronco con espalda recta (25s por lado)."
      },
      {
        name: "Estiramiento de gemelos (paso largo)",
        zone: "Pantorrillas y tendón de Aquiles",
        moving: "Gemelos, sóleo, tendón de Aquiles y fascia plantar.",
        prevents: "Tendinitis aquiliana, fascitis plantar, espolón y calambres nocturnos.",
        duration: 50,
        svgKey: "gemelos",
        desc: "Da un paso atrás manteniendo el talón trasero pegado al piso y flexiona la rodilla delantera (25s por lado)."
      },
      {
        name: "Rotación de tobillos",
        zone: "Tobillos y pies",
        moving: "Articulación del tobillo, ligamentos laterales y músculos del pie.",
        prevents: "Esguinces de tobillo, rigidez articular y fatiga en la planta del pie.",
        duration: 50,
        svgKey: "tobillos",
        desc: "Apoya la punta del pie en el suelo y haz círculos amplios con el tobillo (25s pie derecho y 25s pie izquierdo)."
      },
      {
        name: "Elevación de talones (bombeo venoso)",
        zone: "Circulación de piernas",
        moving: "Gemelos, sóleo y retorno venoso de miembros inferiores.",
        prevents: "Hinchazón de piernas, várices y sensación de pesadez.",
        duration: 50,
        svgKey: "talones",
        desc: "Sube y baja en puntas de pies de forma controlada para reactivar la circulación."
      }
    ]
  },
  {
    id: "bloque-4",
    name: "Bloque 4: Manos, Muñecas y Recuperación",
    schedule: "Cada 2h · Turno 4 (6 ejercicios · 5 min)",
    focus: "Descansa antebrazos y manos tras agarre constante y regula la respiración.",
    exercises: [
      {
        name: "Estiramiento de flexores y extensores de muñeca",
        zone: "Muñecas y antebrazos",
        moving: "Muñecas, tendones flexores/extensores y músculos del antebrazo.",
        prevents: "Síndrome del túnel carpiano, tendinitis de muñeca y epicondilitis (codo de tenista).",
        duration: 50,
        svgKey: "muneca",
        desc: "Brazo extendido al frente, lleva suavemente los dedos hacia atrás y luego hacia abajo (25s por brazo)."
      },
      {
        name: "Pronosupinación de antebrazos",
        zone: "Antebrazos y codos",
        moving: "Músculos pronadores, supinadores, codos y muñecas.",
        prevents: "Epicondilitis (codo de tenista), epitrocleítis y sobrecarga por uso de herramientas o agarre.",
        duration: 50,
        svgKey: "pronosupinacion",
        desc: "Con los codos pegados al costado en 90 grados, gira las palmas hacia arriba y hacia abajo de forma lenta y controlada."
      },
      {
        name: "Abrir y cerrar manos con extensión de dedos",
        zone: "Manos y dedos",
        moving: "Articulaciones de los dedos, palma y tendones de agarre.",
        prevents: "Dedo en gatillo, tenosinovitis de De Quervain y entumecimiento en manos.",
        duration: 50,
        svgKey: "manos",
        desc: "Abre los dedos lo máximo posible durante 3 segundos y cierra en puño suave. Repite de forma continua."
      },
      {
        name: "Rotación suave de torso (columna torácica)",
        zone: "Espalda y cintura",
        moving: "Columna torácica, zona dorsal y oblicuos.",
        prevents: "Rigidez de espalda al cierre de la jornada y contracturas dorsales.",
        duration: 50,
        svgKey: "rotacion",
        desc: "Con brazos cruzados al pecho, gira suavemente el tronco hacia derecha e izquierda sin mover la cadera."
      },
      {
        name: "Inclinación lateral de tronco",
        zone: "Costados y espalda",
        moving: "Oblicuos, dorsal ancho, cuadrado lumbar y costillas.",
        prevents: "Sobrecarga lateral de espalda, escoliosis funcional y fatiga por cargas asimétricas.",
        duration: 50,
        svgKey: "lateral",
        desc: "Eleva un brazo sobre la cabeza e inclina el tronco suavemente hacia el lado contrario (25s por lado)."
      },
      {
        name: "Respiración diafragmática profunda",
        zone: "Recuperación general",
        moving: "Diafragma, caja torácica, hombros y sistema nervioso.",
        prevents: "Fatiga física acumulada, estrés laboral, hiperventilación y tensión muscular general.",
        duration: 50,
        svgKey: "respiracion",
        desc: "Inhala profundo en 4 segundos elevando brazos, sostén 2 segundos y exhala lento en 6 segundos bajando brazos."
      }
    ]
  }
];

// ==========================================
// CONFIGURACIÓN Y ALMACENAMIENTO LOCAL
// ==========================================
const ADMIN_PASS = "admin123";
const STORAGE_KEYS = {
  STAFF: "pausas_sst_staff_v1",
  ATTENDANCE: "pausas_sst_attendance_v1",
  BLOCK_INDEX: "pausas_sst_block_idx_v1",
  SETTINGS: "pausas_sst_settings_v1"
};
const TWO_HOURS_SECONDS = 2 * 60 * 60;

let staff = loadJSON(STORAGE_KEYS.STAFF, []);
let attendance = loadJSON(STORAGE_KEYS.ATTENDANCE, []);
let settings = loadJSON(STORAGE_KEYS.SETTINGS, {
  companyName: "Pausas Activas SST",
  logoDataUrl: "",
  sheetsUrl: "",
  allowSkip: false,
  qrUrl: "",
  adminPass: ADMIN_PASS
});
let currentBlockIndex = Number(localStorage.getItem(STORAGE_KEYS.BLOCK_INDEX) || 0) % ROUTINES.length;

let mainRemaining = TWO_HOURS_SECONDS;
let mainInterval = null;

let activeRoutine = null;
let activeParticipant = null;
let currentExIndex = 0;
let exRemaining = 0;
let exInterval = null;
let exPaused = false;

// ==========================================
// UTILIDADES Y SONIDO
// ==========================================
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatHMS(totalSec) {
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatMS(totalSec) {
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() =>toast.classList.add("hidden"), 3400);
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
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch {}
}

function playStartChime() {
  playBeep(523.25, 0.16, 0);
  playBeep(783.99, 0.24, 0.15);
}

function playEndChime() {
  playBeep(880, 0.18, 0);
  playBeep(1046.5, 0.35, 0.18);
}

function speakSpanish(text) {
  const chk = document.getElementById("chk-voice");
  if (!chk || !chk.checked || !("speechSynthesis"in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  } catch {}
}

function syncToGoogleSheets(record) {
  if (!settings.sheetsUrl) return;
  fetch(settings.sheetsUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  }).catch(() => {});
}

// ==========================================
// MODO ADMINISTRADOR VS PANTALLA PRINCIPAL
// ==========================================
function enterAdminMode() {
  document.getElementById("kiosk-view").classList.add("hidden");
  document.getElementById("admin-view").classList.remove("hidden");
  document.getElementById("admin-nav").classList.remove("hidden");
  document.getElementById("btn-open-admin").classList.add("hidden");
  document.getElementById("btn-exit-admin").classList.remove("hidden");
  switchAdminTab("cumplimiento");
  refreshAll();
}

function exitAdminMode() {
  document.getElementById("admin-view").classList.add("hidden");
  document.getElementById("admin-nav").classList.add("hidden");
  document.getElementById("btn-exit-admin").classList.add("hidden");
  document.getElementById("btn-open-admin").classList.remove("hidden");
  document.getElementById("kiosk-view").classList.remove("hidden");
}

function switchAdminTab(tabName) {
  document.querySelectorAll("#admin-nav .tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll("#admin-view .tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
}

document.querySelectorAll("#admin-nav .tab-btn").forEach(btn => {
  btn.addEventListener("click", () =>switchAdminTab(btn.dataset.tab));
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

document.getElementById("form-admin-login").addEventListener("submit", e => {
  e.preventDefault();
  const val = document.getElementById("admin-pass-input").value;
  const currentPass = settings.adminPass || ADMIN_PASS;
  if (val === currentPass) {
    document.getElementById("admin-modal").classList.add("hidden");
    enterAdminMode();
  } else {
    document.getElementById("admin-login-error").classList.remove("hidden");
  }
});

document.getElementById("btn-exit-admin").addEventListener("click", exitAdminMode);

// ==========================================
// PANTALLA PRINCIPAL: INGRESO POR CÉDULA
// ==========================================
const cedulaInput = document.getElementById("cedula-input");
const cedulaPreview = document.getElementById("cedula-preview");

cedulaInput.addEventListener("input", () => {
  const doc = cedulaInput.value.trim();
  if (!doc) {
    cedulaPreview.classList.add("hidden");
    return;
  }
  const found = staff.find(p =>p.id.toLowerCase() === doc.toLowerCase());
  cedulaPreview.classList.remove("hidden");
  if (found) {
    const today = todayISO();
    const myToday = attendance.filter(r =>r.date === today && r.id === found.id);
    const lastTime = myToday.length > 0 ? myToday[0].time : null;
    const progressText = myToday.length > 0
      ? `Hoy llevas <strong>${myToday.length} de 4</strong>pausas (última a las ${lastTime}).`
      : `Hoy llevas <strong>0 de 4</strong>pausas realizadas.`;
    cedulaPreview.className = "cedula-preview";
    cedulaPreview.innerHTML = ` <strong>${escapeHTML(found.name)}</strong> · ${escapeHTML(found.area)}<br/><span style="font-size:0.82rem;">${progressText}</span>`;
  } else {
    cedulaPreview.className = "cedula-preview not-found";
    cedulaPreview.innerHTML = `La cédula <strong>${escapeHTML(doc)}</strong>no está registrada en el listado. Solicita al administrador que te agregue.`;
  }
});

document.getElementById("form-cedula-start").addEventListener("submit", e => {
  e.preventDefault();
  const doc = cedulaInput.value.trim();
  if (!doc) return;

  const person = staff.find(p =>p.id.toLowerCase() === doc.toLowerCase());
  if (!person) {
    cedulaPreview.classList.remove("hidden");
    cedulaPreview.className = "cedula-preview not-found";
    cedulaPreview.innerHTML = `No puedes iniciar: la cédula <strong>${escapeHTML(doc)}</strong>no está registrada en el listado de personal.`;
    showToast("Cédula no registrada. Solo el personal autorizado en el listado puede iniciar.");
    cedulaInput.focus();
    return;
  }
  activeParticipant = person;
  startGuidedBreak(currentBlockIndex);
});

// ==========================================
// TEMPORIZADOR DE 2 HORAS
// ==========================================
function updateTimerUI() {
  document.getElementById("countdown-display").textContent = formatHMS(mainRemaining);
  const routine = ROUTINES[currentBlockIndex];
  document.getElementById("next-routine-name").textContent = routine.name;
  document.getElementById("kiosk-block-badge").textContent = `Bloque ${currentBlockIndex + 1} de ${ROUTINES.length}`;
}

function setTimerBadge(text, cls) {
  const el = document.getElementById("timer-status-badge");
  el.textContent = text;
  el.className = `badge ${cls}`;
}

document.getElementById("btn-start-timer").addEventListener("click", () => {
  if (mainInterval) return;
  setTimerBadge("Ciclo activo", "badge-active");
  document.getElementById("btn-start-timer").disabled = true;
  document.getElementById("btn-pause-timer").disabled = false;

  mainInterval = setInterval(() => {
    mainRemaining--;
    updateTimerUI();
    if (mainRemaining <= 0) {
      clearInterval(mainInterval);
      mainInterval = null;
      mainRemaining = TWO_HOURS_SECONDS;
      document.getElementById("btn-start-timer").disabled = false;
      document.getElementById("btn-pause-timer").disabled = true;
      setTimerBadge("¡Hora de pausa!", "badge-alert");
      playEndChime();
      showToast("¡Es hora de la pausa activa! Ingresa tu cédula para comenzar.");
    }
  }, 1000);
});

document.getElementById("btn-pause-timer").addEventListener("click", () => {
  if (!mainInterval) return;
  clearInterval(mainInterval);
  mainInterval = null;
  setTimerBadge("En pausa", "badge-idle");
  document.getElementById("btn-start-timer").disabled = false;
  document.getElementById("btn-pause-timer").disabled = true;
});

document.getElementById("btn-reset-timer").addEventListener("click", () => {
  if (mainInterval) {
    clearInterval(mainInterval);
    mainInterval = null;
  }
  mainRemaining = TWO_HOURS_SECONDS;
  setTimerBadge("En pausa", "badge-idle");
  document.getElementById("btn-start-timer").disabled = false;
  document.getElementById("btn-pause-timer").disabled = true;
  updateTimerUI();
});

// ==========================================
// REPRODUCTOR DE PAUSA ACTIVA GUIADA
// ==========================================
function startGuidedBreak(blockIdx) {
  activeRoutine = ROUTINES[blockIdx];
  currentExIndex = 0;
  exPaused = false;
  document.getElementById("guided-player").classList.remove("hidden");
  document.getElementById("player-routine-title").textContent = activeRoutine.name;
  document.getElementById("player-participant-label").textContent =
    `Participante: ${activeParticipant.name} (C.C. ${activeParticipant.id} · ${activeParticipant.area})`;
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

  const visualEl = document.getElementById("player-visual");
  if (typeof mountExerciseAnimator === "function") {
    mountExerciseAnimator(visualEl, ex.svgKey);
  }

  document.getElementById("player-step-label").textContent = `Ejercicio ${idx + 1} de ${activeRoutine.exercises.length}`;
  document.getElementById("player-exercise-name").textContent = ex.name;
  document.getElementById("player-exercise-desc").textContent = ex.desc;
  document.getElementById("player-exercise-moving").textContent = ex.moving;
  document.getElementById("player-exercise-prevents").textContent = ex.prevents;
  document.getElementById("player-ex-timer").textContent = formatMS(exRemaining);
  document.getElementById("player-total-timer").textContent = formatMS(calcTotalRemaining());
  document.getElementById("btn-ex-toggle").textContent = "Pausar";

  const pct = (idx / activeRoutine.exercises.length) * 100;
  document.getElementById("player-progress-fill").style.width = `${pct}%`;

  // Control anti-trampa: ocultar/mostrar botones de salto según configuración
  const showSkip = Boolean(settings.allowSkip);
  document.getElementById("btn-ex-prev").classList.toggle("hidden", !showSkip);
  document.getElementById("btn-ex-next").classList.toggle("hidden", !showSkip);

  playStartChime();
  speakSpanish(`Ejercicio ${idx + 1}: ${ex.name}. ${ex.desc}`);

  exInterval = setInterval(() => {
    if (exPaused) return;
    exRemaining--;
    document.getElementById("player-ex-timer").textContent = formatMS(Math.max(0, exRemaining));
    document.getElementById("player-total-timer").textContent = formatMS(calcTotalRemaining());

    if (exRemaining === 3) {
      speakSpanish("Tres, dos, uno");
    }
    if (exRemaining > 0 && exRemaining <= 3) {
      playBeep(660, 0.12);
    }

    if (exRemaining <= 0) {
      playEndChime();
      if (currentExIndex + 1 < activeRoutine.exercises.length) {
        loadExercise(currentExIndex + 1);
      } else {
        finishGuidedBreak();
      }
    }
  }, 1000);
}

let pendingCompletedRecord = null;

function finishGuidedBreak() {
  clearInterval(exInterval);
  document.getElementById("player-progress-fill").style.width = "100%";
  playEndChime();

  if (activeParticipant && activeRoutine) {
    const now = new Date();
    pendingCompletedRecord = {
      date: todayISO(),
      time: now.toTimeString().slice(0, 5),
      id: activeParticipant.id,
      name: activeParticipant.name,
      area: activeParticipant.area,
      routine: activeRoutine.name,
      feeling: "Bien"
    };
    document.getElementById("feeling-worker-name").textContent =
      `${activeParticipant.name}, ¿cómo te sientes hoy después de tu pausa?`;
    document.getElementById("feeling-modal").classList.remove("hidden");
    speakSpanish(`Excelente ${activeParticipant.name}. Selecciona cómo te sientes hoy para guardar tu registro.`);
  }

  document.getElementById("guided-player").classList.add("hidden");
}

document.querySelectorAll(".btn-feeling").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!pendingCompletedRecord) return;
    pendingCompletedRecord.feeling = btn.dataset.feeling || "Bien";
    attendance.unshift(pendingCompletedRecord);
    saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
    syncToGoogleSheets(pendingCompletedRecord);

    const workerName = pendingCompletedRecord.name;
    pendingCompletedRecord = null;
    activeParticipant = null;

    document.getElementById("feeling-modal").classList.add("hidden");
    cedulaInput.value = "";
    cedulaPreview.classList.add("hidden");

    currentBlockIndex = (currentBlockIndex + 1) % ROUTINES.length;
    localStorage.setItem(STORAGE_KEYS.BLOCK_INDEX, String(currentBlockIndex));
    refreshAll();
    showToast(`¡Gracias ${workerName}! Tu pausa activa y estado quedaron registrados.`);
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

document.getElementById("btn-ex-next").addEventListener("click", () => {
  if (!activeRoutine) return;
  if (currentExIndex + 1 < activeRoutine.exercises.length) {
    loadExercise(currentExIndex + 1);
  } else {
    finishGuidedBreak();
  }
});

document.getElementById("btn-close-player").addEventListener("click", () => {
  clearInterval(exInterval);
  activeParticipant = null;
  document.getElementById("guided-player").classList.add("hidden");
});

// ==========================================
// ADMIN: CUMPLIMIENTO (QUIÉNES SÍ / QUIÉNES NO)
// ==========================================
function buildComplianceRows(dateStr) {
  const dayRecs = attendance.filter(r =>r.date === dateStr);
  const map = new Map();

  staff.forEach(p => {
    map.set(p.id, {
      id: p.id,
      name: p.name,
      area: p.area,
      count: 0,
      lastTime: "-"
    });
  });

  dayRecs.forEach(r => {
    if (!map.has(r.id)) {
      map.set(r.id, { id: r.id, name: r.name, area: r.area, count: 0, lastTime: "-" });
    }
    const row = map.get(r.id);
    row.count++;
    if (row.lastTime === "-" || r.time >row.lastTime) {
      row.lastTime = r.time;
    }
  });

  return Array.from(map.values()).sort((a, b) =>b.count - a.count || a.name.localeCompare(b.name));
}

function renderCompliance() {
  const dateInput = document.getElementById("comp-date");
  if (!dateInput.value) dateInput.value = todayISO();
  const dateStr = dateInput.value;
  const statusFilter = document.getElementById("comp-status-filter").value;
  const query = document.getElementById("comp-search").value.trim().toLowerCase();

  const allRows = buildComplianceRows(dateStr);
  const dayRecs = attendance.filter(r =>r.date === dateStr);
  const yesCount = allRows.filter(r =>r.count > 0).length;
  const noCount = allRows.filter(r =>r.count === 0).length;
  const totalPausas = allRows.reduce((acc, r) =>acc + r.count, 0);
  const pct = allRows.length > 0 ? Math.round((yesCount / allRows.length) * 100) : 0;
  const painCount = dayRecs.filter(r => (r.feeling || "").toLowerCase().includes("molestia")).length;

  document.getElementById("stat-staff-count").textContent = allRows.length;
  document.getElementById("stat-yes-count").textContent = yesCount;
  document.getElementById("stat-no-count").textContent = noCount;
  document.getElementById("stat-compliance-pct").textContent = `${pct}%`;
  document.getElementById("stat-today-attendance").textContent = totalPausas;
  document.getElementById("stat-pain-count").textContent = painCount;

  // Renderizar resumen por área
  renderAreaSummary(allRows, dayRecs);

  const filtered = allRows.filter(r => {
    if (statusFilter === "yes" && r.count === 0) return false;
    if (statusFilter === "no" && r.count > 0) return false;
    if (query) {
      const match =
        r.id.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.area.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  const tbody = document.getElementById("compliance-table-body");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"class="muted">No hay colaboradores para mostrar. Carga tu personal en la pestaña <strong>Personal</strong>.</td></tr>`;
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement("tr");
    const badge = r.count > 0
      ? `<span class="badge badge-ok">Sí cumplió</span>`
      : `<span class="badge badge-no">No ha hecho</span>`;
    tr.innerHTML = `
      <td>${escapeHTML(r.id)}</td>
      <td><strong>${escapeHTML(r.name)}</strong></td>
      <td>${escapeHTML(r.area)}</td>
      <td><strong>${r.count}</strong></td>
      <td>${escapeHTML(r.lastTime)}</td>
      <td>${badge}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("comp-date").addEventListener("change", renderCompliance);
document.getElementById("comp-status-filter").addEventListener("change", renderCompliance);
document.getElementById("comp-search").addEventListener("input", renderCompliance);

function buildAreaSummary(allRows, dayRecs) {
  const areaMap = new Map();
  allRows.forEach(r => {
    const area = r.area || "Sin área";
    if (!areaMap.has(area)) {
      areaMap.set(area, { area, total: 0, yes: 0, no: 0, pain: 0 });
    }
    const item = areaMap.get(area);
    item.total++;
    if (r.count > 0) item.yes++;
    else item.no++;
  });

  dayRecs.forEach(r => {
    if ((r.feeling || "").toLowerCase().includes("molestia")) {
      const area = r.area || "Sin área";
      if (areaMap.has(area)) areaMap.get(area).pain++;
    }
  });

  return Array.from(areaMap.values())
    .map(a => ({ ...a, pct: a.total > 0 ? Math.round((a.yes / a.total) * 100) : 0 }))
    .sort((a, b) =>b.pct - a.pct || a.area.localeCompare(b.area));
}

function renderAreaSummary(allRows, dayRecs) {
  const tbody = document.getElementById("area-summary-body");
  if (!tbody) return;
  const areas = buildAreaSummary(allRows, dayRecs);
  tbody.innerHTML = "";

  if (areas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"class="muted">Sin datos de áreas todavía.</td></tr>`;
    return;
  }

  areas.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHTML(a.area)}</strong></td>
      <td>${a.total}</td>
      <td><span class="badge badge-ok">${a.yes}</span></td>
      <td><span class="badge badge-no">${a.no}</span></td>
      <td>
        <div class="mini-bar-wrap">
          <div class="mini-bar"><div class="mini-bar-fill"style="width:${a.pct}%"></div></div>
          <strong>${a.pct}%</strong>
        </div>
      </td>
      <td>${a.pain > 0 ? `<span class="badge badge-no"> ${a.pain}</span>` : "0"}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("btn-export-compliance").addEventListener("click", () => {
  const dateStr = document.getElementById("comp-date").value || todayISO();
  const rows = buildComplianceRows(dateStr);
  if (rows.length === 0) {
    showToast("No hay datos para exportar.");
    return;
  }
  const sheetRows = [
    ["Fecha", "Cedula", "Nombre", "Area", "Pausas_Hechas", "Ultima_Pausa", "Estado"],
    ...rows.map(r => [dateStr, r.id, r.name, r.area, r.count, r.lastTime, r.count > 0 ? "SI CUMPLIO" : "NO HA HECHO"])
  ];
  exportExcelWorkbook([{ name: "Cumplimiento", rows: sheetRows }], `cumplimiento_pausas_${dateStr}.xlsx`);
});

document.getElementById("btn-export-excel-full").addEventListener("click", () => {
  const dateStr = document.getElementById("comp-date").value || todayISO();
  const compRows = buildComplianceRows(dateStr);
  const dayRecs = attendance.filter(r =>r.date === dateStr);
  const areaRows = buildAreaSummary(compRows, dayRecs);

  const s1 = [
    ["Fecha", "Cedula", "Nombre", "Area", "Pausas_Hechas", "Ultima_Pausa", "Estado"],
    ...compRows.map(r => [dateStr, r.id, r.name, r.area, r.count, r.lastTime, r.count > 0 ? "SI CUMPLIO" : "NO HA HECHO"])
  ];
  const s2 = [
    ["Area", "Total_Personal", "Si_Cumplieron", "Pendientes", "Porcentaje_Cumplimiento", "Alertas_Molestia"],
    ...areaRows.map(a => [a.area, a.total, a.yes, a.no, `${a.pct}%`, a.pain])
  ];
  const s3 = [
    ["Fecha", "Hora", "Cedula", "Nombre", "Area", "Rutina", "Bienestar"],
    ...attendance.map(r => [r.date, r.time, r.id, r.name, r.area, r.routine, r.feeling || "Bien"])
  ];

  exportExcelWorkbook(
    [
      { name: "Cumplimiento", rows: s1 },
      { name: "Resumen_por_Area", rows: s2 },
      { name: "Historial_Detallado", rows: s3 }
    ],
    `reporte_completo_sst_${dateStr}.xlsx`
  );
});

// ==========================================
// ADMIN: HISTORIAL DE ASISTENCIA
// ==========================================
function renderAttendanceHistory() {
  const filterDate = document.getElementById("filter-date").value;
  const filterArea = document.getElementById("filter-area").value;
  const tbody = document.getElementById("attendance-history-body");
  tbody.innerHTML = "";

  const areaSelect = document.getElementById("filter-area");
  const currentAreaVal = areaSelect.value;
  const areas = [...new Set([...staff.map(s =>s.area), ...attendance.map(a =>a.area)])].filter(Boolean).sort();
  areaSelect.innerHTML = `<option value="">Todas las áreas</option>` + areas.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join("");
  areaSelect.value = currentAreaVal;

  const filtered = attendance.filter(rec => {
    if (filterDate && rec.date !== filterDate) return false;
    if (filterArea && rec.area !== filterArea) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"class="muted">Sin registros de asistencia para los filtros seleccionados.</td></tr>`;
    return;
  }

  filtered.forEach(rec => {
    const tr = document.createElement("tr");
    const feeling = rec.feeling || "Bien";
    const feelBadge = feeling.includes("molestia")
      ? `<span class="badge badge-no"> ${escapeHTML(feeling)}</span>`
      : feeling === "Cansado"
        ? `<span class="badge badge-alert"> ${escapeHTML(feeling)}</span>`
        : `<span class="badge badge-ok"> ${escapeHTML(feeling)}</span>`;
    tr.innerHTML = `
      <td>${escapeHTML(rec.date)} ${escapeHTML(rec.time)}</td>
      <td>${escapeHTML(rec.id)}</td>
      <td><strong>${escapeHTML(rec.name)}</strong></td>
      <td>${escapeHTML(rec.area)}</td>
      <td>${escapeHTML(rec.routine)}</td>
      <td>${feelBadge}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("filter-date").addEventListener("change", renderAttendanceHistory);
document.getElementById("filter-area").addEventListener("change", renderAttendanceHistory);

document.getElementById("btn-export-attendance").addEventListener("click", () => {
  if (attendance.length === 0) {
    showToast("No hay registros de asistencia para exportar.");
    return;
  }
  const rows = [
    ["Fecha", "Hora", "Cedula", "Nombre", "Area", "Rutina", "Bienestar"],
    ...attendance.map(r => [r.date, r.time, r.id, r.name, r.area, r.routine, r.feeling || "Bien"])
  ];
  exportExcelWorkbook([{ name: "Historial", rows }], `historial_pausas_activas_${todayISO()}.xlsx`);
});

document.getElementById("btn-clear-history").addEventListener("click", () => {
  if (!confirm("¿Seguro que deseas borrar todo el historial de asistencia?")) return;
  attendance = [];
  saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
  refreshAll();
  showToast("Historial limpiado.");
});

// ==========================================
// ADMIN: GESTIÓN DE PERSONAL
// ==========================================
function renderStaff() {
  const query = document.getElementById("staff-search").value.trim().toLowerCase();
  const tbody = document.getElementById("staff-table-body");
  tbody.innerHTML = "";

  const filtered = staff.filter(p =>p.id.toLowerCase().includes(query) ||
    p.name.toLowerCase().includes(query) ||
    p.area.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"class="muted">No hay personal registrado aún. Sube un archivo CSV o agrega manualmente.</td></tr>`;
  } else {
    filtered.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(p.id)}</td>
        <td><strong>${escapeHTML(p.name)}</strong></td>
        <td>${escapeHTML(p.area)}</td>
        <td><button class="btn btn-danger-outline btn-sm"data-del-id="${escapeHTML(p.id)}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  tbody.querySelectorAll("[data-del-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delId;
      staff = staff.filter(p =>p.id !== id);
      saveJSON(STORAGE_KEYS.STAFF, staff);
      refreshAll();
      showToast("Colaborador eliminado.");
    });
  });

  document.getElementById("staff-total-badge").textContent = staff.length;
}

document.getElementById("staff-search").addEventListener("input", renderStaff);

document.getElementById("form-add-staff").addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("staff-id").value.trim();
  const name = document.getElementById("staff-name").value.trim();
  const area = document.getElementById("staff-area").value.trim();
  if (!id || !name) return;

  const existing = staff.findIndex(p =>p.id === id);
  if (existing >= 0) {
    staff[existing] = { id, name, area };
    showToast("Colaborador actualizado.");
  } else {
    staff.push({ id, name, area });
    showToast("Colaborador agregado.");
  }
  saveJSON(STORAGE_KEYS.STAFF, staff);
  e.target.reset();
  refreshAll();
});

document.getElementById("csv-file-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  const processRows = (rows) => {
    let added = 0;
    let updated = 0;

    rows.forEach((cols, idx) => {
      if (!Array.isArray(cols) || cols.length < 2) return;
      const c0 = String(cols[0] ?? "").trim();
      const c1 = String(cols[1] ?? "").trim();
      const c2 = String(cols[2] ?? "Operaciones").trim() || "Operaciones";
      if (!c0 || !c1) return;
      if (idx === 0 && /documento|cedula|id|codigo/i.test(c0)) return;

      const pos = staff.findIndex(p =>p.id === c0);
      if (pos >= 0) {
        staff[pos] = { id: c0, name: c1, area: c2 };
        updated++;
      } else {
        staff.push({ id: c0, name: c1, area: c2 });
        added++;
      }
    });

    saveJSON(STORAGE_KEYS.STAFF, staff);
    const fb = document.getElementById("upload-feedback");
    fb.textContent = `Carga completada: ${added} nuevos y ${updated} actualizados.`;
    fb.classList.remove("hidden");
    e.target.value = "";
    refreshAll();
  };

  if (isExcel && typeof XLSX !== "undefined") {
    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      processRows(rows);
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = ev => {
      const text = String(ev.target.result || "").replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).map(l =>l.trim()).filter(Boolean);
      const rows = lines.map(line => {
        const sep = line.includes(";") ? ";" : ",";
        return line.split(sep).map(c =>c.replace(/^"|"$/g, "").trim());
      });
      processRows(rows);
    };
    reader.readAsText(file, "UTF-8");
  }
});

document.getElementById("btn-download-template").addEventListener("click", () => {
  const rows = [
    ["Documento", "Nombre", "Area"],
    ["10203040", "Carlos Perez", "Bodega"],
    ["10506070", "Maria Gomez", "Produccion"],
    ["10809010", "Juan Rodriguez", "Logistica"]
  ];
  exportExcelWorkbook([{ name: "Personal", rows }], "plantilla_personal_pausas.xlsx");
});

document.getElementById("btn-export-staff").addEventListener("click", () => {
  const rows = [["Documento", "Nombre", "Area"], ...staff.map(p => [p.id, p.name, p.area])];
  exportExcelWorkbook([{ name: "Personal", rows }], "personal_pausas_activas.xlsx");
});

// ==========================================
// ADMIN: CATÁLOGO DE RUTINAS
// ==========================================
function renderRoutines() {
  const grid = document.getElementById("routines-grid");
  grid.innerHTML = "";

  ROUTINES.forEach(r => {
    const card = document.createElement("div");
    card.className = "card routine-card";
    card.innerHTML = `
      <div>
        <span class="badge badge-active">${r.schedule}</span>
        <h3 style="margin:0.6rem 0 0.25rem;">${r.name}</h3>
        <p class="muted"style="margin:0;">${r.focus}</p>
        <ul class="routine-ex-list">
          ${r.exercises.map(ex => `
            <li class="routine-ex-item">
              <div class="routine-thumb">${getExerciseIllustration(ex.svgKey)}</div>
              <div>
                <strong>${ex.name}</strong> <span class="muted">(${ex.duration}s)</span>
                <span class="routine-ergo-meta"> <strong>Mueve:</strong> ${ex.moving}</span>
                <span class="routine-ergo-meta"> <strong>Evita:</strong> ${ex.prevents}</span>
              </div>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
    grid.appendChild(card);
  });

  if (typeof initMiniCanvases === "function") {
    initMiniCanvases();
  }
}

// ==========================================
// HELPERS EXCEL (.XLSX) Y CSV
// ==========================================
function exportExcelWorkbook(sheets, filename) {
  if (typeof XLSX !== "undefined") {
    const wb = XLSX.utils.book_new();
    sheets.forEach(s => {
      const ws = XLSX.utils.aoa_to_sheet(s.rows);
      XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
    });
    XLSX.writeFile(wb, filename);
    showToast(`Archivo Excel generado: ${filename}`);
  } else {
    // Respaldo CSV si no hay conexión a internet para cargar SheetJS
    downloadCSV(sheets[0].rows, filename.replace(/\.xlsx$/i, ".csv"));
  }
}

function downloadCSV(rows, filename) {
  const csv = "\uFEFF" + rows.map(r =>r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function refreshAll() {
  renderStaff();
  renderCompliance();
  renderAttendanceHistory();
  updateTimerUI();
}

// ==========================================
// ADMIN: CONFIGURACIÓN, EMPRESA, QR Y RESPALDO
// ==========================================
function applyBranding() {
  document.getElementById("brand-title").textContent = settings.companyName || "Pausas Activas SST";
  const logoWrap = document.getElementById("brand-logo-wrap");
  if (settings.logoDataUrl) {
    logoWrap.innerHTML = `<img src="${settings.logoDataUrl}"alt="Logo empresa" />`;
  } else {
    logoWrap.textContent = "SST";
  }

  // Cargar valores en formulario de configuración
  document.getElementById("cfg-company").value = settings.companyName || "";
  document.getElementById("cfg-sheets-url").value = settings.sheetsUrl || "";
  document.getElementById("cfg-allow-skip").checked = Boolean(settings.allowSkip);

  const defaultUrl = settings.qrUrl || (window.location.href.startsWith("http") ? window.location.href : "https://tu-usuario.github.io/pausas-activas/");
  document.getElementById("cfg-qr-url").value = defaultUrl;
  updateQRPreview(defaultUrl);
}

function updateQRPreview(url) {
  const cleanUrl = (url || "").trim();
  if (!cleanUrl) return;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(cleanUrl)}`;
  document.getElementById("qr-image").src = qrSrc;
  document.getElementById("qr-caption").textContent = cleanUrl;
}

document.getElementById("cfg-logo-file").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    settings.logoDataUrl = ev.target.result;
    saveJSON(STORAGE_KEYS.SETTINGS, settings);
    applyBranding();
    showToast("Logo actualizado.");
  };
  reader.readAsDataURL(file);
});

document.getElementById("form-settings").addEventListener("submit", e => {
  e.preventDefault();
  settings.companyName = document.getElementById("cfg-company").value.trim() || "Pausas Activas SST";
  settings.sheetsUrl = document.getElementById("cfg-sheets-url").value.trim();
  settings.allowSkip = document.getElementById("cfg-allow-skip").checked;
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  applyBranding();
  showToast("Configuración guardada correctamente.");
});

document.getElementById("form-change-pass").addEventListener("submit", e => {
  e.preventDefault();
  const cur = document.getElementById("cfg-pass-current").value;
  const next = document.getElementById("cfg-pass-new").value;
  const conf = document.getElementById("cfg-pass-confirm").value;
  const activePass = settings.adminPass || ADMIN_PASS;

  if (cur !== activePass) {
    showToast("La clave actual es incorrecta.");
    return;
  }
  if (next.length < 4) {
    showToast("La nueva clave debe tener al menos 4 caracteres.");
    return;
  }
  if (next !== conf) {
    showToast("La confirmación no coincide con la nueva clave.");
    return;
  }

  settings.adminPass = next;
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  e.target.reset();
  showToast("Clave de administrador actualizada correctamente.");
});

document.getElementById("btn-gen-qr").addEventListener("click", () => {
  const url = document.getElementById("cfg-qr-url").value.trim();
  if (!url) return;
  settings.qrUrl = url;
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
  updateQRPreview(url);
  showToast("Código QR actualizado.");
});

document.getElementById("btn-print-qr").addEventListener("click", () => {
  const url = document.getElementById("cfg-qr-url").value.trim();
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html lang="es"><head><title>Cartel QR - Pausas Activas</title>
    <style>body{font-family:Segoe UI,sans-serif;text-align:center;padding:40px;color:#0f172a;}
      .box{border:4px solid #0f766e;border-radius:20px;padding:35px;max-width:520px;margin:0 auto;}
      h1{color:#0f766e;margin:0 0 8px;font-size:28px;}
      h2{margin:0 0 20px;font-size:20px;color:#ea580c;}
      img{width:280px;height:280px;margin:15px 0;}
      p{font-size:16px;color:#334155;}
    </style></head><body>
      <div class="box">
        <h1>${escapeHTML(settings.companyName || "Pausas Activas SST")}</h1>
        <h2>PAUSAS ACTIVAS CADA 2 HORAS </h2>
        <p>Escanea el código QR con tu celular, ingresa tu <strong>número de cédula</strong>y realiza tus 5 minutos de pausa activa.</p>
        <img src="${qrSrc}"alt="QR Pausas Activas" />
        <p style="font-size:13px;color:#64748b;">${escapeHTML(url)}</p>
      </div>
      <script>window.onload = () =>window.print();</script>
    </body></html>
  `);
  win.document.close();
});

document.getElementById("btn-backup-export").addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    staff,
    attendance,
    settings
  };
  downloadFile(JSON.stringify(payload, null, 2), `respaldo_pausas_sst_${todayISO()}.json`, "application/json");
  showToast("Respaldo descargado.");
});

document.getElementById("btn-backup-import").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data.staff)) staff = data.staff;
      if (Array.isArray(data.attendance)) attendance = data.attendance;
      if (data.settings) settings = { ...settings, ...data.settings };
      saveJSON(STORAGE_KEYS.STAFF, staff);
      saveJSON(STORAGE_KEYS.ATTENDANCE, attendance);
      saveJSON(STORAGE_KEYS.SETTINGS, settings);
      applyBranding();
      refreshAll();
      showToast("Respaldo restaurado correctamente.");
    } catch {
      showToast("Archivo de respaldo inválido.");
    }
    e.target.value = "";
  };
  reader.readAsText(file, "UTF-8");
});

// ==========================================
// CONSEJOS RÁPIDOS DE MANIPULACIÓN DE CARGAS Y SST
// ==========================================
const SST_TIPS = [
  "Manipulación de cargas: Antes de levantar un objeto, evalúa su peso y tamaño. Si supera los 25 kg (hombres) o 12.5 kg (mujeres), pide ayuda o usa una ayuda mecánica.",
  "Técnica de levantamiento: Separa los pies al ancho de los hombros, flexiona las rodillas (no la espalda) y haz la fuerza con las piernas al subir.",
  "Carga pegada al cuerpo: Mantén siempre la caja u objeto lo más cerca posible de tu abdomen; alejar la carga multiplica la presión sobre tu columna lumbar.",
  "Cero giros de cintura: Nunca gires el tronco mientras sostienes peso. Da pasos cortos con los pies para girar todo el cuerpo en bloque.",
  "Agarre seguro: Sujeta la carga firmemente con toda la palma de la mano y no solo con la punta de los dedos para evitar lesiones en muñecas y caídas de objetos.",
  "Planifica el recorrido: Antes de levantar una carga, verifica que el camino esté despejado, seco y sin obstáculos para evitar tropiezos o caídas.",
  "Usa ayudas mecánicas: Siempre que haya carretillas, estibadores o carros disponibles, úsalos. Empujar una carga es mucho más seguro para la espalda que halarla.",
  "Descarga controlada: Al dejar una carga en el piso, vuelve a doblar las rodillas con la espalda recta; evita inclinarte bruscamente o soltar el peso de golpe.",
  "Altura segura: Evita levantar o ubicar cargas pesadas por encima del nivel de los hombros; usa escaleras seguras o pide apoyo para evitar lesiones de manguito rotador.",
  "Trabajo de pie prolongado: Alterna el peso del cuerpo entre una pierna y otra, y apoya brevemente un pie sobre un reposapiés si tu puesto lo permite.",
  "Hidratación constante: Toma un vaso de agua al terminar tu pausa activa para mantener los músculos oxigenados, prevenir calambres y reducir la fatiga.",
  "Uso de EPP: Verifica que tus guantes, botas de seguridad y demás Elementos de Protección Personal estén en buen estado antes de iniciar tu labor.",
  "Orden y aseo (5S): Mantén tu área y los pasillos libres de cajas, cables o derrames. Un lugar ordenado previene la mayoría de los accidentes por caídas.",
  "Reporte oportuno: Si identificas un piso resbaloso, una estiba rota o una herramienta dañada, repórtalo de inmediato a SST antes de que cause un accidente.",
  "Respeta tus pausas cada 2 horas: Cinco minutos de estiramiento reducen hasta en un 40% la fatiga muscular acumulada al final del turno.",
  "Escucha a tu cuerpo: Si sientes dolor punzante en la espalda, hormigueo en manos o mareo, detén la actividad y avisa de inmediato a tu jefe o a SST.",
  "Descanso y concentración: La fatiga disminuye tus reflejos. Si manejas cargas o equipos y te sientes muy agotado, haz una micro-pausa y recupérate.",
  "Trabajo en equipo: Al cargar objetos largos o pesados entre dos personas, coordinen el conteo antes de levantar y bajar al mismo tiempo."
];
let currentTipIdx = 0;

document.getElementById("btn-next-tip").addEventListener("click", () => {
  currentTipIdx = (currentTipIdx + 1) % SST_TIPS.length;
  document.getElementById("sst-tip-text").textContent = SST_TIPS[currentTipIdx];
});

// ==========================================
// INICIALIZACIÓN
// ==========================================
applyBranding();
renderRoutines();
refreshAll();
