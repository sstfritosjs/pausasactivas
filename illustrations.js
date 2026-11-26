// ==========================================
// ANIMADOR ANATÓMICO 2D EN CANVAS (60 FPS)
// Persona proporcionada con ropa SST, articulaciones reales y zona muscular resaltada
// Funciona 100% local (file://) y en GitHub Pages sin dependencias externas
// ==========================================

class HumanExerciseCanvas {
  constructor(canvas, exerciseKey) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.key = exerciseKey;
    this.t = 0;
    this.paused = false;
    this.raf = null;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setExercise(key) {
    this.key = key;
    this.t = 0;
  }

  setPaused(val) {
    this.paused = val;
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  // Dibuja un segmento anatómico con volumen (muslo, pantorrilla, brazo, antebrazo)
  drawLimb(x1, y1, x2, y2, r1, r2, color, highlight = false) {
    const ctx = this.ctx;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const perp = angle + Math.PI / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1 + Math.cos(perp) * r1, y1 + Math.sin(perp) * r1);
    ctx.lineTo(x2 + Math.cos(perp) * r2, y2 + Math.sin(perp) * r2);
    ctx.arc(x2, y2, r2, perp, perp + Math.PI, true);
    ctx.lineTo(x1 - Math.cos(perp) * r1, y1 - Math.sin(perp) * r1);
    ctx.arc(x1, y1, r1, perp + Math.PI, perp, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (highlight) {
      ctx.strokeStyle = "rgba(234, 88, 12, 0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Dibuja brillo pulsante en la zona muscular/articular activa
  drawGlow(x, y, radius = 16) {
    const ctx = this.ctx;
    const pulse = 0.55 + 0.45 * Math.sin(this.t * 5);
    const grad = ctx.createRadialGradient(x, y, 2, x, y, radius + pulse * 6);
    grad.addColorStop(0, "rgba(234, 88, 12, 0.75)");
    grad.addColorStop(1, "rgba(234, 88, 12, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + pulse * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dibuja cabeza con rostro, cabello y cuello
  drawHead(x, y, tilt = 0, profile = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    // Cuello
    ctx.fillStyle = "#e6b89c";
    ctx.fillRect(-6, 8, 12, 14);

    // Cabeza
    ctx.fillStyle = "#f1c7ab";
    ctx.beginPath();
    ctx.ellipse(0, -4, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabello
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(0, -8, 16, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();

    // Rostro
    ctx.fillStyle = "#0f172a";
    if (profile) {
      // Ojo perfil derecho
      ctx.beginPath();
      ctx.arc(7, -5, 2, 0, Math.PI * 2);
      ctx.fill();
      // Sonrisa
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(8, 3, 4, 0.2, 1.3);
      ctx.stroke();
    } else {
      // Dos ojos frente
      ctx.beginPath();
      ctx.arc(-5, -5, 2, 0, Math.PI * 2);
      ctx.arc(5, -5, 2, 0, Math.PI * 2);
      ctx.fill();
      // Sonrisa
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 2, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Dibuja zapato de seguridad
  drawShoe(x, y, angle = 0, facingRight = true) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    const dir = facingRight ? 1 : -1;
    ctx.roundRect(dir > 0 ? -7 : -19, -5, 26, 11, 5);
    ctx.fill();
    // Suela blanca
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(dir > 0 ? -6 : -18, 4, 24, 3);
    ctx.restore();
  }

  // Calcula punto final dado origen, largo y ángulo (0 = abajo, positivo = derecha/adelante)
  pt(x, y, len, rad) {
    return {
      x: x + Math.sin(rad) * len,
      y: y + Math.cos(rad) * len
    };
  }

  drawScene() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fondo estudio limpio
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f0fdfa");
    bg.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Piso y sombra
    const floorY = H - 26;
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.ellipse(W / 2, floorY + 2, 62, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const s = Math.sin(this.t * 2.4);
    const sSlow = Math.sin(this.t * 1.5);
    const c = Math.cos(this.t * 2.4);

    // Colores ropa SST
    const polo = "#0f766e";
    const poloDark = "#0d5f59";
    const pants = "#1e293b";
    const pantsDark = "#0f172a";
    const skin = "#f1c7ab";

    // Pose base
    let cx = W / 2;
    let hipY = floorY - 96;
    let torsoLean = 0;
    let headTilt = 0;
    let profile = false;

    // Ángulos piernas (0 = recto hacia abajo)
    let lThighA = -0.08, lCalfA = -0.05;
    let rThighA = 0.08, rCalfA = 0.05;
    let lFootA = 0, rFootA = 0;

    // Ángulos brazos (0 = recto hacia abajo)
    let lUpperA = -0.25, lForeA = -0.15;
    let rUpperA = 0.25, rForeA = 0.15;

    let glowPoints = [];
    let drawWall = false;

    switch (this.key) {
      case "talones": {
        const lift = Math.max(0, s) * 14;
        hipY -= lift;
        lFootA = lift * 0.03;
        rFootA = -lift * 0.03;
        lUpperA = -0.55; lForeA = 0.55;
        rUpperA = 0.55; rForeA = -0.55;
        glowPoints = [{ x: cx - 14, y: floorY - 24 }, { x: cx + 14, y: floorY - 24 }];
        break;
      }
      case "lumbar": {
        profile = true;
        const arch = (sSlow * 0.5 + 0.5) * 0.36;
        torsoLean = -arch;
        headTilt = -arch * 0.6;
        lThighA = -0.06; rThighA = 0.06;
        lUpperA = -0.45; lForeA = 0.5;
        rUpperA = -0.45; rForeA = 0.5;
        glowPoints = [{ x: cx - 6, y: hipY - 12 }];
        break;
      }
      case "cuadriceps": {
        profile = true;
        drawWall = true;
        lThighA = 0; lCalfA = 0;
        rThighA = -0.12; rCalfA = -2.25 - sSlow * 0.12;
        lUpperA = 1.25; lForeA = 1.35; // mano en pared
        rUpperA = -0.45; rForeA = -0.95; // mano tomando pie
        glowPoints = [{ x: cx + 6, y: hipY + 26 }];
        break;
      }
      case "marcha": {
        const lLift = Math.max(0, s);
        const rLift = Math.max(0, -s);
        lThighA = -0.1 - lLift * 1.15;
        lCalfA = lLift * 0.25;
        rThighA = 0.1 + rLift * 1.15;
        rCalfA = -rLift * 0.25;
        lUpperA = -0.25 - rLift * 0.5; lForeA = -0.7;
        rUpperA = 0.25 + lLift * 0.5; rForeA = 0.7;
        glowPoints = [{ x: cx, y: hipY + 12 }];
        break;
      }
      case "hombros": {
        lUpperA = -0.35 - c * 0.18; lForeA = -0.2 + s * 0.15;
        rUpperA = 0.35 + c * 0.18; rForeA = 0.2 - s * 0.15;
        glowPoints = [{ x: cx - 22, y: hipY - 56 }, { x: cx + 22, y: hipY - 56 }];
        break;
      }
      case "cuello": {
        headTilt = sSlow * 0.45;
        if (headTilt >= 0) {
          rUpperA = 2.1; rForeA = 0.45;
          lUpperA = -0.2; lForeA = -0.1;
        } else {
          lUpperA = -2.1; lForeA = -0.45;
          rUpperA = 0.2; rForeA = 0.1;
        }
        glowPoints = [{ x: cx, y: hipY - 68 }];
        break;
      }
      case "pectoral": {
        profile = true;
        const open = 0.55 + (sSlow * 0.5 + 0.5) * 0.35;
        torsoLean = -0.14;
        lUpperA = -open; lForeA = -open - 0.15;
        rUpperA = -open; rForeA = -open - 0.15;
        glowPoints = [{ x: cx + 10, y: hipY - 46 }];
        break;
      }
      case "dorsal": {
        profile = true;
        const reach = 1.45 + (sSlow * 0.5 + 0.5) * 0.15;
        torsoLean = 0.18;
        lUpperA = reach; lForeA = reach;
        rUpperA = reach; rForeA = reach;
        glowPoints = [{ x: cx - 12, y: hipY - 48 }];
        break;
      }
      case "cadera": {
        cx += s * 16;
        torsoLean = -s * 0.12;
        lThighA = -0.18 - s * 0.1;
        rThighA = 0.18 - s * 0.1;
        lUpperA = -0.65; lForeA = 0.65;
        rUpperA = 0.65; rForeA = -0.65;
        glowPoints = [{ x: cx, y: hipY }];
        break;
      }
      case "isquios": {
        profile = true;
        hipY += 4;
        torsoLean = 0.55 + sSlow * 0.1;
        lThighA = -0.25; lCalfA = 0.2;
        rThighA = 0.52; rCalfA = 0.52;
        rFootA = -0.5;
        lUpperA = 0.35; lForeA = 0.45;
        rUpperA = 0.35; rForeA = 0.45;
        glowPoints = [{ x: cx + 22, y: hipY + 34 }];
        break;
      }
      case "gemelos": {
        profile = true;
        hipY += 10;
        torsoLean = 0.22 + sSlow * 0.06;
        lThighA = -0.58; lCalfA = -0.58;
        rThighA = 0.55; rCalfA = -0.05;
        lUpperA = 0.7; lForeA = 0.9;
        rUpperA = 0.7; rForeA = 0.9;
        glowPoints = [{ x: cx - 32, y: floorY - 28 }];
        break;
      }
      case "tobillos": {
        lThighA = -0.08; lCalfA = -0.05;
        rThighA = 0.28; rCalfA = 0.12;
        rFootA = s * 0.55;
        lUpperA = -0.55; lForeA = 0.55;
        rUpperA = 0.55; rForeA = -0.55;
        glowPoints = [{ x: cx + 26, y: floorY - 12 }];
        break;
      }
      case "muneca": {
        profile = true;
        lUpperA = 1.45; lForeA = 1.45;
        rUpperA = 1.15; rForeA = 1.55;
        glowPoints = [{ x: cx + 62, y: hipY - 50 }];
        break;
      }
      case "manos": {
        lUpperA = -0.85; lForeA = -1.25 - s * 0.12;
        rUpperA = 0.85; rForeA = 1.25 + s * 0.12;
        glowPoints = [{ x: cx - 54, y: hipY - 40 }, { x: cx + 54, y: hipY - 40 }];
        break;
      }
      case "lateral": {
        const bend = sSlow * 0.36;
        torsoLean = bend;
        headTilt = bend * 0.5;
        if (bend >= 0) {
          lUpperA = -2.65; lForeA = -2.2;
          rUpperA = 0.45; rForeA = -0.35;
        } else {
          rUpperA = 2.65; rForeA = 2.2;
          lUpperA = -0.45; lForeA = 0.35;
        }
        glowPoints = [{ x: cx + (bend >= 0 ? -18 : 18), y: hipY - 30 }];
        break;
      }
      case "respiracion": {
        const up = sSlow * 0.5 + 0.5;
        lUpperA = -0.25 - up * 2.4; lForeA = lUpperA - 0.15;
        rUpperA = 0.25 + up * 2.4; rForeA = rUpperA + 0.15;
        glowPoints = [{ x: cx, y: hipY - 36 }];
        break;
      }
      case "sentadilla": {
        profile = true;
        const dip = (sSlow * 0.5 + 0.5);
        hipY += dip * 22;
        torsoLean = 0.18 + dip * 0.22;
        lThighA = 0.45 * dip; lCalfA = -0.4 * dip;
        rThighA = 0.45 * dip; rCalfA = -0.4 * dip;
        lUpperA = 1.25; lForeA = 1.3;
        rUpperA = 1.25; rForeA = 1.3;
        glowPoints = [{ x: cx - 10, y: hipY + 10 }, { x: cx + 10, y: hipY + 34 }];
        break;
      }
      case "rotacion": {
        const twist = sSlow * 0.35;
        torsoLean = twist * 0.2;
        headTilt = twist * 0.35;
        lUpperA = -0.55 + twist * 1.4; lForeA = 0.8 + twist * 1.2;
        rUpperA = 0.55 + twist * 1.4; rForeA = -0.8 + twist * 1.2;
        glowPoints = [{ x: cx, y: hipY - 32 }];
        break;
      }
      case "pronosupinacion": {
        lUpperA = -0.2; lForeA = -1.35 + s * 0.12;
        rUpperA = 0.2; rForeA = 1.35 - s * 0.12;
        glowPoints = [{ x: cx - 44, y: hipY - 22 }, { x: cx + 44, y: hipY - 22 }];
        break;
      }
    }

    // Pared de apoyo para cuádriceps
    if (drawWall) {
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(cx + 58, 28, 8, floorY - 28);
    }

    // Puntos de cadera y hombros
    const hipL = { x: profile ? cx - 4 : cx - 12, y: hipY };
    const hipR = { x: profile ? cx + 4 : cx + 12, y: hipY };
    const torsoTop = this.pt(cx, hipY, -60, -torsoLean);
    const shL = { x: profile ? torsoTop.x - 4 : torsoTop.x - 19, y: torsoTop.y + 4 };
    const shR = { x: profile ? torsoTop.x + 4 : torsoTop.x + 19, y: torsoTop.y + 4 };

    // Pierna izquierda
    const kneeL = this.pt(hipL.x, hipL.y, 46, lThighA);
    const ankleL = this.pt(kneeL.x, kneeL.y, 46, lCalfA);

    // Pierna derecha
    const kneeR = this.pt(hipR.x, hipR.y, 46, rThighA);
    const ankleR = this.pt(kneeR.x, kneeR.y, 46, rCalfA);

    // Brazos
    const elbowL = this.pt(shL.x, shL.y, 32, lUpperA);
    const handL = this.pt(elbowL.x, elbowL.y, 30, lForeA);
    const elbowR = this.pt(shR.x, shR.y, 32, rUpperA);
    const handR = this.pt(elbowR.x, elbowR.y, 30, rForeA);

    // 1. Brazo trasero (en perfil)
    if (profile) {
      this.drawLimb(shL.x, shL.y, elbowL.x, elbowL.y, 7, 6, poloDark);
      this.drawLimb(elbowL.x, elbowL.y, handL.x, handL.y, 6, 4.5, skin);
    }

    // 2. Pierna izquierda y zapato
    this.drawLimb(hipL.x, hipL.y, kneeL.x, kneeL.y, 10, 8, pantsDark);
    this.drawLimb(kneeL.x, kneeL.y, ankleL.x, ankleL.y, 8, 6, pantsDark);
    this.drawShoe(ankleL.x, ankleL.y, lFootA, profile ? true : false);

    // 3. Pierna derecha y zapato
    this.drawLimb(hipR.x, hipR.y, kneeR.x, kneeR.y, 10, 8, pants);
    this.drawLimb(kneeR.x, kneeR.y, ankleR.x, ankleR.y, 8, 6, pants);
    this.drawShoe(ankleR.x, ankleR.y, rFootA, true);

    // 4. Torso (polo SST con cuello y franja)
    ctx.save();
    ctx.translate(cx, hipY);
    ctx.rotate(torsoLean);
    ctx.fillStyle = polo;
    ctx.beginPath();
    ctx.roundRect(profile ? -14 : -22, -62, profile ? 28 : 44, 66, 12);
    ctx.fill();
    // Franja reflectiva naranja SST
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(profile ? -14 : -22, -38, profile ? 28 : 44, 6);
    // Cinturón
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(profile ? -14 : -21, -4, profile ? 28 : 42, 7);
    ctx.restore();

    // 5. Cabeza
    const headPos = this.pt(cx, hipY, -82, -torsoLean);
    this.drawHead(headPos.x, headPos.y, torsoLean + headTilt, profile);

    // 6. Brazos frontales
    if (!profile) {
      this.drawLimb(shL.x, shL.y, elbowL.x, elbowL.y, 7.5, 6, polo);
      this.drawLimb(elbowL.x, elbowL.y, handL.x, handL.y, 6, 4.5, skin);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(handL.x, handL.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    this.drawLimb(shR.x, shR.y, elbowR.x, elbowR.y, 7.5, 6, polo);
    this.drawLimb(elbowR.x, elbowR.y, handR.x, handR.y, 6, 4.5, skin);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(handR.x, handR.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Brillo pulsante en la zona trabajada
    glowPoints.forEach(gp => this.drawGlow(gp.x, gp.y, 18));
  }

  loop() {
    if (!this.paused) {
      this.t += 0.025;
    }
    this.drawScene();
    this.raf = requestAnimationFrame(this.loop);
  }
}

let activeCanvasAnimator = null;

function mountExerciseAnimator(container, exerciseKey) {
  if (activeCanvasAnimator) {
    activeCanvasAnimator.setExercise(exerciseKey);
    activeCanvasAnimator.setPaused(false);
    return activeCanvasAnimator;
  }
  container.innerHTML = `<canvas width="260" height="260" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas>`;
  const canvas = container.querySelector("canvas");
  activeCanvasAnimator = new HumanExerciseCanvas(canvas, exerciseKey);
  return activeCanvasAnimator;
}

function getExerciseIllustration(key) {
  return `<canvas class="mini-ex-canvas" data-ex-key="${key}" width="96" height="96" style="width:48px;height:48px;border-radius:8px;display:block;"></canvas>`;
}

function initMiniCanvases() {
  document.querySelectorAll(".mini-ex-canvas").forEach(canvas => {
    const key = canvas.dataset.exKey;
    const anim = new HumanExerciseCanvas(canvas, key);
    // Dibujar un frame representativo estático en miniaturas para ahorrar CPU
    anim.t = 0.7;
    anim.drawScene();
    anim.destroy();
  });
}
