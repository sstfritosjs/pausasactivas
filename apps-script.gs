/*
 * ==========================================================
 * PAUSAS ACTIVAS SST — BACKEND (Google Apps Script)  v3
 * Base de datos compartida entre TODOS los celulares y PC
 * ==========================================================
 * Hojas que administra: Personal, Registros, Config
 * Despliegue: Implementar > Gestionar implementaciones > editar
 *   - Ejecutar como: Yo
 *   - Quien tiene acceso: Cualquier persona
 * Correo diario: ejecutar una vez la funcion crearDisparadorDiario()
 * ==========================================================
 */

var API_KEY     = 'pausas-sst-2026';   // Debe ser IDENTICA a API_KEY en app.js
var SH_STAFF    = 'Personal';
var SH_ATT      = 'Registros';
var SH_CFG      = 'Config';
var MAX_RECORDS = 6000;
var HORA_RESUMEN = 17;                 // Hora del correo de cierre de turno

var HEAD_STAFF = ['Documento', 'Nombre', 'Area', 'Restriccion'];
var HEAD_ATT   = ['Fecha', 'Hora', 'Cedula', 'Nombre', 'Area', 'Rutina', 'Bienestar', 'Segmento', 'Origen', 'RegistroID'];
var HEAD_CFG   = ['Clave', 'Valor'];

/* ---------------- Utilidades ---------------- */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tz_() { return Session.getScriptTimeZone() || 'America/Bogota'; }

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  // Completa encabezados que falten (migracion desde versiones anteriores)
  var cols = Math.max(sh.getLastColumn(), 1);
  var actual = sh.getRange(1, 1, 1, Math.max(cols, headers.length)).getValues()[0];
  var faltan = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(actual[i] || '').trim() !== headers[i]) { faltan = true; break; }
  }
  if (faltan) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(sh, ncols) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, ncols).getValues();
}

function txt_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  return String(v).trim();
}

function hora_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'HH:mm');
  return txt_(v);
}

function fechaDe_(d)  { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function horaDe_(d)   { return Utilities.formatDate(d, tz_(), 'HH:mm'); }

/* Fecha de jornada: si el turno arranca a las 06:00, lo ocurrido a la 01:00
   pertenece a la jornada del dia anterior. */
function jornadaISO_(d, inicioHora) {
  var h = Number(inicioHora) || 0;
  var x = new Date(d.getTime());
  if (h > 0 && x.getHours() < h) x.setDate(x.getDate() - 1);
  return fechaDe_(x);
}

/* ---------------- Lectura ---------------- */

function readStaff_() {
  return rows_(sheet_(SH_STAFF, HEAD_STAFF), HEAD_STAFF.length)
    .map(function (r) {
      return {
        id: txt_(r[0]),
        name: txt_(r[1]),
        area: txt_(r[2]) || 'Operaciones',
        medical: txt_(r[3])
      };
    })
    .filter(function (p) { return p.id && p.name; });
}

function readAttendance_() {
  var all = rows_(sheet_(SH_ATT, HEAD_ATT), HEAD_ATT.length)
    .map(function (r) {
      return {
        date: txt_(r[0]), time: hora_(r[1]), id: txt_(r[2]), name: txt_(r[3]),
        area: txt_(r[4]), routine: txt_(r[5]), feeling: txt_(r[6]) || 'Bien',
        segment: txt_(r[7]), origin: txt_(r[8]), rid: txt_(r[9])
      };
    })
    .filter(function (r) { return r.id && r.date; });
  if (all.length > MAX_RECORDS) all = all.slice(all.length - MAX_RECORDS);
  return all.reverse();
}

function readConfig_() {
  var cfg = {};
  rows_(sheet_(SH_CFG, HEAD_CFG), HEAD_CFG.length).forEach(function (r) {
    var k = txt_(r[0]);
    if (!k) return;
    var v = r[1];
    if (k === 'dailyGoal' || k === 'minGapMinutes' || k === 'shiftStartHour') v = Number(v) || 0;
    else if (k === 'allowSkip') v = (String(v) === 'true' || v === true);
    else if (k === 'slots') { v = txt_(v).split(',').map(function (s) { return s.trim(); }).filter(String); }
    else v = txt_(v);
    cfg[k] = v;
  });
  return cfg;
}

/* ---------------- Escritura ---------------- */

/* Combina en vez de reemplazar: si dos administradores editan a la vez,
   ninguno borra el trabajo del otro. */
function saveStaff_(list, removeIds, mode) {
  var sh = sheet_(SH_STAFF, HEAD_STAFF);
  var actuales = readStaff_();
  var mapa = {};
  var orden = [];

  if (mode !== 'replace') {
    actuales.forEach(function (p) { mapa[p.id] = p; orden.push(p.id); });
  }

  (list || []).forEach(function (p) {
    var id = txt_(p && p.id);
    var name = txt_(p && p.name);
    if (!id || !name) return;
    if (!mapa[id]) orden.push(id);
    mapa[id] = { id: id, name: name, area: txt_(p.area) || 'Operaciones', medical: txt_(p.medical) };
  });

  (removeIds || []).forEach(function (id) {
    var k = txt_(id);
    if (mapa[k]) { delete mapa[k]; }
  });

  var filas = [];
  var vistos = {};
  orden.forEach(function (id) {
    if (!mapa[id] || vistos[id]) return;
    vistos[id] = true;
    filas.push([mapa[id].id, mapa[id].name, mapa[id].area, mapa[id].medical || '']);
  });

  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, HEAD_STAFF.length).clearContent();
  if (filas.length) {
    var rng = sh.getRange(2, 1, filas.length, HEAD_STAFF.length);
    rng.setNumberFormat('@');   // TEXTO: conserva ceros a la izquierda de la cedula
    rng.setValues(filas);
  }
  return filas.length;
}

