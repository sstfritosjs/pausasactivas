# Pausas Activas SST · v5

App web para GitHub Pages con **base de datos compartida en Google Sheets**, **modo grupal dirigido por un líder**, **dos turnos de 12 horas**, historial propio para cada trabajador y vigilancia de molestias osteomusculares. Funciona **sin señal** y se instala en el celular como aplicación.

---

## 🔴 PRIMERO: sube la carpeta `img/`

En el despliegue actual **falta la carpeta `img/`**: por eso en los celulares sale el muñeco animado en vez de la foto real. La app lo resiste sin romperse, pero no estás viendo las fotos.

Sube la carpeta `img/` completa (11 archivos .jpg) a la raíz del repositorio, al mismo nivel que `index.html`. Verifica abriendo:
`https://sstfritosjs.github.io/pausasactivas/img/manos.jpg` — debe mostrar la foto, no un error 404.

---

---

## Modo grupal (un líder dirige y luego marca la asistencia)

Pensado para una tablet, un computador o un televisor en planta.

1. En la pantalla principal: **Modo grupal · dirigido por un líder**. Pide clave (ver abajo).
2. El líder elige la **rutina** (viene marcada la que corresponde a la hora), opcionalmente **quién dirige** y el **área** que participa.
3. **Iniciar pausa grupal**: la rutina corre en pantalla con voz y sonido, igual que la individual pero sin pedir cédula. El botón **Pantalla completa** la deja lista para proyectar.
4. Al terminar aparece **¿Quiénes hicieron la pausa?**: la lista del personal con casillas grandes, buscador, filtro por área y **Marcar todos los visibles**.
5. El botón naranja **!** de cada fila sirve para registrar que esa persona reportó **molestia** y en qué segmento corporal.
6. **Guardar asistencia**: se crea un registro por persona, todos en un solo envío a Google Sheets.

También está el atajo **"Ya la hicimos · solo marcar asistencia"**, para cuando la pausa se hizo sin la pantalla.

### Lo que protege el dato
- Quien ya registró una pausa dentro del intervalo mínimo aparece **bloqueado y gris**, con los minutos que le faltan. No se puede marcar ni con "Marcar todos". Así el modo grupal no sirve para inflar el cumplimiento.
- Cada registro guarda **Modo** (Grupal o Individual) y **Líder** que la dirigió, para que en auditoría se sepa quién certificó esa asistencia.
- La lista señala a quien tiene **recomendación médica** registrada.

### Clave de líder (recomendado)
En **Administrador → Configuración → Clave de Líder de Pausa Grupal** defines una clave aparte para supervisores: les deja dirigir pausas y marcar asistencia **sin** darles acceso al panel de administrador. Si la dejas vacía, el modo grupal pide la clave de administrador.

> Marcar la asistencia de otros es una facultad fuerte: entrégale esa clave solo a quien responda por el registro.

---

## Los dos turnos de 12 horas

El turno y la rutina **se deciden por la hora** en que el colaborador inicia su pausa. No hay que asignarle turno a nadie, así que **funciona igual aunque los turnos roten** cada semana.

Configuración que viene por defecto (editable en **Administrador → Configuración**):

| Turno | Inicio | Horas de pausa |
|---|---|---|
| Turno 1 · Día | 06:00 | 08:00 · 10:00 · 12:00 · 14:00 · 16:00 |
| Turno 2 · Noche | 18:00 | 20:00 · 22:00 · 00:00 · 02:00 · 04:00 |

- Las 4 rutinas **rotan en el orden de esas horas**: la 5.ª pausa vuelve al Bloque 1.
- El botón **Generar cada 2 horas** llena las franjas solo, desde la hora de inicio del turno.
- La **jornada arranca con el turno 1** (06:00): lo que un operario del turno noche registre a las 02:00 cuenta para la jornada del día anterior, no parte el cumplimiento en dos días.
- Cada registro guarda su **Turno**, y hay tabla de cumplimiento por turno, filtro por turno en el historial y desglose por turno en el informe mensual y en el correo diario.
- Si algún día vuelven a un solo turno, se cambia en **Turnos que maneja la empresa** sin perder la configuración del otro.

---

## El logo

Antes no llegaba a los demás dispositivos porque el archivo original no cabe en una celda de Google Sheets. Ahora **se reduce y comprime automáticamente al subirlo** (queda en unos 10–25 KB) y viaja en la configuración compartida.

- Se muestra **completo, sin recortar**, en un recuadro blanco que respeta su proporción.
- En Configuración hay **vista previa** y botón **Quitar logo** (lo quita en todos los dispositivos).
- En el celular, si hay logo, el nombre de la empresa pasa a dos líneas en vez de cortarse.
- Recomendación: PNG con fondo transparente y formato horizontal.

---

## Respiración y cuidado

Volvió el tercer recuadro por ejercicio que tenía tu versión anterior y que no venía en los archivos que me pasaste. Está escrito para **los 24 ejercicios**: cuándo inhalar y exhalar, y la precaución concreta de ese movimiento ("el talón de atrás no se levanta", "nunca empujes la cabeza con la mano", "si sientes hormigueo, suelta de inmediato").

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

El script agrega las columnas **Turno**, **Modo** y **Lider** al final de `Registros`, así que **tus registros actuales no se desalinean** ni se pierden. Administra tres hojas:

| Hoja | Columnas |
|---|---|
| `Personal` | Documento · Nombre · Area · **Restriccion** |
| `Registros` | Fecha · Hora · Cedula · Nombre · Area · Rutina · Bienestar · Segmento · Origen · RegistroID · Turno · **Modo** · **Lider** |
| `Config` | Parámetros compartidos (empresa, logo, meta, turnos, clave cifrada, correo SST) |

---

## Subirlo a GitHub Pages

Sube a la rama `main`:

```
index.html   styles.css   app.js   routines.js   illustrations.js
manifest.json   sw.js   icon-192.png   icon-512.png
img/   (11 fotos · OBLIGATORIA)      README.md
```

**Settings → Pages → Deploy from a branch → `main` / `root`.**

> **Al publicar cambios:** sube el número `?v=` en `index.html` **y** el `CACHE_VERSION` en `sw.js`. Si no, los celulares seguirán usando la versión guardada. Esta versión ya va en `v5`.

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
