// Discography hero carousel: album covers glide past on their own, centre one in focus.
(function () {
  const root = document.getElementById("carousel");
  if (!root) return;
  const items = Array.from(root.querySelectorAll(".car-item"));
  const caption = document.getElementById("carCaption");
  const n = items.length;
  let active = 0, timer = null;

  function layout() {
    const narrow = innerWidth < 700;
    items.forEach((el, i) => {
      // shortest signed distance around the loop, so it wraps both ways
      let o = ((i - active) % n + n) % n;
      if (o > n / 2) o -= n;
      const d = Math.abs(o);
      const step = narrow ? 62 : 78; // % of a cover's width between neighbours
      el.style.transform = `translateX(calc(-50% + ${o * step}%)) scale(${1 - Math.min(d, 3) * 0.17})`;
      el.style.opacity = d > (narrow ? 1 : 2) ? 0 : 1 - d * 0.25;
      el.style.filter = d ? `brightness(${1 - d * 0.25})` : "none";
      el.style.zIndex = 10 - d;
      el.style.pointerEvents = d > 2 ? "none" : "";
      el.classList.toggle("active", d === 0);
      el.tabIndex = d === 0 ? 0 : -1;
    });
    caption.textContent = items[active].querySelector("img").alt;
  }

  function go(i) { active = (i + n) % n; layout(); }
  function start() {
    stop();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => go(active + 1), 3200);
  }
  function stop() { clearInterval(timer); }

  // clicking a side cover brings it to the centre; clicking the centre one follows its link
  items.forEach((el, i) => el.addEventListener("click", (e) => {
    if (i !== active) { e.preventDefault(); go(i); start(); }
  }));
  root.querySelector(".car-prev").addEventListener("click", () => { go(active - 1); start(); });
  root.querySelector(".car-next").addEventListener("click", () => { go(active + 1); start(); });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  addEventListener("resize", layout);

  layout();
  start();
})();

// Audio player: tap a track (or a single's cover) to play it; plays on through the rest of that album.
(function () {
  const bar = document.getElementById("playerBar");
  if (!bar) return;
  const audio = document.getElementById("pbAudio");
  const $ = (id) => document.getElementById(id);
  const seek = $("pbSeek");
  let queue = [], pos = 0, current = null;

  const fmt = (t) => isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "0:00";

  // each album's <ol> (and the singles grid) is its own queue
  function trackInfo(el) {
    const release = el.closest(".release");
    const title = el.dataset.title || el.querySelector("span").textContent + (el.querySelector("small") ? ` (${el.querySelector("small").textContent})` : "");
    const album = release ? release.querySelector("h3").textContent : "Single";
    const cover = (release || el).querySelector("img").src;
    return { el, src: el.dataset.src, title, album, cover };
  }

  function play(list, i) {
    queue = list; pos = (i + list.length) % list.length;
    const t = queue[pos];
    if (current) current.classList.remove("playing");
    current = t.el; current.classList.add("playing");
    audio.src = t.src;
    audio.play().catch(() => {});
    $("pbTitle").textContent = t.title;
    $("pbAlbum").textContent = t.album;
    $("pbCover").src = t.cover;
    bar.hidden = false;
    document.body.classList.add("has-player");
  }

  function wire(container, selector, trigger) {
    const els = Array.from(container.querySelectorAll(selector));
    const list = els.map(trackInfo);
    els.forEach((el, i) => {
      const target = trigger ? el.querySelector(trigger) : el;
      if (!trigger) { el.tabIndex = 0; el.setAttribute("role", "button"); }
      const go = () => (current === el && !audio.paused) ? audio.pause() : (current === el ? audio.play() : play(list, i));
      target.addEventListener("click", go);
      if (!trigger) el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  document.querySelectorAll(".release .tracks").forEach((ol) => wire(ol, "li[data-src]"));
  const singles = document.querySelector(".singles-grid");
  if (singles) wire(singles, ".single[data-src]", ".single-cover");

  $("pbPlay").addEventListener("click", () => audio.paused ? audio.play() : audio.pause());
  $("pbPrev").addEventListener("click", () => audio.currentTime > 3 ? (audio.currentTime = 0) : play(queue, pos - 1));
  $("pbNext").addEventListener("click", () => play(queue, pos + 1));
  audio.addEventListener("ended", () => { if (pos < queue.length - 1) play(queue, pos + 1); });

  audio.addEventListener("play", () => { $("pbPlay").textContent = "⏸"; $("pbPlay").setAttribute("aria-label", "Pause"); bar.classList.add("on"); });
  audio.addEventListener("pause", () => { $("pbPlay").textContent = "▶"; $("pbPlay").setAttribute("aria-label", "Play"); bar.classList.remove("on"); });
  audio.addEventListener("loadedmetadata", () => { $("pbDur").textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", () => {
    $("pbTime").textContent = fmt(audio.currentTime);
    if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 100;
  });
  seek.addEventListener("input", () => { if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration; });

  // play counts and loves (shows nothing if the counter can't be reached)
  if (window.FKStats) {
    FKStats.attach(Array.from(document.querySelectorAll(".release .tracks li[data-src]")));
    FKStats.attach(Array.from(document.querySelectorAll(".singles-grid .single[data-src]")), (el, node) => el.querySelector("p").after(node));
    FKStats.watch(audio, () => current);
  }
})();
