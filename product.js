/* Oakly® — The Oak Lounge · product page interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer  = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Plan selection ---------- */
  var plans = document.querySelectorAll(".plan");
  plans.forEach(function (plan) {
    plan.addEventListener("click", function () {
      plans.forEach(function (p) { p.classList.remove("plan--active"); });
      plan.classList.add("plan--active");
      var input = plan.querySelector("input");
      if (input) input.checked = true;
    });
  });

  if (reduceMotion) return;

  /* ---------- Card entrance ---------- */
  document.querySelectorAll(".card").forEach(function (c) { c.classList.add("is-in"); });

  /* ---------- Parallax tilt of the whole stage ---------- */
  if (finePointer) {
    var stage = document.querySelector(".stage");
    var cards = document.querySelectorAll(".card");
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      cards.forEach(function (card) {
        var depth = parseFloat(card.dataset.float) || 1;
        var base = card.classList.contains("card--dark")
          ? "rotate(1.8deg) translateX(-14px)"
          : "rotate(-1.4deg)";
        card.style.transform = base +
          " translate3d(" + (cx * depth * 10) + "px, " + (cy * depth * 8) + "px, 0)" +
          " rotateX(" + (-cy * 3) + "deg) rotateY(" + (cx * 4) + "deg)";
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
      else raf = null;
    }

    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf === null) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------- Magnetic hover ---------- */
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = "transform .15s ease-out";
        el.style.transform = "translate(" + dx * 0.25 + "px," + dy * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform .5s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    var cursor = document.querySelector(".cursor");
    var dot = cursor && cursor.querySelector(".cursor__dot");
    var ring = cursor && cursor.querySelector(".cursor__ring");
    if (dot && ring) {
      var mx = -100, my = -100, rx = -100, ry = -100, craf = null;
      function ctick() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        dot.style.transform = "translate(" + (mx - 3) + "px," + (my - 3) + "px)";
        ring.style.transform = "translate(" + (rx - 17) + "px," + (ry - 17) + "px)";
        craf = requestAnimationFrame(ctick);
      }
      window.addEventListener("mousemove", function (e) {
        mx = e.clientX; my = e.clientY;
        if (craf === null) craf = requestAnimationFrame(ctick);
      }, { passive: true });
      document.querySelectorAll("a, button, [data-hover]").forEach(function (el) {
        el.addEventListener("mouseenter", function () { cursor.classList.add("is-hover"); });
        el.addEventListener("mouseleave", function () { cursor.classList.remove("is-hover"); });
      });
    }
  }
})();
