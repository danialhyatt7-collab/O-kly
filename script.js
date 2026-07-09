/* Oakly® — Modern Furnica · Hero micro-interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Split the wordmark into characters ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    Array.prototype.forEach.call(text, function (ch, i) {
      var span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--ci", i);
      span.textContent = ch;
      el.appendChild(span);
    });
  });

  /* ---------- Entrance: flip the loaded switch ---------- */
  function reveal() {
    requestAnimationFrame(function () {
      document.body.classList.add("is-loaded");
    });
  }

  var bg = document.querySelector(".hero__bg img");
  if (bg && !bg.complete) {
    bg.addEventListener("load", reveal, { once: true });
    setTimeout(reveal, 2500); /* don't hold the curtain hostage */
  } else {
    reveal();
  }

  if (reduceMotion) return;

  /* ---------- Mouse parallax on layered elements ---------- */
  var layers = document.querySelectorAll("[data-depth]");
  var targetX = 0, targetY = 0, curX = 0, curY = 0, rafId = null;

  function tick() {
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;
    layers.forEach(function (layer) {
      var depth = parseFloat(layer.dataset.depth) || 0;
      var base = layer.dataset.baseTransform || "";
      layer.style.transform =
        base + " translate3d(" + (-curX * depth * 100) + "px, " + (-curY * depth * 100) + "px, 0)";
    });
    if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  if (finePointer && layers.length) {
    window.addEventListener("mousemove", function (e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------- Magnetic hover ---------- */
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 0.3;

      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        el.style.transition = "transform 0.15s ease-out";
        el.style.transform = "translate(" + dx * strength + "px, " + dy * strength + "px)";
      });

      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    var cursor = document.querySelector(".cursor");
    var dot = cursor && cursor.querySelector(".cursor__dot");
    var ring = cursor && cursor.querySelector(".cursor__ring");

    if (dot && ring) {
      var mx = -100, my = -100, rx = -100, ry = -100, cursorRaf = null;

      function cursorTick() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        dot.style.transform = "translate(" + (mx - 3) + "px, " + (my - 3) + "px)";
        ring.style.transform = "translate(" + (rx - 17) + "px, " + (ry - 17) + "px)";
        cursorRaf = requestAnimationFrame(cursorTick);
      }

      window.addEventListener("mousemove", function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (cursorRaf === null) cursorRaf = requestAnimationFrame(cursorTick);
      }, { passive: true });

      document.querySelectorAll("a, button, [data-hover]").forEach(function (el) {
        el.addEventListener("mouseenter", function () { cursor.classList.add("is-hover"); });
        el.addEventListener("mouseleave", function () { cursor.classList.remove("is-hover"); });
      });
    }
  }
})();
