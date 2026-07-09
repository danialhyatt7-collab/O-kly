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
})();
