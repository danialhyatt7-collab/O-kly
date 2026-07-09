/* Oakly® — storefront interactions (shared) */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Cart state ---------- */
  var count = 0;
  var countEl = document.querySelector(".cart-count");
  function addToCart(n) {
    count += (n || 1);
    if (countEl) { countEl.textContent = count; countEl.classList.add("is-on"); }
    showToast("Added to cart");
  }

  /* ---------- Toast ---------- */
  var toast = document.querySelector(".toast");
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.querySelector(".toast__msg").textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2200);
  }

  document.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var q = 1;
      var qEl = document.querySelector("[data-qty-input]");
      if (btn.dataset.add === "main" && qEl) q = parseInt(qEl.value, 10) || 1;
      addToCart(q);
    });
  });

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".mainnav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Generic single-select groups (swatch, chip, filter, thumb) ---------- */
  document.querySelectorAll("[data-select-group]").forEach(function (group) {
    var items = group.querySelectorAll("[data-select]");
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        items.forEach(function (i) { i.classList.remove("is-active"); });
        item.classList.add("is-active");
        // gallery thumb -> swap main image
        if (item.dataset.img) {
          var main = document.querySelector("[data-gallery-main]");
          if (main) {
            main.style.opacity = "0";
            setTimeout(function () { main.src = item.dataset.img; main.style.opacity = "1"; }, 180);
          }
        }
        // filter -> filter cards
        if (item.dataset.filter) {
          var f = item.dataset.filter;
          document.querySelectorAll("[data-cat]").forEach(function (card) {
            var show = f === "all" || card.dataset.cat === f;
            card.style.display = show ? "" : "none";
          });
        }
      });
    });
  });

  /* ---------- Quantity ---------- */
  var qInput = document.querySelector("[data-qty-input]");
  document.querySelectorAll("[data-qty]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!qInput) return;
      var v = parseInt(qInput.value, 10) || 1;
      v += btn.dataset.qty === "up" ? 1 : -1;
      qInput.value = Math.max(1, Math.min(99, v));
    });
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll(".acc__head").forEach(function (head) {
    head.addEventListener("click", function () {
      head.parentElement.classList.toggle("is-open");
    });
  });

  /* ---------- Favorite toggle ---------- */
  document.querySelectorAll("[data-fav]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      btn.classList.toggle("is-fav");
    });
  });

  /* ---------- Sticky mobile buy bar (product page) ---------- */
  var sticky = document.querySelector(".sticky-buy");
  var anchor = document.querySelector("[data-buy-anchor]");
  if (sticky && anchor && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { sticky.classList.toggle("is-on", !e.isIntersecting); });
    }, { threshold: 0 });
    so.observe(anchor);
  }

  if (reduce || !fine) return;

  /* ---------- Custom cursor ---------- */
  var cursor = document.querySelector(".cursor");
  var dot = cursor && cursor.querySelector(".cursor__dot");
  var ring = cursor && cursor.querySelector(".cursor__ring");
  if (dot && ring) {
    var mx=-100,my=-100,rx=-100,ry=-100,raf=null;
    function tick(){ rx+=(mx-rx)*0.18; ry+=(my-ry)*0.18;
      dot.style.transform="translate("+(mx-3)+"px,"+(my-3)+"px)";
      ring.style.transform="translate("+(rx-16)+"px,"+(ry-16)+"px)";
      raf=requestAnimationFrame(tick); }
    window.addEventListener("mousemove",function(e){ mx=e.clientX; my=e.clientY;
      if(raf===null) raf=requestAnimationFrame(tick); },{passive:true});
    document.querySelectorAll("a,button,[data-select],.pcard").forEach(function(el){
      el.addEventListener("mouseenter",function(){cursor.classList.add("is-hover");});
      el.addEventListener("mouseleave",function(){cursor.classList.remove("is-hover");});
    });
  }
})();
