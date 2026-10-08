// Nav solidify, scroll reveals, lightbox. Vanilla, no dependencies.
(function () {
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
