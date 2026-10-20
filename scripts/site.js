// Nav solidify, scroll reveals, lightbox. Vanilla, no dependencies.
(function () {
  // intro: butterflies blanket the screen, then scatter outward and reveal the page
  const intro = document.getElementById("intro");
  if (intro) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      intro.remove();
    } else {
      const w = innerWidth, h = innerHeight;
      const cx = w / 2, cy = h / 2;
      const count = Math.min(140, Math.ceil((w * h) / 9000));
      const flights = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const size = 90 + Math.random() * 110;

        const bf = document.createElement("div");
        bf.className = "bf";
        bf.style.left = x + "px";
        bf.style.top = y + "px";
        bf.style.setProperty("--size", size + "px");
        bf.style.setProperty("--flap", (0.12 + Math.random() * 0.12).toFixed(2) + "s");

        const img = document.createElement("img");
        img.src = "assets/butterfly.png";
        img.alt = "";
        bf.appendChild(img);
        intro.appendChild(bf);

        // fly away from the centre, with a wobble partway so the path curves
        const angle = Math.atan2(y - cy, x - cx) + (Math.random() - 0.5) * 0.8;
        const dist = Math.hypot(w, h);
        const ex = Math.cos(angle) * dist, ey = Math.sin(angle) * dist;
        const mx = ex * 0.35 + (Math.random() - 0.5) * 160;
        const my = ey * 0.35 - 60 - Math.random() * 120;
        const heading = angle * 180 / Math.PI + 90; // the png faces up
        const start = (Math.random() - 0.5) * 40;

        flights.push(() => bf.animate([
          { transform: `translate(0, 0) rotate(${start}deg) scale(1)` },
          { transform: `translate(${mx}px, ${my}px) rotate(${heading}deg) scale(0.9)`, offset: 0.4 },
          { transform: `translate(${ex}px, ${ey}px) rotate(${heading}deg) scale(0.6)` }
        ], {
          duration: 1600 + Math.random() * 1000,
          delay: Math.random() * 900,
          easing: "ease-in",
          fill: "forwards"
        }).finished);
      }

      let started = false;
      const release = () => {
        if (started) return;
        started = true;
        intro.classList.add("go");
        Promise.all(flights.map((fly) => fly())).then(() => intro.remove());
      };
      intro.addEventListener("click", release);
      setTimeout(release, 900);
    }
  }

  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // nav background on scroll
  const nav = document.getElementById("nav");
  const onScroll = () => nav && nav.classList.toggle("solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // reveal sections on scroll
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // lightbox
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  let list = [], idx = 0;

  function show(i) {
    list = (window.__gallerySrcs && window.__gallerySrcs()) || list;
    if (!list.length) return;
    idx = (i + list.length) % list.length;
    lbImg.src = list[idx];
  }
  window.__openLightbox = function (src) {
    list = (window.__gallerySrcs && window.__gallerySrcs()) || [src];
    idx = Math.max(0, list.indexOf(src));
    lbImg.src = src;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
  };
  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    lbImg.src = "";
  }
  if (lb) {
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
    lb.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }
})();
