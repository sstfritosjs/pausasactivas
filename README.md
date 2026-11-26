# Pausas Activas SST (Cada 2 Horas · 5+ Minutos)

Aplicación web estática lista para **GitHub Pages** diseñada para equipos que permanecen de pie y realizan esfuerzo físico.

## Características principales
- **Pantalla Principal por Cédula:** El colaborador ingresa su número de cédula, inicia su pausa guiada (mínimo 5 minutos) y su asistencia se registra automáticamente al finalizar.
- **Persona animada a 60 FPS + Guía por voz y sonido:** Muestra claramente cada parte del cuerpo, resalta la zona trabajada, indica **qué estás moviendo** y **qué lesiones evita**, con alertas sonoras y voz en español.
- **Control anti-salto:** Por defecto bloquea el botón *Siguiente* para garantizar que se cumplan los 5 minutos completos.
- **Panel de Administrador (`🔒 Administrador`, clave por defecto `admin123`):**
  - **Cumplimiento (Sí / No):** muestra cuántos hicieron pausa hoy, quiénes sí, quiénes no y cuántas pausas lleva cada uno + exportación a Excel (CSV).
  - **Historial detallado** filtrable por fecha y área.
  - **Carga masiva de personal** por CSV (Excel) con plantilla descargable.
  - **Configuración, Logo, QR imprimible y Respaldo JSON.**
  - **Sincronización opcional con Google Sheets.**

## Cómo montarla en GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo: `pausas-activas`).
2. Sube los archivos `index.html`, `styles.css`, `illustrations.js`, `app.js` y `README.md` a la rama `main`.
3. En tu repositorio, ve a **Settings** -> **Pages** -> **Deploy from a branch** (`main` / `root`) y guarda.
4. En 1 a 2 minutos tendrás tu enlace público (ej. `https://tu-usuario.github.io/pausas-activas/`).

## Cómo conectar Google Sheets (Opcional - Gratis)
Para que los registros de todos los celulares y computadores lleguen a una misma hoja de Excel en Google Drive:
1. Crea una hoja en **Google Sheets** con los encabezados en la fila 1: `Fecha`, `Hora`, `Cedula`, `Nombre`, `Area`, `Rutina`.
2. Ve a **Extensiones -> Apps Script** y pega este código:
```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.date, data.time, data.id, data.name, data.area, data.routine]);
  return ContentService.createTextOutput("OK");
}
```
3. Haz clic en **Implementar -> Nueva implementación -> Aplicación web** (acceso: *Cualquier persona*) y copia la URL `/exec`.
4. Entra a tu página -> **🔒 Administrador** -> **⚙️ Configuración y QR** -> pega la URL y guarda.
