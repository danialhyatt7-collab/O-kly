/* Oakly® — homepage micro-interactions */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(pointer: fine)").matches;

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
