// Play counts and ❤ loves for tracks played from this site's own audio (not SoundCloud/YouTube).
// Talks to the counter on the main Netlify site. If it can't be reached (GitHub Pages without it,
// a local file, an outage) nothing is shown and the players work exactly as before.
(function () {
  const API = "https://faricakimora.netlify.app/api/stats";
  const LOVED = "fk-loved", LAST = "fk-last-play";
  const REPLAY_GAP = 5 * 60 * 1000; // the same browser replaying a track within 5 min isn't another play

  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const fmt = (n) => Number(n || 0).toLocaleString("en");

  // id = "album-slug/NN": from data-id, or worked out from ".../<album>/<NN>.<name>.mp3"
  function idOf(el) {
    if (el.dataset.id) return el.dataset.id;
    const m = (el.dataset.src || "").match(/([a-z0-9-]+)\/(\d{2})\.[^/]+$/i);
    return m ? `${m[1].toLowerCase()}/${m[2]}` : null;
  }

  async function call(method, body, query = "") {
    try {
      const res = await fetch(API + query, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }

  const views = new Map(); // id -> [{ plays, loves, btn }]

  function render(id, s) {
    (views.get(id) || []).forEach((v) => {
      v.plays.textContent = `${fmt(s.plays)} ${s.plays === 1 ? "play" : "plays"}`;
      v.loves.textContent = fmt(s.loves);
    });
  }

  function markLoved(id, on) {
    (views.get(id) || []).forEach((v) => {
      v.btn.classList.toggle("on", on);
      v.btn.setAttribute("aria-pressed", on);
      v.btn.setAttribute("aria-label", on ? "Unlove this track" : "Love this track");
    });
  }

  window.FKStats = {
    // Adds "N plays · ❤ N" to each track element; mount(el, node) chooses where it goes.
    async attach(els, mount = (el, node) => el.appendChild(node)) {
      const tracks = els.map((el) => [el, idOf(el)]).filter(([, id]) => id);
      if (!tracks.length) return;
      const counts = await call("GET", null, "?ids=" + encodeURIComponent(tracks.map(([, id]) => id).join(",")));
      if (!counts) return; // counter unavailable: show nothing

      const loved = load(LOVED);
      tracks.forEach(([el, id]) => {
        const node = document.createElement("span");
        node.className = "fk-stats";
        node.innerHTML = `<span class="fk-plays"></span><button type="button" class="fk-love" aria-pressed="false">❤ <span></span></button>`;
        const btn = node.querySelector(".fk-love");
        const view = { plays: node.querySelector(".fk-plays"), loves: btn.querySelector("span"), btn };
        views.set(id, [...(views.get(id) || []), view]);

        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // don't start the track
          const now = load(LOVED);
          const on = !now[id];
          if (on) now[id] = 1; else delete now[id];
          save(LOVED, now);
          markLoved(id, on);
          const res = await call("POST", { id, action: on ? "love" : "unlove" });
          if (res && res[id]) render(id, res[id]);
        });
        btn.addEventListener("keydown", (e) => e.stopPropagation());

        mount(el, node);
        render(id, counts[id] || { plays: 0, loves: 0 });
        markLoved(id, !!loved[id]);
      });
    },

    // Counts a play once a track has really been listened to: 30 s, or 90% of a shorter track.
    watch(audio, currentEl) {
      let heard = 0, last = 0, counted = false;
      audio.addEventListener("loadstart", () => { heard = 0; last = 0; counted = false; });
      audio.addEventListener("seeking", () => { last = audio.currentTime; });
      audio.addEventListener("timeupdate", async () => {
        const t = audio.currentTime, d = t - last;
        last = t;
        if (counted || d <= 0 || d > 1.5) return; // ignore jumps
        heard += d;
        const need = Math.min(30, (audio.duration || 30) * 0.9);
        if (heard < need) return;
        counted = true;

        const el = currentEl();
        const id = el && idOf(el);
        if (!id) return;
        const recent = load(LAST);
        if (Date.now() - (recent[id] || 0) < REPLAY_GAP) return;
        recent[id] = Date.now();
        save(LAST, recent);
        const res = await call("POST", { id, action: "play" });
        if (res && res[id]) render(id, res[id]);
      });
    },
  };
})();
