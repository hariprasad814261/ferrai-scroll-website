/**
 * FERRARI F40 — THE SOVEREIGN UNVEILING
 * Inspired by Valmora Atelier Aesthetics & Redesigned for Maximum Cinematic Prestige
 * Officina Maranello 2026
 */

document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Constants
  const FRAME_COUNT = 240;
  const IMAGE_SCALE = 0.88;
  const CANVAS = document.getElementById("canvas");
  const CANVAS_WRAP = document.getElementById("canvas-wrap");
  const SCROLL_CONTAINER = document.getElementById("scroll-container");
  const DARK_OVERLAY = document.getElementById("dark-overlay");
  const CTX = CANVAS.getContext("2d", { alpha: false });

  // Elements
  const heroLayer = document.getElementById("hero");
  const dragRevealWrap = document.getElementById("drag-reveal-wrap");
  const revealKnob = document.getElementById("reveal-knob");
  const arcActivePath = document.getElementById("arc-active-path");
  const toastMessage = document.getElementById("toast-message");
  const shareBtn = document.getElementById("share-btn");

  // State
  const frames = [];
  let currentFrame = 0;
  let isCanvasReady = false;
  let sampledBgColor = "#050507";
  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentPct = 0;

  // =========================================================================
  // 1. LENIS SMOOTH SCROLL (MANDATORY)
  // =========================================================================
  const lenis = new Lenis({
    duration: 1.25,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    orientation: "vertical",
    gestureOrientation: "vertical"
  });

  lenis.on("scroll", () => {
    ScrollTrigger.update();
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // =========================================================================
  // 2. RETINA CANVAS RESIZING
  // =========================================================================
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    CANVAS.width = width * dpr;
    CANVAS.height = height * dpr;
    CANVAS.style.width = `${width}px`;
    CANVAS.style.height = `${height}px`;

    CTX.scale(dpr, dpr);

    if (frames[currentFrame]) {
      drawFrame(currentFrame);
    }
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    ScrollTrigger.refresh();
  });

  // =========================================================================
  // 3. FRAME PRELOADER (Two-Phase Progressive Loading)
  // =========================================================================
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const loaderStatus = document.getElementById("loader-status");
  const loaderContainer = document.getElementById("loader");

  function getFramePath(index) {
    const padded = String(index + 1).padStart(4, "0");
    return `frames/frame_${padded}.webp`;
  }

  function preloadFrames() {
    return new Promise((resolve) => {
      let loadedCount = 0;
      const initialBatch = 16;

      const loadSingle = (index) => {
        return new Promise((fResolve) => {
          const img = new Image();
          img.src = getFramePath(index);
          img.onload = () => {
            frames[index] = img;
            loadedCount++;

            const pct = Math.floor((loadedCount / FRAME_COUNT) * 100);
            if (loaderBar) loaderBar.style.width = `${pct}%`;
            if (loaderPercent) loaderPercent.textContent = `${pct}%`;

            if (loaderStatus) {
              if (pct < 30) loaderStatus.textContent = "WARMING TIPO F120 TURBOS...";
              else if (pct < 70) loaderStatus.textContent = "CALIBRATING VEGLIA TELEMETRY...";
              else loaderStatus.textContent = "ENGAGING MARANELLO PROTOCOL...";
            }

            fResolve();
          };
          img.onerror = () => {
            loadedCount++;
            fResolve();
          };
        });
      };

      // Phase 1: load first batch for immediate visual display
      const initialPromises = [];
      for (let i = 0; i < initialBatch; i++) {
        initialPromises.push(loadSingle(i));
      }

      Promise.all(initialPromises).then(() => {
        resizeCanvas();
        drawFrame(0);
        isCanvasReady = true;

        // Phase 2: background load remaining frames
        const remainingPromises = [];
        for (let i = initialBatch; i < FRAME_COUNT; i++) {
          remainingPromises.push(loadSingle(i));
        }

        Promise.all(remainingPromises).then(() => {
          setTimeout(() => {
            loaderContainer.classList.add("loaded");
            document.body.classList.remove("loading");
            initHeroAnimations();
            resolve();
          }, 300);
        });
      });
    });
  }

  // Edge background sampler
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 1;
  sampleCanvas.height = 1;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

  function sampleFrameBgColor(img) {
    if (!img) return;
    try {
      sampleCtx.drawImage(img, 2, 2, 1, 1, 0, 0, 1, 1);
      const data = sampleCtx.getImageData(0, 0, 1, 1).data;
      sampledBgColor = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
    } catch (e) {
      sampledBgColor = "#050507";
    }
  }

  // =========================================================================
  // 4. CANVAS RENDERER — Padded Cover Mode
  // =========================================================================
  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;

    if (index % 12 === 0) {
      sampleFrameBgColor(img);
    }

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth || 1920;
    const ih = img.naturalHeight || 1080;

    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    CTX.fillStyle = sampledBgColor;
    CTX.fillRect(0, 0, cw, ch);
    CTX.drawImage(img, dx, dy, dw, dh);
  }

  // =========================================================================
  // 5. THE VALMORA "DRAG TO REVEAL" ARC & INTERACTIVE SCRUBBER
  // =========================================================================
  function updateArcScrubber(progress) {
    // progress: 0 to 1
    const arcLength = 380;
    if (arcActivePath) {
      const offset = arcLength - progress * arcLength;
      arcActivePath.style.strokeDashoffset = offset;
    }

    // Move knob along elliptical arc
    if (revealKnob) {
      // Arc coordinates from M 40 200 A 220 220 0 0 1 360 200
      // Parameterized angle from PI (left) to 0 (right)
      const angle = Math.PI * (1 - progress);
      const rx = 160;
      const ry = 140;
      const cx = 200;
      const cy = 200;

      const kx = cx + rx * Math.cos(angle);
      const ky = cy - ry * Math.sin(angle);

      revealKnob.style.left = `${kx}px`;
      revealKnob.style.top = `${ky}px`;
    }
  }

  // Drag interaction on Knob
  if (revealKnob) {
    const onDragStart = (e) => {
      isDragging = true;
      dragStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      if (cursorRing) cursorRing.classList.add("drag");
      window.engineAudio && window.engineAudio.triggerRev(2500);
    };

    const onDragMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const rect = dragRevealWrap.getBoundingClientRect();
      const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

      dragCurrentPct = pct;
      updateArcScrubber(pct);

      // Scrub frames during hero reveal range (first 60 frames = 25% of 240)
      const targetFrame = Math.floor(pct * 65);
      if (targetFrame !== currentFrame) {
        currentFrame = targetFrame;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }

      // Smooth scroll page proportionally if dragged past threshold
      if (pct > 0.6) {
        const scrollTarget = window.innerHeight * 1.5;
        lenis.scrollTo(scrollTarget, { duration: 1.2 });
      }
    };

    const onDragEnd = () => {
      if (isDragging) {
        isDragging = false;
        if (cursorRing) cursorRing.classList.remove("drag");
      }
    };

    revealKnob.addEventListener("mousedown", onDragStart);
    revealKnob.addEventListener("touchstart", onDragStart, { passive: true });
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("touchmove", onDragMove, { passive: true });
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchend", onDragEnd);
  }

  // =========================================================================
  // 6. MAIN SCROLL-DRIVEN TIMELINE & SECTION CHOREOGRAPHY
  // =========================================================================
  const sectionReveal = document.getElementById("section-reveal");
  const sectionDesign = document.getElementById("section-design");
  const sectionSpecification = document.getElementById("section-specification");
  const sectionEditorial = document.getElementById("section-editorial");
  const sectionViewing = document.getElementById("section-viewing");

  function initScrollTriggers() {
    ScrollTrigger.create({
      trigger: SCROLL_CONTAINER,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.0,
      onUpdate: (self) => {
        const p = self.progress;

        // 1. Frame Playback Acceleration (unveiling completes by ~60% scroll)
        const FRAME_SPEED = 1.95;
        const accelerated = Math.min(p * FRAME_SPEED, 1);
        const frameIdx = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);

        if (frameIdx !== currentFrame && frames[frameIdx]) {
          currentFrame = frameIdx;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }


        // 3. Hero Layer & Arc Knob Synchronization (0% to 14%)
        if (p < 0.14) {
          const heroOpacity = Math.max(0, 1 - p / 0.12);
          heroLayer.style.opacity = heroOpacity;
          heroLayer.style.pointerEvents = heroOpacity > 0.2 ? "auto" : "none";
          updateArcScrubber(Math.min(p / 0.12, 1));
        } else {
          heroLayer.style.opacity = 0;
          heroLayer.style.pointerEvents = "none";
        }

        // 4. Section 1: Reveal Watermark (14% - 28%)
        if (p >= 0.14 && p <= 0.28) {
          sectionReveal.classList.add("active");
          const revealProg = (p - 0.14) / 0.14;
          sectionReveal.style.opacity = revealProg < 0.2 ? revealProg * 5 : (revealProg > 0.8 ? (1 - revealProg) * 5 : 1);
        } else {
          sectionReveal.classList.remove("active");
        }

        // 5. Section 2: Interactive Design Hotspots (29% - 52%)
        if (p >= 0.29 && p <= 0.52) {
          sectionDesign.classList.add("active");
          const designProg = (p - 0.29) / 0.23;
          sectionDesign.style.opacity = designProg < 0.15 ? designProg * 6.6 : (designProg > 0.85 ? (1 - designProg) * 6.6 : 1);

          // Sub-step through the 4 hotspots automatically based on scroll
          const hotspotIdx = Math.min(Math.floor(designProg * 4) + 1, 4);
          setActiveHotspot(hotspotIdx);
        } else {
          sectionDesign.classList.remove("active");
        }

        // 6. Section 3: Interactive Tachometer & Specifications (53% - 73%)
        if (p >= 0.53 && p <= 0.73) {
          sectionSpecification.classList.add("active");
          DARK_OVERLAY.style.opacity = 0.88;
          const specProg = (p - 0.53) / 0.20;
          sectionSpecification.style.opacity = specProg < 0.15 ? specProg * 6.6 : (specProg > 0.85 ? (1 - specProg) * 6.6 : 1);

          // Scroll through specs
          const specRows = document.querySelectorAll(".spec-row");
          const activeRowIdx = Math.min(Math.floor(specProg * specRows.length), specRows.length - 1);
          if (specRows[activeRowIdx] && !specRows[activeRowIdx].classList.contains("active")) {
            activateSpecRow(specRows[activeRowIdx]);
          }
        } else {
          sectionSpecification.classList.remove("active");
          if (p < 0.53 || p > 0.84) {
            DARK_OVERLAY.style.opacity = 0;
          }
        }

        // 7. Section 4: Editorial Transition Card (74% - 84%)
        if (p >= 0.74 && p <= 0.84) {
          sectionEditorial.classList.add("active");
          const editProg = (p - 0.74) / 0.10;
          sectionEditorial.style.opacity = editProg < 0.2 ? editProg * 5 : (editProg > 0.8 ? (1 - editProg) * 5 : 1);
        } else {
          sectionEditorial.classList.remove("active");
        }

        // 8. Section 5: Private Viewing (Warm Ivory Atelier Transition) (85% - 100%)
        if (p >= 0.85) {
          sectionViewing.classList.add("active");
          const viewProg = Math.min((p - 0.85) / 0.08, 1);
          sectionViewing.style.opacity = viewProg;
          sectionViewing.style.transform = `translateY(${(1 - viewProg) * 40}px)`;

          // Adjust header styling to dark contrast for ivory background
          const header = document.querySelector(".site-header");
          if (header && p >= 0.88) {
            header.style.background = "rgba(246, 243, 237, 0.9)";
            header.style.borderBottomColor = "rgba(18, 17, 16, 0.1)";
            document.querySelectorAll(".nav-link").forEach(l => l.style.color = "var(--text-ivory-primary)");
            const brand = document.querySelector(".brand-name");
            if (brand) brand.style.color = "var(--text-ivory-primary)";
          }
        } else {
          sectionViewing.classList.remove("active");
          const header = document.querySelector(".site-header");
          if (header) {
            header.style.background = "";
            header.style.borderBottomColor = "";
            document.querySelectorAll(".nav-link").forEach(l => l.style.color = "");
            const brand = document.querySelector(".brand-name");
            if (brand) brand.style.color = "";
          }
        }
      }
    });
  }

  // =========================================================================
  // 7. INTERACTIVE DESIGN HOTSPOTS TABS & SWITCHING
  // =========================================================================
  let currentHotspot = 1;
  const hotspotItems = document.querySelectorAll(".hotspot-item");
  const tabItems = document.querySelectorAll(".tab-item");
  const tabIndicator = document.getElementById("tab-indicator-line");

  function setActiveHotspot(index) {
    if (currentHotspot === index) return;
    currentHotspot = index;

    hotspotItems.forEach((item) => {
      const itemIdx = parseInt(item.dataset.index, 10);
      if (itemIdx === index) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    tabItems.forEach((tab) => {
      const tabIdx = parseInt(tab.dataset.tab, 10);
      if (tabIdx === index) {
        tab.classList.add("active");
        if (tabIndicator) {
          const tabOffsetLeft = tab.offsetLeft;
          tabIndicator.style.transform = `translateX(${tabOffsetLeft}px)`;
        }
      } else {
        tab.classList.remove("active");
      }
    });
  }

  tabItems.forEach((tab) => {
    tab.addEventListener("click", () => {
      const idx = parseInt(tab.dataset.tab, 10);
      setActiveHotspot(idx);
      // Nudge scroll to that hotspot range
      const scrollStart = SCROLL_CONTAINER.offsetHeight * (0.29 + (idx - 1) * 0.055);
      lenis.scrollTo(scrollStart, { duration: 0.8 });
    });
  });

  // Reticle click handlers
  document.querySelectorAll(".hotspot-reticle").forEach((reticle) => {
    reticle.addEventListener("click", (e) => {
      const parent = e.currentTarget.closest(".hotspot-item");
      if (parent) {
        const idx = parseInt(parent.dataset.index, 10);
        setActiveHotspot(idx);
      }
    });
  });

  // =========================================================================
  // 8. VEGLIA BORLETTI TACHOMETER & SPECIFICATIONS ENGINE
  // =========================================================================
  const dialNeedle = document.getElementById("dial-needle");
  const dialMetricVal = document.getElementById("dial-metric-val");
  const dialMetricUnit = document.getElementById("dial-metric-unit");
  const dialMetricSub = document.getElementById("dial-metric-sub");
  const liveRpmVal = document.getElementById("live-rpm-val");

  const shiftLeds = [
    document.getElementById("led-1"),
    document.getElementById("led-2"),
    document.getElementById("led-3"),
    document.getElementById("led-4"),
    document.getElementById("led-5")
  ];

  function activateSpecRow(row) {
    document.querySelectorAll(".spec-row").forEach(r => r.classList.remove("active"));
    row.classList.add("active");

    const rpm = parseInt(row.dataset.rpm || "7000", 10);
    const val = row.dataset.val || "478";
    const unit = row.dataset.unit || "HP";
    const sub = row.dataset.sub || "";

    // 1. Calculate Tachometer Needle Angle (-125deg at 0 RPM to +125deg at 9,000 RPM)
    const normalizedRpm = Math.min(Math.max(rpm / 9000, 0), 1);
    const angle = -125 + normalizedRpm * 250;

    if (dialNeedle) {
      dialNeedle.style.transform = `rotate(${angle}deg)`;
    }

    // 2. Light up progressive Shift LEDs
    const activeLedsCount = Math.floor(normalizedRpm * shiftLeds.length);
    shiftLeds.forEach((led, i) => {
      if (led) {
        if (i <= activeLedsCount) led.classList.add("on");
        else led.classList.remove("on");
      }
    });

    // 3. Counter & Readouts update
    if (dialMetricVal) dialMetricVal.textContent = val;
    if (dialMetricUnit) dialMetricUnit.textContent = unit;
    if (dialMetricSub) dialMetricSub.textContent = sub;
    if (liveRpmVal) liveRpmVal.textContent = `${rpm.toLocaleString()} RPM`;

    // 4. Trigger audio rev if enabled
    if (window.engineAudio) {
      window.engineAudio.triggerRev(rpm);
    }
  }

  document.querySelectorAll(".spec-row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      activateSpecRow(row);
    });
  });

  // =========================================================================
  // 9. WEB AUDIO PROCEDURAL TWIN-TURBO V8 SYNTHESIZER
  // =========================================================================
  class FerrariV8Audio {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.masterGain = null;
      this.osc1 = null;
      this.osc2 = null;
      this.filter = null;
      this.turboNoise = null;
      this.turboFilter = null;
      this.turboGain = null;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Flat-plane 90-degree V8 tone (low fundamental + second order harmonic)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(130, this.ctx.currentTime);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      this.filter.connect(this.masterGain);

      // Turbo Spool Hiss (White noise buffer with bandpass filter)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.turboNoise = this.ctx.createBufferSource();
      this.turboNoise.buffer = noiseBuffer;
      this.turboNoise.loop = true;

      this.turboFilter = this.ctx.createBiquadFilter();
      this.turboFilter.type = "bandpass";
      this.turboFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
      this.turboFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

      this.turboNoise.connect(this.turboFilter);
      this.turboFilter.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.turboNoise.start();
    }

    toggle() {
      if (!this.ctx) this.init();

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      this.isPlaying = !this.isPlaying;
      const now = this.ctx.currentTime;

      if (this.isPlaying) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.18, now + 0.3);
      } else {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      }
      return this.isPlaying;
    }

    triggerRev(rpm) {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const baseFreq = 50 + (rpm / 9000) * 160;

      this.osc1.frequency.cancelScheduledValues(now);
      this.osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.15);
      this.osc1.frequency.exponentialRampToValueAtTime(65, now + 1.2);

      this.osc2.frequency.cancelScheduledValues(now);
      this.osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.15);
      this.osc2.frequency.exponentialRampToValueAtTime(130, now + 1.2);

      // Turbo spool surge
      this.turboGain.gain.cancelScheduledValues(now);
      this.turboGain.gain.linearRampToValueAtTime(0.08, now + 0.2);
      this.turboGain.gain.linearRampToValueAtTime(0.01, now + 1.2);
    }
  }

  const engineAudio = new FerrariV8Audio();
  window.engineAudio = engineAudio;

  const audioBtn = document.getElementById("audio-toggle");
  if (audioBtn) {
    audioBtn.addEventListener("click", () => {
      const active = engineAudio.toggle();
      audioBtn.classList.toggle("active", active);
      const label = audioBtn.querySelector(".audio-label");
      if (label) label.textContent = active ? "SOUND: ON" : "SOUND: OFF";
    });
  }

  // =========================================================================
  // 10. ATELIER DRAWER MENU & MODALS
  // =========================================================================
  const menuToggle = document.getElementById("menu-toggle");
  const atelierDrawer = document.getElementById("atelier-drawer");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const drawerClose = document.getElementById("drawer-close");

  function openDrawer() {
    if (atelierDrawer) {
      atelierDrawer.classList.add("open");
      atelierDrawer.setAttribute("aria-hidden", "false");
    }
  }

  function closeDrawer() {
    if (atelierDrawer) {
      atelierDrawer.classList.remove("open");
      atelierDrawer.setAttribute("aria-hidden", "true");
    }
  }

  if (menuToggle) menuToggle.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // Navigation Anchors (Lenis Smooth Scroll)
  document.querySelectorAll("[data-target]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeDrawer();
      const targetId = link.getAttribute("data-target");
      let scrollY = 0;

      if (targetId === "hero") scrollY = 0;
      else if (targetId === "section-design") scrollY = SCROLL_CONTAINER.offsetHeight * 0.32;
      else if (targetId === "section-specification") scrollY = SCROLL_CONTAINER.offsetHeight * 0.56;
      else if (targetId === "section-editorial") scrollY = SCROLL_CONTAINER.offsetHeight * 0.76;
      else if (targetId === "section-viewing") scrollY = SCROLL_CONTAINER.offsetHeight * 0.92;

      lenis.scrollTo(scrollY, { duration: 1.5 });
    });
  });

  // Back to top button in footer
  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    backToTop.addEventListener("click", (e) => {
      e.preventDefault();
      lenis.scrollTo(0, { duration: 1.8 });
    });
  }

  // Share Button
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
      if (toastMessage) {
        toastMessage.classList.add("show");
        setTimeout(() => toastMessage.classList.remove("show"), 2800);
      }
    });
  }

  // =========================================================================
  // 11. PRIVATE VIEWING FORM & INTEREST PILLS
  // =========================================================================
  const interestPills = document.querySelectorAll(".pill-btn");
  interestPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      interestPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
    });
  });

  window.submitViewingForm = function() {
    const name = document.getElementById("client-name").value;
    const email = document.getElementById("client-email").value;
    const activePill = document.querySelector(".pill-btn.active");
    const interest = activePill ? activePill.textContent : "F40 Berlinetta";
    const feedback = document.getElementById("form-feedback");

    if (feedback) {
      feedback.style.color = "#008844";
      feedback.textContent = `Grazie, ${name}. Your confidential inquiry for the ${interest} has been delivered to Maranello.`;
      const submitBtn = document.getElementById("btn-submit-invitation");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.6";
      }
    }
  };

  // =========================================================================
  // 12. CUSTOM LUXURY CURSOR
  // =========================================================================
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  const cursorText = document.getElementById("cursor-text");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
  });

  function renderCursor() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;

    if (cursorRing) {
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
    }
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Hover states on interactive targets
  const interactiveElements = document.querySelectorAll("a, button, input, select, .spec-row, .tab-item, .pill-btn, .hotspot-reticle");
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      if (cursorRing) cursorRing.classList.add("hover");
    });
    el.addEventListener("mouseleave", () => {
      if (cursorRing) cursorRing.classList.remove("hover");
    });
  });

  if (revealKnob) {
    revealKnob.addEventListener("mouseenter", () => {
      if (cursorRing) {
        cursorRing.classList.add("drag");
        if (cursorText) cursorText.textContent = "DRAG";
      }
    });
    revealKnob.addEventListener("mouseleave", () => {
      if (cursorRing && !isDragging) {
        cursorRing.classList.remove("drag");
        if (cursorText) cursorText.textContent = "";
      }
    });
  }

  // =========================================================================
  // 13. HERO ENTRANCE CHOREOGRAPHY
  // =========================================================================
  function initHeroAnimations() {
    gsap.from(".hero-headline-block", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out"
    });

    gsap.from(".drag-reveal-wrap", {
      scale: 0.9,
      opacity: 0,
      duration: 1.4,
      delay: 0.3,
      ease: "power2.out"
    });

    gsap.from(".hero-bottom-narrative", {
      y: 30,
      opacity: 0,
      duration: 1.2,
      delay: 0.5,
      ease: "power3.out"
    });

    // Default activate first hotspot and first spec row
    setActiveHotspot(1);
    const firstSpec = document.querySelector(".spec-row");
    if (firstSpec) activateSpecRow(firstSpec);

    // Initialize ScrollTrigger system
    initScrollTriggers();
  }

  // Start preloading frames immediately
  preloadFrames();
});
