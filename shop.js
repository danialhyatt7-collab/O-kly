/* Oakly® — storefront interactions (shared) */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      autoRaf: true
    });

    /* Route same-page anchor links (nav links, "Home" underline, etc.)
       through Lenis so they get the same eased scroll, offset clear of
       the sticky header. */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      a.addEventListener("click", function (e) {
        var target;
        try { target = document.querySelector(id); } catch (err) { return; }
        if (!target) return;
        e.preventDefault();
        var header = document.querySelector(".nav, .site-header");
        var offset = header ? -(header.offsetHeight + 16) : -24;
        lenis.scrollTo(target, { offset: offset, duration: 1.3 });
      });
    });
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

  /* ============================================================
     Cart — persisted to localStorage, shared across every page
     ============================================================ */

  var WHATSAPP_NUMBER = "923005926262";
  var CART_KEY = "oakly_cart_v1";

  function money(n) { return "PKR " + Math.round(n).toLocaleString("en-US"); }

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function setCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    renderCart();
  }

  function cartCount(cart) {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function cartTotal(cart) {
    return cart.reduce(function (sum, item) { return sum + item.qty * item.price; }, 0);
  }

  function addToCart(item, qty) {
    qty = qty || 1;
    var cart = getCart();
    var existing = cart.filter(function (i) { return i.name === item.name; })[0];
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ name: item.name, price: item.price, img: item.img, href: item.href, qty: qty });
    }
    setCart(cart);
    showToast("Added to cart");
  }

  function removeFromCart(name) {
    setCart(getCart().filter(function (i) { return i.name !== name; }));
  }

  function setQty(name, qty) {
    var cart = getCart();
    var item = cart.filter(function (i) { return i.name === name; })[0];
    if (!item) return;
    if (qty < 1) {
      cart = cart.filter(function (i) { return i.name !== name; });
    } else {
      item.qty = Math.min(99, qty);
    }
    setCart(cart);
  }

  /* ---------- Cart drawer: built once, reused on every page ---------- */

  var drawer = null;
  var itemsEl = null;
  var emptyEl = null;
  var subtotalEl = null;
  var footEl = null;
  var countEl = document.querySelector(".cart-count");

  function buildDrawer() {
    if (drawer || !document.querySelector(".cart-btn")) return;

    drawer = document.createElement("div");
    drawer.className = "cart-drawer";
    drawer.setAttribute("data-cart-drawer", "");
    drawer.innerHTML =
      '<div class="cart-drawer__backdrop" data-cart-close></div>' +
      '<aside class="cart-drawer__panel" role="dialog" aria-label="Shopping cart">' +
        '<div class="cart-drawer__head">' +
          '<h3>Your Cart</h3>' +
          '<button class="cart-drawer__close" data-cart-close aria-label="Close cart">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="cart-drawer__items" data-cart-items></div>' +
        '<p class="cart-drawer__empty" data-cart-empty>Your cart is empty. Start adding pieces you love.</p>' +
        '<div class="cart-drawer__foot" data-cart-foot>' +
          '<div class="cart-drawer__row"><span>Subtotal</span><b data-cart-subtotal></b></div>' +
          '<p class="cart-drawer__note">Free white-glove delivery, ships in 3 weeks. Final total confirmed over WhatsApp.</p>' +
          '<button class="btn btn--full cart-drawer__checkout" data-cart-checkout type="button">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.93 9.93 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.2c-1.7 0-3.28-.5-4.61-1.36l-.33-.2-3 .79.8-2.93-.22-.34A8.18 8.18 0 0 1 3.8 12 8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.04 0 1.2.88 2.36 1 2.53.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28Z"/></svg>' +
            '<span>Checkout via WhatsApp</span>' +
          '</button>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(drawer);

    itemsEl = drawer.querySelector("[data-cart-items]");
    emptyEl = drawer.querySelector("[data-cart-empty]");
    subtotalEl = drawer.querySelector("[data-cart-subtotal]");
    footEl = drawer.querySelector("[data-cart-foot]");

    drawer.querySelectorAll("[data-cart-close]").forEach(function (el) {
      el.addEventListener("click", closeCart);
    });

    drawer.querySelector("[data-cart-checkout]").addEventListener("click", checkoutViaWhatsApp);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) closeCart();
    });

    var trigger = document.querySelector(".cart-btn");
    if (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openCart();
      });
    }
  }

  function openCart() { if (drawer) { renderCart(); drawer.classList.add("is-open"); } }
  function closeCart() { if (drawer) drawer.classList.remove("is-open"); }

  function itemRowHTML(item) {
    return (
      '<div class="cart-item" data-cart-item="' + item.name.replace(/"/g, "&quot;") + '">' +
        '<img class="cart-item__img" src="' + item.img + '" alt="" />' +
        '<div class="cart-item__body">' +
          '<p class="cart-item__name">' + item.name + '</p>' +
          '<p class="cart-item__price">' + money(item.price) + '</p>' +
          '<div class="cart-item__qty">' +
            '<button type="button" data-cart-qty="down" aria-label="Decrease quantity">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" data-cart-qty="up" aria-label="Increase quantity">+</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="cart-item__remove" data-cart-remove aria-label="Remove ' + item.name + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</div>'
    );
  }

  function renderCart() {
    var cart = getCart();
    var n = cartCount(cart);

    if (countEl) {
      countEl.textContent = n;
      countEl.classList.toggle("is-on", n > 0);
    }

    if (!drawer) return;

    itemsEl.innerHTML = cart.map(itemRowHTML).join("");
    emptyEl.style.display = cart.length ? "none" : "block";
    footEl.style.display = cart.length ? "block" : "none";
    subtotalEl.textContent = money(cartTotal(cart));

    itemsEl.querySelectorAll("[data-cart-item]").forEach(function (row) {
      var name = row.getAttribute("data-cart-item");
      row.querySelector('[data-cart-qty="up"]').addEventListener("click", function () {
        var item = cart.filter(function (i) { return i.name === name; })[0];
        setQty(name, item.qty + 1);
      });
      row.querySelector('[data-cart-qty="down"]').addEventListener("click", function () {
        var item = cart.filter(function (i) { return i.name === name; })[0];
        setQty(name, item.qty - 1);
      });
      row.querySelector("[data-cart-remove]").addEventListener("click", function () {
        removeFromCart(name);
      });
    });
  }

  function absoluteUrl(href) {
    try { return new URL(href, window.location.href).href; } catch (e) { return href; }
  }

  function checkoutViaWhatsApp() {
    var cart = getCart();
    if (!cart.length) return;

    var lines = ["Hi Oakly! I'd like to order:", ""];
    cart.forEach(function (item, i) {
      lines.push((i + 1) + ". " + item.name + " × " + item.qty + " — " + money(item.price * item.qty));
      if (item.href) lines.push(absoluteUrl(item.href));
      lines.push("");
    });
    lines.push("Subtotal: " + money(cartTotal(cart)));
    lines.push("Delivery: Free white-glove (ships in 3 weeks)");
    lines.push("Total: " + money(cartTotal(cart)));
    lines.push("");
    lines.push("Please confirm availability. Thank you!");

    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");
  }

  buildDrawer();
  renderCart();

  var ADD_CHECK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4 10-10"/></svg>';

  document.querySelectorAll("[data-add]").forEach(function (btn) {
    var check = document.createElement("span");
    check.className = "add-check";
    check.setAttribute("aria-hidden", "true");
    check.innerHTML = ADD_CHECK_SVG;
    btn.appendChild(check);

    var revertTimer;
    btn.addEventListener("click", function () {
      var q = 1;
      var qEl = document.querySelector("[data-qty-input]");
      if ((btn.dataset.add === "main" || btn.dataset.add === "buynow") && qEl) q = parseInt(qEl.value, 10) || 1;

      var name = btn.dataset.name;
      var price = parseFloat(btn.dataset.price);
      if (!name || isNaN(price)) return; // button not wired with product data — nothing to add

      addToCart({ name: name, price: price, img: btn.dataset.img || "", href: btn.dataset.href || "" }, q);

      btn.classList.add("is-added");
      clearTimeout(revertTimer);
      revertTimer = setTimeout(function () { btn.classList.remove("is-added"); }, 1600);

      if (btn.dataset.add === "buynow") checkoutViaWhatsApp();
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
      if (item.tagName === "BUTTON") item.setAttribute("aria-pressed", item.classList.contains("is-active"));
      item.addEventListener("click", function () {
        items.forEach(function (i) {
          i.classList.remove("is-active");
          if (i.tagName === "BUTTON") i.setAttribute("aria-pressed", "false");
        });
        item.classList.add("is-active");
        if (item.tagName === "BUTTON") item.setAttribute("aria-pressed", "true");
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
  if (qInput) {
    var clampQty = function () {
      var v = parseInt(qInput.value, 10);
      if (isNaN(v)) v = 1;
      qInput.value = Math.max(1, Math.min(99, v));
    };
    qInput.addEventListener("change", clampQty);
    qInput.addEventListener("blur", clampQty);
  }

  /* ---------- Accordion ---------- */
  document.querySelectorAll(".acc__head").forEach(function (head) {
    head.setAttribute("aria-expanded", head.parentElement.classList.contains("is-open"));
    head.addEventListener("click", function () {
      var open = head.parentElement.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open);
    });
  });

  /* ---------- Favorite toggle (persisted) ---------- */
  var FAV_KEY = "oakly_favs_v1";
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function setFavs(favs) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {}
  }
  document.querySelectorAll("[data-fav]").forEach(function (btn) {
    var card = btn.closest("[data-cat]");
    var nameEl = card && card.querySelector(".pcard__name");
    var key = btn.dataset.name || (nameEl ? nameEl.textContent.trim() : "");
    var favs = getFavs();
    if (key && favs.indexOf(key) !== -1) btn.classList.add("is-fav");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var isFav = btn.classList.toggle("is-fav");
      if (!key) return;
      var list = getFavs();
      var idx = list.indexOf(key);
      if (isFav && idx === -1) list.push(key);
      if (!isFav && idx !== -1) list.splice(idx, 1);
      setFavs(list);
    });
  });

  /* ---------- Horizontal rail (arrows) ---------- */
  document.querySelectorAll(".rail-wrap").forEach(function (wrap) {
    var rail = wrap.querySelector(".rail");
    var scope = wrap.previousElementSibling; // arrows live in the .section-head above the rail
    var prev = (scope && scope.querySelector("[data-rail-prev]")) || wrap.querySelector("[data-rail-prev]");
    var next = (scope && scope.querySelector("[data-rail-next]")) || wrap.querySelector("[data-rail-next]");
    if (!rail) return;

    // Some browsers land scroll-snap containers a few px off zero on load
    // (to align the first snap point against the container's own padding),
    // not because the user scrolled — ignore that noise so the disabled
    // state doesn't falsely trigger at rest.
    var SCROLL_EPSILON = 12;

    function update() {
      var max = rail.scrollWidth - rail.clientWidth - 1;
      var atStart = rail.scrollLeft <= SCROLL_EPSILON;
      var atEnd = rail.scrollLeft >= max - SCROLL_EPSILON;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    }

    function step(dir) {
      var card = rail.querySelector(".pcard");
      var amount = card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
      rail.scrollBy({ left: dir * amount, behavior: "smooth" });
    }

    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
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
