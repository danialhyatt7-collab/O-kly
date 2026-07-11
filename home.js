/* Oakly® — homepage micro-interactions */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Stats particle field (Canvas2D, no dependency) ----------
     Warm drifting motes behind the craft stats, evoking sawdust catching
     light in a workshop, with gentle cursor parallax. Previously used a
     656KB Three.js/WebGL build for this — massive overkill for ~40 soft
     dots, and it shipped a deprecated build (console warning). A plain
     2D canvas gets an identical result with zero dependency and no
     network fetch, so it only needs a fine-pointer/motion/width gate,
     no lazy-load step. */
  (function () {
    var host = document.querySelector("[data-stats-particles]");
    if (!host) return;
    if (reduce || !fine) return;
    if (!window.matchMedia("(min-width: 760px)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    var canvas = host.querySelector(".stats__canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var COUNT = 40;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particles = [];

    function makeParticle() {
      return {
        x: Math.random(),
        y: Math.random(),
        r: 1 + Math.random() * 2.2,
        a: 0.25 + Math.random() * 0.5,
        speed: 0.008 + Math.random() * 0.014
      };
    }
    for (var i = 0; i < COUNT; i++) particles.push(makeParticle());

    function resize() {
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    var mouseX = 0, mouseY = 0, parX = 0, parY = 0;
    host.addEventListener("pointermove", function (e) {
      var rect = host.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    });

    var running = true;
    var raf = null;
    function tick() {
      if (!running || !w || !h) { raf = null; return; }
      raf = requestAnimationFrame(tick);

      parX += (mouseX * 14 - parX) * 0.04;
      parY += (mouseY * 10 - parY) * 0.04;

      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed * 0.016;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }

        var px = p.x * w + parX;
        var py = p.y * h + parY;
        var grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3);
        grad.addColorStop(0, "rgba(122,88,45," + p.a + ")");
        grad.addColorStop(1, "rgba(122,88,45,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    tick();

    /* Pause the loop when the section is off-screen. */
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        running = e.isIntersecting;
        if (running && !raf) tick();
      });
    }, { threshold: 0 });
    vio.observe(host);

    requestAnimationFrame(function () { canvas.classList.add("is-ready"); });
  })();

  /* ---------- Scroll progress bar ---------- */
  var progress = document.querySelector("[data-progress]");
  if (progress && !reduce) {
    var ticking = false;
    function syncProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(syncProgress); }
    }, { passive: true });
    syncProgress();
  }

  /* ---------- Word-by-word statement reveal ---------- */
  document.querySelectorAll("[data-words]").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var span = document.createElement("span");
      span.className = "w";
      span.style.setProperty("--wi", i);
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });

    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var duration = 1400;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 4); /* ease-out quart */
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (counters.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        el.textContent = parseFloat(el.dataset.count).toFixed(parseInt(el.dataset.decimals || "0", 10));
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  if (reduce || !fine) return;

  /* ---------- Gentle 3D tilt on collection cards ---------- */
  document.querySelectorAll("[data-tilt]").forEach(function (card) {
    var raf = null;
    var rx = 0, ry = 0;

    function apply() {
      card.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      raf = null;
    }

    card.addEventListener("pointermove", function (e) {
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      rx = py * -5;
      ry = px * 5;
      if (raf === null) raf = requestAnimationFrame(apply);
    });

    card.addEventListener("pointerleave", function () {
      rx = 0; ry = 0;
      if (raf === null) raf = requestAnimationFrame(apply);
      /* let the CSS transition ease it back, then clear the inline style */
      setTimeout(function () { card.style.transform = ""; }, 500);
    });
  });

  /* ---------- Lookbook: pinned horizontal scroll ----------
     Only upgrades to the pinned filmstrip on wide, fine-pointer,
     motion-allowed viewports — CSS default is already a working
     horizontally-scrollable filmstrip, so touch/mobile/narrow/reduced-
     motion visitors get that unchanged. */
  (function () {
    var pin = document.querySelector("[data-lookbook-pin]");
    var track = document.querySelector("[data-lookbook-track]");
    var hint = document.querySelector("[data-lookbook-hint]");
    if (!pin || !track) return;
    if (!window.matchMedia("(min-width: 900px)").matches) return;

    pin.classList.add("is-pinned");

    var travel = 0;
    function layout() {
      travel = Math.max(0, track.scrollWidth - window.innerWidth);
      pin.style.setProperty("--pin-h", (travel + window.innerHeight) + "px");
    }

    var ticking = false;
    function onScroll() {
      var total = pin.offsetHeight - window.innerHeight;
      var progress = total > 0 ? -pin.getBoundingClientRect().top / total : 0;
      progress = Math.min(1, Math.max(0, progress));
      track.style.transform = "translateX(-" + (progress * travel) + "px)";
      if (hint) {
        if (progress > 0.02) hint.classList.add("is-done");
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { layout(); onScroll(); }, 150);
    });

    layout();
    onScroll();

    if (hint && "IntersectionObserver" in window) {
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) hint.classList.add("is-shown");
        });
      }, { threshold: 0.4 });
      hio.observe(pin);
    }
  })();

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var rect = btn.getBoundingClientRect();
      var x = (e.clientX - rect.left - rect.width / 2) * 0.22;
      var y = (e.clientY - rect.top - rect.height / 2) * 0.3;
      btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    });
    btn.addEventListener("pointerleave", function () {
      btn.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
      btn.style.transform = "";
      setTimeout(function () { btn.style.transition = ""; }, 500);
    });
  });
})();
