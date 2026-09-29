/* VERDOR — scroll choreography (GSAP + ScrollTrigger + Lenis + FX layer)
   The 3D bottle (webgl.js) reads window.__verdor.intro and section rects itself. */
(function () {
  gsap.registerPlugin(ScrollTrigger);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  var reduced = FX.reduced;

  /* shared state with webgl.js (module loads after this script) */
  var glReady = new Promise(function (r) { window.__verdor = { intro: 0, ready: r }; });

  /* smooth scroll */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  FX.cursor();
  FX.progress();
  FX.magnetic("[data-magnetic]");

  /* toast */
  var toast = document.getElementById("toast"), hideTimer;
  document.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toast.classList.add("is-on");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2400);
    });
  });

  /* anchors through Lenis */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target && lenis) { e.preventDefault(); lenis.scrollTo(target); }
    });
  });

  if (reduced) {
    document.documentElement.classList.remove("is-loading");
    document.getElementById("nav").classList.add("is-in");
    window.__verdor.intro = 1;
    return;
  }

  /* ---------- pins first (so later triggers measure the spacing) ---------- */
  var track = document.getElementById("harvestTrack");
  var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
  var harvestTween = gsap.to(track, {
    x: function () { return -dist(); }, ease: "none",
    scrollTrigger: {
      trigger: "#harvest", pin: "#harvestPin", start: "top top",
      end: function () { return "+=" + dist(); }, scrub: 0.8, invalidateOnRefresh: true,
      onUpdate: function (self) { document.getElementById("harvestBar").style.transform = "scaleX(" + self.progress + ")"; }
    }
  });
  gsap.utils.toArray(".hcard__img img").forEach(function (img) {
    gsap.fromTo(img, { xPercent: -7 }, {
      xPercent: 7, ease: "none",
      scrollTrigger: { trigger: img.parentNode, containerAnimation: harvestTween, start: "left right", end: "right left", scrub: true }
    });
  });

  var pct = document.getElementById("pourPct");
  ScrollTrigger.create({
    trigger: "#pour", pin: "#pourPin", start: "top top", end: "+=190%", anticipatePin: 1,
    onUpdate: function (self) {
      var p = gsap.utils.clamp(0, 1, (self.progress - 0.3) / 0.55);
      pct.textContent = Math.round(p * 100);
    }
  });

  /* ---------- hero intro (plays as the loader curtain lifts) ---------- */
  var heroChars = FX.charRise(document.getElementById("heroTitle"), { trigger: false, stagger: 0.035, duration: 1.3 });
  FX.preloader(glReady).then(function () {
    document.documentElement.classList.remove("is-loading");
    lenis && lenis.start();
    document.getElementById("nav").classList.add("is-in");
    gsap.to(window.__verdor, { intro: 1, duration: 2.4, ease: "expo.out", delay: 0.1 });
    heroChars.play(0).delay(0.25);
    gsap.to(".hero [data-hero]", { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", delay: 0.7 });
    ScrollTrigger.refresh();
  });

  /* ---------- marquee: velocity-reactive + skew ---------- */
  var mq = document.getElementById("marquee");
  var loop = gsap.to(mq, { xPercent: -50, ease: "none", duration: 24, repeat: -1 });
  var skewTo = gsap.quickTo(mq, "skewX", { duration: 0.5, ease: "power3.out" });
  ScrollTrigger.create({
    onUpdate: function (self) {
      var v = self.getVelocity();
      gsap.to(loop, { timeScale: (self.direction || 1) * gsap.utils.clamp(0.4, 5, Math.abs(v / 260)), duration: 0.4, overwrite: true });
      skewTo(gsap.utils.clamp(-12, 12, v / -220));
    }
  });

  /* ---------- text & image reveals ---------- */
  gsap.utils.toArray("[data-split]").forEach(function (h) { FX.charRise(h, { start: "top 86%" }); });
  FX.charRise(document.querySelector(".pour__title"), { start: "top 75%", stagger: 0.03 });
  FX.charRise(document.getElementById("footWord"), { start: "top 92%", stagger: 0.06, duration: 1.4 });
  FX.scrambleOnScroll("[data-scramble]");
  FX.clipReveals("[data-clip]");

  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  gsap.utils.toArray("[data-parallax] img").forEach(function (img) {
    var amt = parseFloat(img.closest("[data-parallax]").dataset.parallax) || 20;
    gsap.fromTo(img, { yPercent: -amt / 4 }, {
      yPercent: amt / 4, ease: "none",
      scrollTrigger: { trigger: img.closest("[data-parallax]"), start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---------- 02: count + scrubbed clock ---------- */
  gsap.utils.toArray(".count").forEach(function (el) {
    var obj = { n: 0 };
    gsap.to(obj, {
      n: parseInt(el.dataset.count, 10), duration: 1.8, ease: "power2.out", snap: { n: 1 },
      onUpdate: function () { el.textContent = obj.n; },
      scrollTrigger: { trigger: el, start: "top 80%" }
    });
  });
  gsap.from(".hours__big", { scale: 0.8, opacity: 0, filter: "blur(18px)", duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: "#hours", start: "top 70%" } });
  gsap.to("#clockHand", { rotation: 480, ease: "none", scrollTrigger: { trigger: "#hours", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- tilt cards ---------- */
  if (FX.fine) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
      var ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 12);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      });
      card.addEventListener("pointerleave", function () { rx(0); ry(0); });
    });
  }

  /* shop cards stagger up */
  gsap.from(".sku__bottle", { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".shop__grid", start: "top 80%" } });
})();
