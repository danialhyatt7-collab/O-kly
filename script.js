/* Oakly® — Modern Furnica · Hero */
(function () {
  "use strict";

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

  /* ---------- Mobile hamburger menu ---------- */
  var nav = document.querySelector(".nav");
  var burger = document.querySelector(".nav__burger");

  if (nav && burger) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll(".nav__menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-menu-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Open menu");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-menu-open")) {
        nav.classList.remove("is-menu-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Open menu");
      }
    });
  }
})();
