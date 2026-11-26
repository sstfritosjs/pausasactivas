// ==========================================
// CATÁLOGO DE RUTINAS (4 BLOQUES · MÍNIMO 5 MIN)
// Enfoque: personal de pie y esfuerzo físico.
// Editar aquí los ejercicios no requiere tocar la lógica de la app.
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
