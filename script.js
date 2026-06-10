/* ============================================================
   10 AÑOS CONTIGO · Para Adriana
   Lógica: partículas, máquina de escribir, scroll-reveal,
   nivel de amor, logros, sonido y fotos arrastrables.
   ============================================================ */

(() => {
  "use strict";

  const ANNIVERSARY = new Date(2016, 5, 10); // 10 de junio de 2016 (mes 0-indexado)
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ========================================================
     1 · SONIDO (Web Audio, sin archivos externos)
     ======================================================== */
  const Sound = (() => {
    let ctx = null;
    let muted = localStorage.getItem("ani_muted") === "1";

    const ensure = () => {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { ctx = null; }
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
      return ctx;
    };

    const tone = (freq, dur, type = "sine", vol = 0.12, delay = 0) => {
      if (muted) return;
      const ac = ensure(); if (!ac) return;
      const t = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t); osc.stop(t + dur + 0.02);
    };

    return {
      click(){ tone(523.25, 0.12, "triangle", 0.10); },
      soft(){  tone(392.0, 0.14, "sine", 0.07); },
      achievement(){
        // arpegio tierno
        tone(523.25, 0.18, "sine", 0.10, 0);
        tone(659.25, 0.18, "sine", 0.10, 0.10);
        tone(783.99, 0.30, "sine", 0.11, 0.20);
        tone(1046.5, 0.40, "triangle", 0.08, 0.30);
      },
      heart(){ tone(587.33, 0.16, "sine", 0.06); },
      get muted(){ return muted; },
      toggle(){
        muted = !muted;
        localStorage.setItem("ani_muted", muted ? "1" : "0");
        if (!muted) ensure();
        return muted;
      },
      resume(){ ensure(); }
    };
  })();

  /* ========================================================
     2 · LIENZO DE PARTÍCULAS (estrellas, pétalos, corazones)
     ======================================================== */
  const FX = (() => {
    const canvas = $("#fx-canvas");
    const ctx = canvas.getContext("2d");
    let W, H, DPR, parts = [], raf = null, last = 0;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width  = innerWidth  * DPR;
      H = canvas.height = innerHeight * DPR;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
    };

    const rnd = (a, b) => a + Math.random() * (b - a);

    const makeStar  = () => ({ kind:"star",  x:rnd(0,W), y:rnd(0,H), r:rnd(0.6,1.8)*DPR, tw:rnd(0,Math.PI*2), sp:rnd(1,2.5) });
    const makePetal = () => ({ kind:"petal", x:rnd(0,W), y:rnd(-H,0), r:rnd(5,11)*DPR, vy:rnd(14,34)*DPR, vx:rnd(-12,12)*DPR, a:rnd(0,Math.PI*2), va:rnd(-1,1), hue:rnd(330,350) });
    const makeHeart = () => ({ kind:"heart", x:rnd(0,W), y:H+rnd(0,H*0.4), r:rnd(7,15)*DPR, vy:rnd(22,46)*DPR, drift:rnd(0.4,1.4), ph:rnd(0,Math.PI*2), op:rnd(0.25,0.6) });

    const seed = () => {
      parts = [];
      const area = (innerWidth * innerHeight) / 22000;
      const stars  = Math.min(140, Math.round(area * 2.2));
      const petals = Math.min(26, Math.round(area * 0.4));
      const hearts = Math.min(16, Math.round(area * 0.22));
      for (let i = 0; i < stars;  i++) parts.push(makeStar());
      for (let i = 0; i < petals; i++) parts.push(makePetal());
      for (let i = 0; i < hearts; i++) parts.push(makeHeart());
    };

    const heartPath = (x, y, r) => {
      ctx.beginPath();
      ctx.moveTo(x, y + r * 0.3);
      ctx.bezierCurveTo(x, y, x - r, y - r * 0.1, x - r, y + r * 0.35);
      ctx.bezierCurveTo(x - r, y + r * 0.8, x, y + r * 1.05, x, y + r * 1.35);
      ctx.bezierCurveTo(x, y + r * 1.05, x + r, y + r * 0.8, x + r, y + r * 0.35);
      ctx.bezierCurveTo(x + r, y - r * 0.1, x, y, x, y + r * 0.3);
      ctx.closePath();
    };

    const draw = (ts) => {
      const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
      ctx.clearRect(0, 0, W, H);

      for (const p of parts) {
        if (p.kind === "star") {
          p.tw += dt * p.sp;
          const a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(p.tw));
          ctx.globalAlpha = a;
          ctx.fillStyle = "#fff4cf";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        else if (p.kind === "petal") {
          p.y += p.vy * dt; p.x += p.vx * dt; p.a += p.va * dt;
          if (p.y > H + 20) { p.y = -20; p.x = rnd(0, W); }
          ctx.globalAlpha = 0.55;
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.a);
          ctx.fillStyle = `hsl(${p.hue} 70% 80%)`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        else { // heart
          p.y -= p.vy * dt; p.ph += dt;
          p.x += Math.sin(p.ph) * p.drift * DPR;
          if (p.y < -30) { p.y = H + rnd(10, 80); p.x = rnd(0, W); }
          ctx.globalAlpha = p.op;
          ctx.fillStyle = "#f7b9cf";
          heartPath(p.x, p.y, p.r); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      resize(); seed();
      if (reduceMotion) {                 // dibuja un cuadro estático
        last = 0; draw(0); cancelAnimationFrame(raf); return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(start, 200); });
    return { start };
  })();

  /* ========================================================
     3 · MÁQUINA DE ESCRIBIR
     ======================================================== */
  const typeWriter = (el, text, { speed = 42, onDone } = {}) => {
    if (reduceMotion) { el.textContent = text; onDone && onDone(); return; }
    el.textContent = "";
    const caret = document.createElement("span");
    caret.className = "caret"; caret.textContent = "▍";
    el.appendChild(caret);
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        caret.insertAdjacentText("beforebegin", text[i]);
        if (text[i] !== " ") Sound.soft();
        i++;
        setTimeout(tick, speed + (Math.random() * 30 - 10));
      } else {
        setTimeout(() => caret.remove(), 1400);
        onDone && onDone();
      }
    };
    setTimeout(tick, 250);
  };

  // Carrusel de la pantalla inicial
  const startLines = [
    "Una historia que empezó el 10 de junio de 2016…",
    "Nuestra aventura favorita, en cinco capítulos.",
    "Presiona EMPEZAR y revívela conmigo ♥",
  ];
  const runStartTypewriter = () => {
    const el = $("#start-typewriter");
    let idx = 0;
    const cycle = () => {
      typeWriter(el, startLines[idx], {
        speed: 46,
        onDone: () => {
          idx = (idx + 1) % startLines.length;
          setTimeout(cycle, 1800);
        }
      });
    };
    cycle();
  };

  /* ========================================================
     4 · CONTADOR DE DÍAS JUNTOS
     ======================================================== */
  const daysTogether = () => {
    const ms = Date.now() - ANNIVERSARY.getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  };
  const fmt = (n) => n.toLocaleString("es-MX");
  const paintDays = () => {
    const d = daysTogether();
    const a = $("#days-count"), b = $("#days-count-final");
    if (a) a.textContent = fmt(d);
    if (b) b.textContent = fmt(d);
  };

  /* ========================================================
     5 · LOGROS + NOTIFICACIONES
     ======================================================== */
  const unlocked = new Set();
  const stack = $("#toast-stack");

  const showAchievement = (icon, name) => {
    if (unlocked.has(name)) return;
    unlocked.add(name);
    Sound.achievement();

    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML =
      `<div class="toast-ico">${icon}</div>
       <div class="toast-txt">
         <div class="toast-kicker">★ LOGRO DESBLOQUEADO</div>
         <div class="toast-name"></div>
       </div>`;
    t.querySelector(".toast-name").textContent = name;
    stack.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("show")));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 600);
    }, 4200);
  };

  /* ========================================================
     6 · NIVEL DE AMOR (progreso por scroll)
     ======================================================== */
  const loveFill = $("#love-fill");
  const lovePct  = $("#love-pct");
  let started = false;

  const updateLove = () => {
    if (!started) return;
    const exp = $("#experience");
    const total = exp.scrollHeight - innerHeight;
    const y = Math.min(Math.max(window.scrollY, 0), total);
    const pct = total > 0 ? Math.round((y / total) * 100) : 0;
    loveFill.style.width = pct + "%";
    lovePct.textContent = pct + "%";
    if (pct >= 100) showAchievement("∞", "Amor al 100% · 10 años contigo");
  };

  /* ========================================================
     7 · SCROLL REVEAL + DISPARADORES POR CAPÍTULO
     ======================================================== */
  const chapterAchievements = {
    cap1:    ["💑", "Primer encuentro · 10·06·2016"],
    cap2:    ["🎮", "Aventureros del día a día"],
    cap3:    ["🛡️", "Más fuertes que la distancia"],
    cap4:    ["🌙", "Nuestro propio mundo"],
    capfinal:["👑", "Diez años de amor"],
  };

  const setupReveal = () => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("visible");

        // Máquina de escribir al revelarse
        const tw = e.target.matches(".typewriter") ? e.target : e.target.querySelector(".typewriter");
        if (tw && !tw.dataset.typed) {
          tw.dataset.typed = "1";
          typeWriter(tw, tw.dataset.text || tw.textContent, { speed: 38 });
        }
        io.unobserve(e.target);
      }
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });

    $$(".reveal").forEach(el => io.observe(el));

    // Logros cuando un capítulo entra en vista
    const chapIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const a = chapterAchievements[e.target.id];
        if (a) showAchievement(a[0], a[1]);
      }
    }, { threshold: 0.35 });
    Object.keys(chapterAchievements).forEach(id => {
      const el = document.getElementById(id);
      if (el) chapIO.observe(el);
    });
  };

  /* ========================================================
     8 · FOTOS ARRASTRABLES (drag & drop + clic, persistentes)
     ======================================================== */
  const PhotoSlots = (() => {
    const KEY = (id) => "ani_photo_" + id;

    const downscale = (file) => new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      img.onload = () => {
        const max = 1280;
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const s = Math.min(max / w, max / h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });

    const render = (slot, dataUrl) => {
      slot.classList.add("filled");
      slot.innerHTML =
        `<img alt="Nuestro recuerdo" />
         <button class="remove" type="button" title="Quitar foto" aria-label="Quitar foto">✕</button>`;
      slot.querySelector("img").src = dataUrl;
    };

    const placeholder = (slot) => {
      slot.classList.remove("filled");
      const txt = slot.dataset.placeholder || "Arrastra una foto aquí 📷";
      slot.innerHTML = `<span class="ph-text">${txt}</span>`;
    };

    const save = (id, dataUrl) => {
      try { localStorage.setItem(KEY(id), dataUrl); }
      catch (e) { alert("La foto es muy grande para guardarse en este navegador, pero se mostrará por ahora."); }
    };

    const handleFile = async (slot, file) => {
      if (!file || !file.type.startsWith("image/")) return;
      try {
        const url = await downscale(file);
        render(slot, url);
        save(slot.dataset.slot, url);
        Sound.click();
        showAchievement("📸", "Fotógrafo del amor");
      } catch (e) { /* ignora archivos inválidos */ }
    };

    const init = () => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*"; input.style.display = "none";
      document.body.appendChild(input);
      let active = null;

      input.addEventListener("change", () => {
        if (active && input.files[0]) handleFile(active, input.files[0]);
        input.value = "";
      });

      $$(".photo-slot").forEach(slot => {
        const id = slot.dataset.slot;
        const saved = localStorage.getItem(KEY(id));
        if (saved) render(slot, saved); else placeholder(slot);

        slot.addEventListener("click", (ev) => {
          if (ev.target.closest(".remove")) {
            localStorage.removeItem(KEY(id));
            placeholder(slot); Sound.soft();
            return;
          }
          if (slot.classList.contains("filled")) return;
          active = slot; input.click();
        });

        ["dragenter", "dragover"].forEach(evt =>
          slot.addEventListener(evt, (e) => { e.preventDefault(); slot.classList.add("dragover"); }));
        ["dragleave", "drop"].forEach(evt =>
          slot.addEventListener(evt, (e) => { e.preventDefault(); slot.classList.remove("dragover"); }));
        slot.addEventListener("drop", (e) => {
          const f = e.dataTransfer.files && e.dataTransfer.files[0];
          if (f) handleFile(slot, f);
        });
      });
    };

    return { init };
  })();

  /* ========================================================
     9 · SOBRE / CARTA
     ======================================================== */
  const setupEnvelope = () => {
    const env = $("#envelope"), letter = $("#letter");
    if (!env) return;
    env.addEventListener("click", () => {
      env.classList.add("opened");
      letter.hidden = false;
      Sound.achievement();
      showAchievement("💌", "Carta abierta · te amo");
      setTimeout(() => { env.style.display = "none"; }, 520);
    });
  };

  /* ========================================================
     10 · ARRANQUE DE LA EXPERIENCIA
     ======================================================== */
  const beginExperience = () => {
    if (started) return;
    started = true;
    Sound.resume(); Sound.click();

    const start = $("#start-screen");
    const exp = $("#experience");
    const hud = $("#hud");

    start.classList.add("hidden");
    exp.setAttribute("aria-hidden", "false");
    exp.classList.add("show");
    hud.setAttribute("aria-hidden", "false");
    hud.classList.add("show");

    window.scrollTo({ top: 0, behavior: "auto" });
    setTimeout(() => showAchievement("✨", "El comienzo · nuestra historia"), 900);
    updateLove();
  };

  /* ========================================================
     11 · INICIALIZACIÓN
     ======================================================== */
  const init = () => {
    FX.start();
    paintDays();
    runStartTypewriter();
    setupReveal();
    PhotoSlots.init();
    setupEnvelope();

    $("#start-btn").addEventListener("click", beginExperience);

    const sBtn = $("#sound-toggle");
    sBtn.textContent = Sound.muted ? "🔈" : "🔊";
    sBtn.addEventListener("click", () => {
      const m = Sound.toggle();
      sBtn.textContent = m ? "🔈" : "🔊";
      if (!m) Sound.click();
    });

    $("#replay-btn").addEventListener("click", () => {
      Sound.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    let ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateLove(); ticking = false; });
    }, { passive: true });

    addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !started && document.activeElement === $("#start-btn")) beginExperience();
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
