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

  /* ---------- Sticky frosted header on scroll ---------- */
  (function () {
    var heroEl = document.querySelector(".hero");
    function threshold() {
      if (!heroEl) return 40;
      return heroEl.getBoundingClientRect().bottom + window.scrollY;
    }
    function syncScrolled() {
      document.body.classList.toggle("is-scrolled", window.scrollY >= threshold());
    }
    syncScrolled();
    window.addEventListener("scroll", syncScrolled, { passive: true });
    window.addEventListener("resize", syncScrolled);
  })();

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

  /* ---------- Hero testimonial carousel ---------- */
  var track = document.querySelector("[data-review-track]");
  if (track) {
    var prevBtn = document.querySelector("[data-review-prev]");
    var nextBtn = document.querySelector("[data-review-next]");
    var dotsWrap = document.querySelector("[data-review-dots]");
    var cards = Array.prototype.slice.call(track.children);
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    cards.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to review " + (i + 1));
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () {
        cards[i].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function step(dir) {
      var cardWidth = cards[0].getBoundingClientRect().width + 16;
      track.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

    function syncDots() {
      var trackRect = track.getBoundingClientRect();
      var closest = 0;
      var closestDist = Infinity;
      cards.forEach(function (card, i) {
        var dist = Math.abs(card.getBoundingClientRect().left - trackRect.left);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === closest); });
    }

    var scrollTimer;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(syncDots, 100);
    }, { passive: true });

    /* Auto-advance, pausing on hover/touch and respecting reduced motion */
    if (!reduceMotion) {
      var autoTimer = setInterval(function () {
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        if (atEnd) {
          track.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          step(1);
        }
      }, 4500);

      track.addEventListener("mouseenter", function () { clearInterval(autoTimer); });
      track.addEventListener("touchstart", function () { clearInterval(autoTimer); }, { passive: true });
    }
  }

  /* ---------- Hero email capture ---------- */
  var emailForm = document.querySelector("[data-email-form]");
  if (emailForm) {
    var emailInput = emailForm.querySelector("[data-email-input]");
    var emailNote = document.querySelector("[data-email-note]");
    var emailBtn = emailForm.querySelector("[data-email-submit]");

    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!emailInput.checkValidity() || emailForm.classList.contains("is-sent")) return;

      emailForm.classList.add("is-sent");
      emailInput.disabled = true;
      if (emailBtn) {
        emailBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4 10-10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      if (emailNote) emailNote.textContent = "You're on the list — check your inbox for the code.";
    });
  }
})();
