/* ═══════════════════════════════════════════════════════════
   OAKLY · Modern Furnica — interactions & micro-animations
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Split headlines into animatable lines ─────────────── */
  const splitIntoLines = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    const original = el.innerHTML;
    // Wrap each word to measure line breaks
    el.innerHTML = words.map(w => `<span class="w" style="display:inline-block">${w}</span>`).join(" ");
    const spans = [...el.querySelectorAll(".w")];
    const lines = [];
    let lastTop = null;
    spans.forEach(span => {
      const top = span.offsetTop;
      if (top !== lastTop) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(span.textContent);
    });
    // Preserve <em> emphasis if it existed (single-em case)
    const emMatch = original.match(/<em>(.*?)<\/em>/s);
    el.innerHTML = lines
      .map(line => `<span class="line"><span>${line.join(" ")}</span></span>`)
      .join("");
    if (emMatch) {
      const emText = emMatch[1].replace(/<[^>]+>/g, "").trim();
      el.innerHTML = el.innerHTML.replace(emText, `<em>${emText}</em>`);
    }
  };

  document.querySelectorAll(".split-lines").forEach(el => {
    if (!reduceMotion) splitIntoLines(el);
    else el.classList.add("is-inview");
  });
  // Re-split on significant resize (orientation change)
  let resizeTimer, lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (reduceMotion || Math.abs(window.innerWidth - lastW) < 80) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { lastW = window.innerWidth; }, 300);
  });

  /* ── Preloader ─────────────────────────────────────────── */
  const preloader = document.getElementById("preloader");
  const loaderBar = document.getElementById("loaderBar");
  const loaderCount = document.getElementById("loaderCount");

  const finishLoad = () => {
    if (!preloader || preloader.classList.contains("is-done")) return;
    preloader.classList.add("is-done");
    document.body.classList.add("preloader-done");
    document.querySelector(".hero__title")?.classList.add("is-inview");
    setTimeout(() => preloader.remove(), 1200);
  };

  if (reduceMotion) {
    finishLoad();
  } else {
    let progress = 0;
    const tick = setInterval(() => {
      progress = Math.min(progress + Math.random() * 18 + 6, 100);
      if (loaderBar) loaderBar.style.width = progress + "%";
      if (loaderCount) loaderCount.textContent = Math.round(progress);
      if (progress >= 100) {
        clearInterval(tick);
        setTimeout(finishLoad, 350);
      }
    }, 130);
    // Safety: never trap the user
    window.addEventListener("load", () => setTimeout(finishLoad, 2200));
    setTimeout(finishLoad, 4000);
  }

  /* ── Header: shrink + hide on scroll down ──────────────── */
  const header = document.getElementById("header");
  let lastY = 0;
  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > 260 && y > lastY && !menuOpen);
    lastY = y;
  };
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ── Fullscreen menu ───────────────────────────────────── */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.classList.toggle("is-locked", open);
    if (open) header.classList.remove("is-hidden");
  };
  burger.addEventListener("click", () => setMenu(!menuOpen));
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", e => { if (e.key === "Escape" && menuOpen) setMenu(false); });

  /* ── IntersectionObserver reveals ──────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-inview");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

  document.querySelectorAll(".reveal, .img-reveal, .split-lines:not(.hero__title)")
    .forEach(el => io.observe(el));

  /* Stagger siblings inside grids for a cascade feel */
  document.querySelectorAll(".collections__grid, .insta__grid, .signature__points, .stats").forEach(group => {
    [...group.children].forEach((child, i) => {
      child.style.transitionDelay = `${Math.min(i * 90, 450)}ms`;
    });
  });

  /* ── Animated counters ─────────────────────────────────── */
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.counter, 10);
    const suffix = el.dataset.suffix || "";
    const dur = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString() + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (reduceMotion) {
          entry.target.textContent =
            parseInt(entry.target.dataset.counter, 10).toLocaleString() + (entry.target.dataset.suffix || "");
        } else {
          animateCounter(entry.target);
        }
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-counter]").forEach(el => counterIO.observe(el));

  /* ── Hero parallax ─────────────────────────────────────── */
  const heroImg = document.getElementById("heroImg");
  if (heroImg && !reduceMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroImg.style.transform = `scale(1.02) translateY(${y * 0.16}px)`;
        }
        ticking = false;
      });
    }, { passive: true });
    // hand over transform control after entrance animation
    setTimeout(() => { heroImg.style.transition = "none"; }, 3600);
  }

  /* ── Testimonial slider ────────────────────────────────── */
  const quotes = [...document.querySelectorAll(".quote")];
  const dots = [...document.querySelectorAll(".slider__dot")];
  let slideIndex = 0, slideTimer;
  const goTo = (i) => {
    slideIndex = (i + quotes.length) % quotes.length;
    quotes.forEach((q, qi) => q.classList.toggle("is-active", qi === slideIndex));
    dots.forEach((d, di) => d.classList.toggle("is-active", di === slideIndex));
  };
  const autoplay = () => {
    clearInterval(slideTimer);
    if (!reduceMotion) slideTimer = setInterval(() => goTo(slideIndex + 1), 6000);
  };
  dots.forEach(d => d.addEventListener("click", () => { goTo(+d.dataset.slide); autoplay(); }));
  // swipe support
  const slider = document.getElementById("slider");
  if (slider) {
    let startX = 0;
    slider.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { goTo(slideIndex + (dx < 0 ? 1 : -1)); autoplay(); }
    }, { passive: true });
  }
  autoplay();

  /* ── Custom cursor + magnetic buttons (fine pointers) ──── */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduceMotion) {
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll("a, button, [data-hover]").forEach(el => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });

    /* magnetic pull */
    document.querySelectorAll(".magnetic").forEach(el => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ── Footer year ───────────────────────────────────────── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