/*
 * Sello de tiempo del servidor.
 * El celular manda queuedMs = cuanto tiempo llevaba el registro esperando en
 * la cola (una resta de su propio reloj, inmune a que el reloj este mal).
 * El servidor calcula el momento real = ahora - queuedMs.
 */
function addAttendance_(rec, cfg) {
  if (!rec || !rec.id) return false;
  var sh = sheet_(SH_ATT, HEAD_ATT);
  var rid = txt_(rec.rid) || ('r' + new Date().getTime());

  var last = sh.getLastRow();
  if (last > 1) {
    var existing = sh.getRange(2, 10, last - 1, 1).getValues();
    for (var i = 0; i < existing.length; i++) {
      if (txt_(existing[i][0]) === rid) return true;   // reenvio: no duplica
    }
  }

  var queued = Number(rec.queuedMs) || 0;
  if (queued < 0 || queued > 1000 * 60 * 60 * 24 * 14) queued = 0;
  var real = new Date(new Date().getTime() - queued);
  var origen = queued > 1000 * 60 * 10 ? 'Diferido' : 'En linea';

  var row = Math.max(sh.getLastRow(), 1) + 1;
  var rng = sh.getRange(row, 1, 1, HEAD_ATT.length);
  rng.setNumberFormat('@');
  rng.setValues([[
    jornadaISO_(real, cfg && cfg.shiftStartHour),
    horaDe_(real),
    txt_(rec.id), txt_(rec.name), txt_(rec.area), txt_(rec.routine),
    txt_(rec.feeling) || 'Bien', txt_(rec.segment), origen, rid
  ]]);
  return true;
}

function saveConfig_(cfg) {
  var sh = sheet_(SH_CFG, HEAD_CFG);
  var actual = readConfig_();
  Object.keys(cfg || {}).forEach(function (k) { actual[k] = cfg[k]; });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, HEAD_CFG.length).clearContent();
  var out = Object.keys(actual).map(function (k) {
    var v = actual[k];
    if (Object.prototype.toString.call(v) === '[object Array]') v = v.join(',');
    return [k, v];
  });
  if (out.length) {
    var rng = sh.getRange(2, 1, out.length, 2);
    rng.setNumberFormat('@');
    rng.setValues(out);
  }
  return actual;
}

function clearAttendance_() {
  var sh = sheet_(SH_ATT, HEAD_ATT);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  return true;
}

/* ---------------- Enrutador ---------------- */

var ACCIONES_ADMIN = { saveStaff: 1, saveConfig: 1, clearAttendance: 1 };

function handle_(params, body) {
  var data   = body || {};
  var action = txt_(data.action) || txt_(params.action) || 'load';
  var key    = txt_(data.key) || txt_(params.key);

  if (API_KEY && key !== API_KEY) {
    return json_({ ok: false, error: 'clave-invalida' });
  }

  var cfg = readConfig_();

  if (action === 'ping') {
    return json_({ ok: true, action: 'ping', staff: readStaff_().length, serverTime: new Date().toISOString() });
  }

  if (action === 'load') {
    return json_({
      ok: true,
      staff: readStaff_(),
      attendance: readAttendance_(),
      config: cfg,
      serverTime: new Date().toISOString()
    });
  }

  // Las acciones destructivas exigen la clave de administrador.
  // Si la hoja aun no tiene clave guardada, se permite para la configuracion inicial.
  if (ACCIONES_ADMIN[action] && cfg.adminPassHash) {
    if (txt_(data.adminHash) !== txt_(cfg.adminPassHash)) {
      return json_({ ok: false, error: 'requiere-clave-administrador' });
    }
  }

  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (e) { return json_({ ok: false, error: 'ocupado' }); }

  try {
    if (action === 'addAttendance') {
      addAttendance_(data.record || data, cfg);
      return json_({ ok: true, action: action });
    }
    if (action === 'saveStaff') {
      var n = saveStaff_(data.staff, data.removeIds, data.mode);
      return json_({ ok: true, action: action, saved: n, staff: readStaff_() });
    }
    if (action === 'saveConfig') {
      return json_({ ok: true, action: action, config: saveConfig_(data.config) });
    }
    if (action === 'clearAttendance') {
      clearAttendance_();
      return json_({ ok: true, action: action });
    }
    return json_({ ok: false, error: 'accion-desconocida: ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var body = null;
  if (p.payload) { try { body = JSON.parse(p.payload); } catch (err) { body = null; } }
  return handle_(p, body);
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var body = null;
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = null; }
  if (!body && p.payload) { try { body = JSON.parse(p.payload); } catch (err2) { body = null; } }
  return handle_(p, body);
}

/* ==========================================================
 * CORREO AUTOMATICO DE CIERRE DE TURNO
 * Ejecuta crearDisparadorDiario() UNA SOLA VEZ desde el editor.
 * ========================================================== */

function crearDisparadorDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'enviarResumenDiario') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('enviarResumenDiario')
    .timeBased()
    .atHour(HORA_RESUMEN)
    .everyDays(1)
    .create();
  return 'Disparador creado: todos los dias cerca de las ' + HORA_RESUMEN + ':00';
}

