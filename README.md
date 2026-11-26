# Pausas Activas SST · v3

App web para GitHub Pages con **base de datos compartida en Google Sheets**, historial propio para cada trabajador y vigilancia de molestias osteomusculares. Funciona **sin señal** y se instala en el celular como aplicación.

---

## ⚠️ PASO OBLIGATORIO: actualizar el Apps Script

### 1. Reemplaza el código en Google
1. Abre tu hoja de Google Sheets → **Extensiones → Apps Script**.
2. Borra **todo** el código y pega el contenido completo de **`apps-script.gs`**.
3. Guarda (💾).

### 2. Publica la nueva versión SIN cambiar la URL
1. **Implementar → Gestionar implementaciones**.
2. Lápiz ✏️ **(Editar)** en la implementación existente.
3. En **Versión**, elige **Nueva versión**.
4. Verifica: *Ejecutar como* = **Yo** · *Quién tiene acceso* = **Cualquier persona**.
5. **Implementar**.

> Así conservas la misma URL `/exec` que ya está dentro de `app.js`.
> Si creas una implementación *nueva*, la URL cambia: pégala en **🔒 Administrador → Configuración y QR**.

### 3. Activa el correo diario de cierre de turno
1. En el editor de Apps Script, elige la función **`crearDisparadorDiario`** en la lista desplegable y pulsa **Ejecutar**.
2. Autoriza los permisos que pida Google (enviar correo en tu nombre).
3. En la app: **Administrador → Configuración** → escribe el **correo de SST** y guarda.

A partir de ahí recibes cada día cerca de las 5:00 p. m. un correo con el % de cumplimiento, quién no hizo pausa y **qué molestias se reportaron, con el segmento corporal**.

### 4. Comprueba
**Administrador → Configuración y QR → Probar conexión.** Debe decir *"Conexión correcta…"*.

El script administra tres hojas y no toca tus datos anteriores:

| Hoja | Columnas |
|---|---|
| `Personal` | Documento · Nombre · Area · **Restriccion** |
| `Registros` | Fecha · Hora · Cedula · Nombre · Area · Rutina · Bienestar · **Segmento** · **Origen** · RegistroID |
| `Config` | Parámetros compartidos (empresa, meta, franjas, clave cifrada, correo SST) |

---

## Subirlo a GitHub Pages

Sube a la rama `main`:

```
index.html   styles.css   app.js   routines.js   illustrations.js
manifest.json   sw.js   icon-192.png   icon-512.png
img/   (11 fotos)        README.md
```

**Settings → Pages → Deploy from a branch → `main` / `root`.**

> **Al publicar cambios:** sube el número `?v=` en `index.html` **y** el `CACHE_VERSION` en `sw.js`. Si no, los celulares seguirán usando la versión guardada.

---

## Lo nuevo en esta versión

### Corrige fallas que ensuciaban el dato
| Antes | Ahora |
|---|---|
| El bloque avanzaba por contador: el 2º trabajador del día hacía el Bloque 2 aunque fueran las 8 a. m. | **La rutina se decide por la hora del día**, con 4 franjas configurables |
| Se podían registrar 5 pausas seguidas e inflar el cumplimiento | **Intervalo mínimo** configurable (60 min por defecto) con aviso de a qué hora podrá volver |
| La fecha y la hora las ponía el celular (un reloj mal configurado dañaba el reporte) | **Sello de tiempo del servidor.** El celular envía cuánto tiempo esperó en la cola y el servidor reconstruye el momento real. Cada registro queda marcado `En linea` o `Diferido` |
| El temporizador de 2 h se reiniciaba al recargar y nadie lo miraba | Reemplazado por el **horario visible del día** con cuenta regresiva a la próxima franja |
| Dos administradores editando a la vez: el último borraba al otro | El servidor **combina** en vez de reemplazar |
| Turnos que cruzaban medianoche partían el cumplimiento en dos días | **Hora de inicio de jornada** configurable |

### Añade valor al SG-SST
- **Morbilidad sentida por segmento corporal.** Al reportar molestia se pregunta dónde: cuello, hombros, espalda alta/baja, brazos o muñecas, piernas o rodillas, pies. Alimenta tu SVE de DME.
- **Alerta de seguimiento:** quien reporte 3 o más molestias en el periodo aparece señalado para remisión a medicina laboral e inspección del puesto.
- **Recomendaciones médicas por trabajador.** Si el colaborador tiene restricción (hernia, embarazo, hombro), ve un aviso obligatorio antes de empezar y puede **omitir ejercicios** aunque el salto esté bloqueado para los demás.
- **Correo automático de cierre de turno** a SST.
- **Informe mensual imprimible** (Historial → Generar informe mensual) con indicadores, cumplimiento por área, morbilidad por segmento, personal sin pausas y espacio de firma para SG-SST y COPASST. Desde el diálogo de impresión: *Guardar como PDF*.
- **Exportación Excel ampliada** con hoja de morbilidad sentida.

### Para el trabajador
- **Mi historial de pausas**: pausas de hoy contra la meta, total del mes, días con meta cumplida, racha de días activo, gráfico de los últimos 7 días y detalle de cada pausa con cómo se sintió.
- **Constancia imprimible** de participación, con espacio de firma.

### Técnico
- **Funciona sin señal.** Service worker + manifiesto: la app abre aunque no haya internet y se instala con *"Agregar a pantalla de inicio"*. Las pausas quedan en cola y se envían solas al reconectar.
- **Aviso de versión nueva** cuando se publica una actualización.
- Las acciones destructivas (guardar personal, borrar historial, cambiar configuración) **exigen la clave de administrador** también en el servidor.
- La clave de administrador viaja y se guarda **cifrada con SHA-256**; nunca en texto plano.
- Rutinas separadas en `routines.js`: editar ejercicios ya no obliga a tocar la lógica.
- Eliminado `avatar3d.js` (código muerto).

---

## Fotos de los ejercicios

Integradas en `img/`: `talones` · `lumbar` · `cuadriceps` · `hombros` · `cuello` · `pectoral` · `cadera` · `isquios` · `gemelos` · `muneca` · `manos`.

Los 8 restantes (`marcha`, `dorsal`, `tobillos`, `lateral`, `respiracion`, `sentadilla`, `rotacion`, `pronosupinacion`) usan la animación 2D. Para reemplazarlos: deja la foto en `img/` con ese nombre exacto y agrega la línea al mapa `EXERCISE_PHOTOS` en `illustrations.js`.

---

## Protección de datos (Ley 1581 de 2012)

La hoja se publica como *"Cualquier persona"*: así funciona Apps Script sin pedir cuenta Google a los operarios.

Lo que ya está resuelto:
- La clave de administrador nunca viaja en texto plano.
- Las operaciones destructivas exigen esa clave también en el servidor.

Lo que debes hacer tú:
- **Cambia `API_KEY`** por un valor propio en los **dos** archivos: `apps-script.gs` y `app.js`.
- Incluye la herramienta en tu inventario de bases de datos y en la autorización de tratamiento de datos del personal.
- Ten presente que la `API_KEY` viaja en el código de la página: frena el acceso casual, no a alguien decidido. Si necesitas control de acceso real por usuario y auditoría, la ruta robusta es **Firebase Firestore con reglas de seguridad**.

### Límites honestos
- **Cualquiera puede escribir la cédula de otro** y registrarle una pausa o ver su historial. Para evidencia fuerte haría falta PIN por trabajador o QR personal.
- El panel de administrador se valida en el navegador: protege de curiosos, no de alguien con conocimientos técnicos.
