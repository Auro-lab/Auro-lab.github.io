const username = "Auro-lab";

/* 1. Name: letters drop in once on load */
const nameEl = document.getElementById("name");
nameEl.innerHTML = [...nameEl.textContent]
  .map((c, i) => `<span style="animation-delay:${i * 70}ms" aria-hidden="true">${c}</span>`)
  .join("");

/* 2. Hero network: nodes drift and link up to your cursor */
const canvas = document.getElementById("net");
const ctx = canvas.getContext("2d");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mouse = { x: -999, y: -999 };
let nodes = [], w, h, dpr;

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  w = canvas.clientWidth; h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(90, Math.floor((w * h) / 14000));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
    r: 1.5 + Math.random() * 2
  }));
}

function draw() {
  ctx.clearRect(0, 0, w, h);
  for (const n of nodes) {
    if (!still) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, 6.283);
    ctx.fillStyle = "rgba(245,247,255,.85)";
    ctx.fill();
  }
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 120) {
        ctx.strokeStyle = `rgba(201,208,255,${(1 - d / 120) * .5})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
    if (dm < 180) {
      ctx.strokeStyle = `rgba(255,106,61,${(1 - dm / 180) * .9})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      if (!still) { a.x += (mouse.x - a.x) * .004; a.y += (mouse.y - a.y) * .004; }
    }
  }
  if (!still) requestAnimationFrame(draw);
}

addEventListener("resize", () => { resize(); if (still) draw(); });
canvas.parentElement.addEventListener("pointermove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
});
canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
resize(); draw();

/* 3. Projects from GitHub */
const list = document.getElementById("repo-list");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

(async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error(res.status);
    const repos = (await res.json())
      .filter(r => !r.fork && r.name.toLowerCase() !== `${username.toLowerCase()}.github.io`);
    if (!repos.length) { list.textContent = "No public projects yet. Push your first repo and it will appear here."; return; }
    list.innerHTML = repos.map(r => `
      <a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <h3>${esc(r.name)}</h3>
        <p>${esc(r.description) || "No description yet."}</p>
        <small>${esc(r.language) || "Mixed"} &middot; ${r.stargazers_count} stars</small>
      </a>`).join("");
  } catch {
    list.innerHTML = `Couldn't load projects right now. <a href="https://github.com/${username}" target="_blank" rel="noopener">View them on GitHub</a>.`;
  }
})();