function resumenDelDia_(fechaISO) {
  var cfg = readConfig_();
  var personal = readStaff_();
  var registros = readAttendance_().filter(function (r) { return r.date === fechaISO; });

  var conteo = {};
  registros.forEach(function (r) { conteo[r.id] = (conteo[r.id] || 0) + 1; });

  var meta = Number(cfg.dailyGoal) || 3;
  var cumplieron = [], pendientes = [], molestias = [];

  personal.forEach(function (p) {
    var n = conteo[p.id] || 0;
    if (n > 0) cumplieron.push({ p: p, n: n });
    else pendientes.push(p);
  });

  registros.forEach(function (r) {
    if ((r.feeling || '').toLowerCase().indexOf('molestia') >= 0) {
      molestias.push(r);
    }
  });

  return {
    fecha: fechaISO, meta: meta, total: personal.length,
    cumplieron: cumplieron, pendientes: pendientes, molestias: molestias,
    pct: personal.length ? Math.round(cumplieron.length * 100 / personal.length) : 0,
    empresa: cfg.companyName || 'Pausas Activas SST',
    correo: cfg.sstEmail || ''
  };
}

function enviarResumenDiario() {
  var cfg = readConfig_();
  var destino = txt_(cfg.sstEmail);
  if (!destino) { Logger.log('Sin correo configurado (clave sstEmail en la hoja Config).'); return; }

  var hoy = jornadaISO_(new Date(), cfg.shiftStartHour);
  var r = resumenDelDia_(hoy);

  var li = function (arr, fn) {
    if (!arr.length) return '<li style="color:#15803d">Ninguno</li>';
    return arr.map(fn).join('');
  };

  var html =
    '<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a;max-width:640px">' +
    '<h2 style="color:#0f766e;margin-bottom:4px">' + r.empresa + '</h2>' +
    '<p style="margin-top:0;color:#64748b">Resumen de pausas activas · ' + r.fecha + '</p>' +
    '<table cellpadding="10" style="border-collapse:collapse;margin:14px 0">' +
      '<tr>' +
        '<td style="background:#f0fdfa;border-radius:8px;text-align:center"><b style="font-size:22px">' + r.pct + '%</b><br>Cumplimiento</td>' +
        '<td style="background:#dcfce7;border-radius:8px;text-align:center"><b style="font-size:22px">' + r.cumplieron.length + '</b><br>Sí hicieron</td>' +
        '<td style="background:#fee2e2;border-radius:8px;text-align:center"><b style="font-size:22px">' + r.pendientes.length + '</b><br>No hicieron</td>' +
        '<td style="background:#fef9c3;border-radius:8px;text-align:center"><b style="font-size:22px">' + r.molestias.length + '</b><br>Molestias</td>' +
      '</tr>' +
    '</table>' +
    '<h3 style="color:#b91c1c;margin-bottom:4px">Molestias reportadas hoy</h3><ul>' +
      li(r.molestias, function (m) {
        return '<li><b>' + m.name + '</b> (' + m.area + ') — ' + (m.segment || 'sin segmento') + ' · ' + m.time + '</li>';
      }) +
    '</ul>' +
    '<h3 style="color:#c2410c;margin-bottom:4px">Personal sin pausa registrada</h3><ul>' +
      li(r.pendientes, function (p) { return '<li>' + p.name + ' — ' + p.area + '</li>'; }) +
    '</ul>' +
    '<p style="font-size:12px;color:#94a3b8;margin-top:22px">Mensaje automático del programa de pausas activas. ' +
    'Las molestias reportadas son insumo de morbilidad sentida para el sistema de vigilancia epidemiológica osteomuscular.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: destino,
    subject: '[SST] Pausas activas ' + r.fecha + ' — ' + r.pct + '% cumplimiento, ' + r.molestias.length + ' molestia(s)',
    htmlBody: html
  });
  Logger.log('Resumen enviado a ' + destino);
}
