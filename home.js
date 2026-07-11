/* Oakly® — homepage micro-interactions */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Stats particle field (Three.js, lazy-loaded) ----------
     Warm drifting motes behind the craft stats, evoking sawdust catching
     light in a workshop. Only loads the Three.js bundle (and only runs
     the WebGL scene at all) on wide, fine-pointer, motion-allowed
     viewports, once the section is about to scroll into view. */
  (function () {
    var host = document.querySelector("[data-stats-particles]");
    if (!host) return;
    if (reduce || !fine) return;
    if (!window.matchMedia("(min-width: 760px)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    var started = false;

    function loadThree(cb) {
      if (window.THREE) { cb(); return; }
      var s = document.createElement("script");
      s.src = "assets/vendor/three.min.js";
      s.onload = cb;
      s.onerror = function () {}; /* fail silent — canvas just stays empty */
      document.body.appendChild(s);
    }

    function init() {
      var canvas = host.querySelector(".stats__canvas");
      if (!canvas || !window.THREE) return;

      var THREE = window.THREE;
      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      } catch (e) { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 20;

      /* Soft round sprite, generated on a small canvas — no image asset. */
      var spriteCanvas = document.createElement("canvas");
      spriteCanvas.width = spriteCanvas.height = 64;
      var sctx = spriteCanvas.getContext("2d");
      var grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(122,88,45,0.95)");
      grad.addColorStop(0.5, "rgba(122,88,45,0.5)");
      grad.addColorStop(1, "rgba(122,88,45,0)");
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
      var spriteTex = new THREE.CanvasTexture(spriteCanvas);

      var COUNT = 46;
      var positions = new Float32Array(COUNT * 3);
      var speeds = new Float32Array(COUNT);
      for (var i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
        speeds[i] = 0.06 + Math.random() * 0.1;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      var mat = new THREE.PointsMaterial({
        size: 0.9,
        map: spriteTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });
      var points = new THREE.Points(geo, mat);
      scene.add(points);

      var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
      host.addEventListener("pointermove", function (e) {
        var rect = host.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / rect.width - 0.5;
        mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      });

      function resize() {
        var w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();
      window.addEventListener("resize", resize);

      var clock = new THREE.Clock();
      var raf;
      function tick() {
        raf = requestAnimationFrame(tick);
        var dt = clock.getDelta();
        var pos = geo.attributes.position;
        for (var i = 0; i < COUNT; i++) {
          var y = pos.getY(i) + speeds[i] * dt;
          if (y > 5) y = -5;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;

        targetRotX += (mouseY * 0.25 - targetRotX) * 0.04;
        targetRotY += (mouseX * 0.3 - targetRotY) * 0.04;
        points.rotation.x = targetRotX;
        points.rotation.y = targetRotY;

        renderer.render(scene, camera);
      }
      tick();

      /* Pause the render loop when the section is off-screen, resume
         when it's back — keeps this idle-cheap while scrolled past. */
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!raf) tick();
          } else if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      }, { threshold: 0 });
      vio.observe(host);

      requestAnimationFrame(function () { canvas.classList.add("is-ready"); });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !started) {
          started = true;
          io.disconnect();
          loadThree(init);
        }
      });
    }, { rootMargin: "400px 0px" });
    io.observe(host);
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
