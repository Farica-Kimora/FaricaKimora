// Fan mail form: sends to the fan mail function on the main Netlify site (read at /inbox.html).
(function () {
  const form = document.getElementById("fmForm");
  if (!form) return;
  const API = "https://faricakimora.netlify.app/api/fanmail"; // absolute, so a GitHub Pages copy still delivers
  const status = document.getElementById("fmStatus");
  const left = document.getElementById("fmLeft");
  const msg = form.elements.message;
  msg.addEventListener("input", () => { left.textContent = 2000 - msg.value.length; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    status.classList.remove("err");
    if (data.message.trim().length < 2) { status.classList.add("err"); status.textContent = "Write a message first."; return; }

    const btn = form.querySelector("button");
    btn.disabled = true;
    status.textContent = "Sending…";
    let res = null;
    try {
      res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, from: "Main site" }),
      });
    } catch {}
    btn.disabled = false;

    if (res && res.ok) {
      form.reset();
      left.textContent = 2000;
      status.textContent = "Sent. Thank you ☆";
    } else {
      const err = res ? (await res.json().catch(() => ({}))).error : null;
      status.classList.add("err");
      status.textContent = err || "Couldn't send right now. Try again later.";
    }
  });
})();
