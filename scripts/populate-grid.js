// Builds the photo grid from images/FK (1..41).jpg, with a staggered reveal.
(function () {
  const container = document.getElementById("imageContainer");
  if (!container) return;
  const COUNT = 41;

  function makeItem(src, index) {
    const item = document.createElement("div");
    item.className = "grid-item";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = "Farica Kimora — frame " + index;
    img.src = src;
    img.dataset.full = src;

    item.appendChild(img);
    item.addEventListener("click", () => window.__openLightbox && window.__openLightbox(src));

    img.addEventListener("load", () => {
      // stagger the fade-in a touch so the grid cascades in
      setTimeout(() => item.classList.add("shown"), (index % 12) * 40);
    });
    img.addEventListener("error", () => item.remove());
    return item;
  }

  for (let i = 1; i <= COUNT; i++) {
    const src = "images/FK (" + i + ").jpg";
    container.appendChild(makeItem(src, i));
  }

  // expose current gallery srcs for the lightbox prev/next
  window.__gallerySrcs = () =>
    Array.from(container.querySelectorAll("img")).map((im) => im.dataset.full);
})();
