/* =========================================================================
   STIKMONTAS — interactions
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- YEAR ---------- */
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- NAV ---------- */
  var nav = $("#nav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 40); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- MOBILE MENU ---------- */
  var toggle = $("#navToggle"), menu = $("#mobileMenu");
  function closeMenu() { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$(".mobile-menu a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  }

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, smoothTouch: false, wheelMultiplier: 1 });
    window.lenis = lenis;
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- ANCHOR SMOOTH SCROLL (nav offset) ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY - 64;
      if (lenis) lenis.scrollTo(top, { duration: 1.1 });
      else window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- REVEAL (IntersectionObserver — robust) ---------- */
  if (reduce) {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
    $$("[data-stagger]").forEach(function (el) { el.classList.add("in"); });
    $$(".step").forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.hasAttribute("data-stagger")) {
          $$(":scope > *", el).forEach(function (ch, i) { ch.style.transitionDelay = (i * 80) + "ms"; });
        }
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal, [data-stagger], .step").forEach(function (el) { io.observe(el); });
  }

  /* ---------- FROSTED-GLASS CLEARS (signature) ---------- */
  if (!reduce) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var tile = en.target;
        tile.classList.add("frame");
        var frost = document.createElement("span");
        frost.className = "frost";
        tile.appendChild(frost);
        // force reflow then clear
        void frost.offsetWidth;
        requestAnimationFrame(function () { tile.classList.add("cleared"); });
        setTimeout(function () { if (frost && frost.parentNode) frost.parentNode.removeChild(frost); tile.classList.remove("frame", "cleared"); }, 1300);
        fio.unobserve(tile);
      });
    }, { threshold: 0.15 });
    $$(".tile").forEach(function (t) { fio.observe(t); });
  }

  /* ---------- HERO PARALLAX ---------- */
  if (!reduce && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var heroImg = $(".hero-media img");
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 12, ease: "none", force3D: true,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------- GALLERY FILTER + SHOW MORE ---------- */
  var filters = $$("#filters .filter"), tiles = $$("#masonry .tile");
  var moreBtn = $("#galMore");
  var LIMIT = 9, expanded = false;

  function applyLimit() {
    var shown = 0;
    tiles.forEach(function (t) {
      if (t.classList.contains("hide")) { t.classList.remove("beyond"); return; }
      t.classList.toggle("beyond", !expanded && shown >= LIMIT);
      shown++;
    });
    if (moreBtn) {
      var overflow = shown - LIMIT;
      if (overflow > 0) {
        moreBtn.style.display = "";
        moreBtn.classList.toggle("is-open", expanded);
        moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
        moreBtn.firstChild.nodeValue = expanded ? "Rodyti mažiau " : ("Rodyti daugiau (" + overflow + ") ");
      } else {
        moreBtn.style.display = "none";
      }
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("active"); btn.setAttribute("aria-selected", "true");
      var f = btn.getAttribute("data-filter");
      tiles.forEach(function (t) {
        var show = f === "all" || t.getAttribute("data-cat") === f;
        t.classList.toggle("hide", !show);
      });
      expanded = false;
      applyLimit();
    });
  });

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      expanded = !expanded;
      applyLimit();
      if (!expanded) {
        var top = document.getElementById("darbai").getBoundingClientRect().top + window.scrollY - 64;
        if (lenis) lenis.scrollTo(top, { duration: 1 });
        else window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }

  applyLimit();

  /* ---------- LIGHTBOX ---------- */
  var lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  var current = [], idx = 0;
  function visibleTiles() { return tiles.filter(function (t) { return !t.classList.contains("hide") && !t.classList.contains("beyond"); }); }
  function show(i) {
    if (!current.length) return;
    idx = (i + current.length) % current.length;
    var t = current[idx];
    var img = $("img", t);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = t.getAttribute("data-title") + " — " + t.getAttribute("data-tag");
  }
  function openLb(t) {
    current = visibleTiles();
    show(current.indexOf(t));
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeLb() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  tiles.forEach(function (t) { t.addEventListener("click", function () { openLb(t); }); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbNext").addEventListener("click", function () { show(idx + 1); });
  $("#lbPrev").addEventListener("click", function () { show(idx - 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "ArrowLeft") show(idx - 1);
  });

  /* ---------- FAQ ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item), a = $(".faq-a", item);
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      $$(".faq-item.open").forEach(function (o) { o.classList.remove("open"); $(".faq-a", o).style.maxHeight = null; });
      if (!open) { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (fine && !reduce) {
    $$("[data-magnetic]").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = "translate(" + x + "px," + y + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- FORM ---------- */
  var form = $("#quoteForm"), msg = $("#formMsg");
  if (form) {
    form.addEventListener("submit", function (e) {
      var name = $("#name").value.trim();
      var phone = $("#phone").value.trim();
      if (!name || !phone) { return; /* let native required validation show */ }
      var notConfigured = form.action.indexOf("your-id") !== -1;
      if (notConfigured) {
        // Fallback: compose an e-mail so the form works without a backend
        e.preventDefault();
        var email = $("#email").value.trim();
        var service = $("#service").value;
        var message = $("#message").value.trim();
        var body = "Vardas: " + name + "%0D%0ATelefonas: " + phone +
          "%0D%0AEl. paštas: " + email + "%0D%0APaslauga: " + service +
          "%0D%0A%0D%0AŽinutė:%0D%0A" + message;
        window.location.href = "mailto:stikmontas@gmail.com?subject=" +
          encodeURIComponent("Užklausa iš svetainės — " + service) + "&body=" + body;
        msg.classList.add("ok");
        form.reset();
      }
      // if configured, Formspree handles the POST natively
    });
  }
})();
