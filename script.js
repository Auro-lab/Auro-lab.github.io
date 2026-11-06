const username = "Auro-lab";

/* 1. Name: letters rise in once on load */
const nameEl = document.getElementById("name");
nameEl.innerHTML = [...nameEl.textContent]
  .map((c, i) => `<span style="animation-delay:${i * 80}ms" aria-hidden="true">${c}</span>`)
  .join("");

/* 2. D night scene: centered glowing orb */
(function scene3D() {
  if (!window.THREE) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("gl");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 7;
  const group = new THREE.Group();
  scene.add(group);

  const uniforms = { uTime: { value: 0 } };
  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 40),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        varying vec3 vN; varying vec3 vPos; varying float vD;
        float n(vec3 p){ return sin(p.x*2.1+uTime)*sin(p.y*2.3+uTime*1.2)*sin(p.z*2.7-uTime*.8); }
        void main(){
          float d = n(position*1.4)*.28 + n(position*3.1)*.07;
          vec3 p = position + normal*d;
          vD = d;
          vN = normalize(normalMatrix*normal);
          vec4 mv = modelViewMatrix*vec4(p,1.);
          vPos = mv.xyz;
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader: `
        varying vec3 vN; varying vec3 vPos; varying float vD;
        void main(){
          float f = pow(1. - max(dot(normalize(vN), normalize(-vPos)), 0.), 2.4);
          vec3 base = mix(vec3(.04,.1,.5), vec3(.3,.5,1.), smoothstep(-.3,.3,vD));
          vec3 col = mix(base, vec3(.55,.8,1.), f) + f*.25;
          gl_FragColor = vec4(col, 1.);
        }`
    })
  );

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 48, 48),
    new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 vN; void main(){ float i = clamp(pow(.72 - dot(vN, vec3(0.,0.,1.)), 3.), 0., 1.); gl_FragColor = vec4(.3,.55,1.,1.)*i; }`,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    })
  );

  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.05, 1),
    new THREE.MeshBasicMaterial({ color: 0x7fb0ff, wireframe: true, transparent: true, opacity: 0.14 })
  );
  group.add(orb, glow, cage);

  const count = 1800, pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3.5 + Math.random() * 7, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(b) * Math.cos(a);
    pos[i*3+1] = r * Math.sin(b) * Math.sin(a);
    pos[i*3+2] = r * Math.cos(b);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xc9d6ff, size: 0.028, transparent: true, opacity: 0.8 }));
  scene.add(stars);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 800;
    group.position.set(0, wide ? 0.75 : 1.3, 0);
    group.scale.setScalar(wide ? 1 : 0.72);
    if (still) render(0);
  }

  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener("pointermove", e => {
    target.x = e.clientX / innerWidth - 0.5;
    target.y = e.clientY / innerHeight - 0.5;
  });

  function render(t) {
    uniforms.uTime.value = t;
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;
    group.rotation.y = cur.x * 0.9 + t * 0.1;
    group.rotation.x = cur.y * 0.6;
    cage.rotation.y = -t * 0.15;
    stars.rotation.y = t * 0.015 + scrollY * 0.0004;
    camera.position.z = 7 + scrollY * 0.003;
    renderer.render(scene, camera);
  }

  addEventListener("resize", resize);
  resize();
  if (!still) {
    const clock = new THREE.Clock();
    (function loop() { render(clock.getElapsedTime()); requestAnimationFrame(loop); })();
  }
})();

/* 3. Project cards with screenshot galleries */

/* EDIT YOUR PROJECTS HERE. "folder" is the name of the screenshots subfolder. */
const projects = [
  {
    folder: "Locked_In",                      // <- was "Service_Management_for_tech"
    title: "Service Management for Tech",
    description: "A web application for managing technical service workflows.",
    tech: ["HTML", "Node.js", "Bootstrap", "MySQL"],
    live: ""
  },
  {
    folder: "Service_Management_for_tech",    // <- was "Locked_In"
    title: "Locked In",
    description: "A learning tool that supports reading comprehension for students with low learning skills.",
    tech: ["HTML", "Flask", "CSS", "MySQL"],
    live: ""
  },
    {
    folder: "Soon",
    title: "New Project Coming Soon",
    description: "A new project is in progress. Check back soon.",
    tech: ["A simple game"],
    live: ""
  },
  {
    folder: "Soon",
    title: "New Project Coming Soon",
    description: "A new project is in progress. Check back soon.",
    tech: ["Secret"],
    live: ""
  }
];

const list = document.getElementById("repo-list");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const exts = ["png", "jpg", "webp"];
const MAX_SHOTS = 6;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const gallery = {};

function probe(src) {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res(true);
    i.onerror = () => res(false);
    i.src = src;
  });
}

async function findShots(folder) {
  const base = `screenshots/${encodeURIComponent(folder)}`;
  const found = [];
  for (let n = 1; n <= MAX_SHOTS; n++) {
    let hit = null;
    for (const e of exts) {
      for (const src of [`${base}_${n}.${e}`, `${base}/${n}.${e}`]) {
        if (await probe(src)) { hit = src; break; }
      }
      if (hit) break;
    }
    if (!hit) break;
    found.push(hit);
  }
  return found;
}


/* Lightbox */
const lb = document.createElement("div");
lb.className = "lb";
lb.hidden = true;
lb.setAttribute("role", "dialog");
lb.setAttribute("aria-modal", "true");
lb.setAttribute("aria-label", "Project screenshots");
lb.innerHTML = `
  <button class="lb-close" aria-label="Close gallery">&times;</button>
  <button class="lb-nav prev" aria-label="Previous screenshot">&#8249;</button>
  <figure><img alt=""><figcaption></figcaption></figure>
  <button class="lb-nav next" aria-label="Next screenshot">&#8250;</button>`;
document.body.appendChild(lb);

const lbImg = lb.querySelector("img");
const lbCap = lb.querySelector("figcaption");
const btnClose = lb.querySelector(".lb-close");
const btnPrev = lb.querySelector(".prev");
const btnNext = lb.querySelector(".next");
let shots = [], idx = 0, title = "", lastFocus = null;

function show(i, dir = 0) {
  idx = (i + shots.length) % shots.length;
  lbImg.src = shots[idx];
  lbImg.alt = `${title} screenshot ${idx + 1}`;
  lbCap.textContent = `${title}  ·  ${idx + 1} / ${shots.length}`;
  const many = shots.length > 1;
  btnPrev.hidden = btnNext.hidden = !many;
  if (dir && !reduceMotion) {
    lbImg.animate(
      [{ opacity: 0, transform: `translateX(${dir * 50}px)` }, { opacity: 1, transform: "none" }],
      { duration: 280, easing: "cubic-bezier(.2,.9,.2,1)" }
    );
  }
}

function openGallery(name, imgs) {
  title = name; shots = imgs; lastFocus = document.activeElement;
  show(0);
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  btnClose.focus();
}

function closeGallery() {
  lb.hidden = true;
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

btnPrev.addEventListener("click", () => show(idx - 1, -1));
btnNext.addEventListener("click", () => show(idx + 1, 1));
btnClose.addEventListener("click", closeGallery);
lb.addEventListener("click", e => { if (e.target === lb) closeGallery(); });

document.addEventListener("keydown", e => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeGallery();
  else if (e.key === "ArrowLeft") show(idx - 1, -1);
  else if (e.key === "ArrowRight") show(idx + 1, 1);
  else if (e.key === "Tab") {
    const items = [btnClose, btnPrev, btnNext].filter(b => !b.hidden);
    const pos = items.indexOf(document.activeElement);
    e.preventDefault();
    items[(pos + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
  }
});

let touchX = null;
lb.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  touchX = null;
});

list.addEventListener("click", e => {
  const b = e.target.closest(".shot");
  if (!b) return;
  const imgs = gallery[b.dataset.folder];
  if (imgs && imgs.length) openGallery(b.dataset.title, imgs);
});

function placeholder(label) {
  const d = document.createElement("div");
  d.className = "ph";
  d.innerHTML = `<strong>${esc(label)}</strong><span>Screenshots coming soon</span>`;
  return d;
}

/* Build the cards */
list.innerHTML = projects.map(p => {
  const live = /^https?:\/\//.test(p.live || "") ? p.live : "";
  return `
  <article class="repo">
    <button class="shot" type="button" data-folder="${esc(p.folder)}" data-title="${esc(p.title)}" aria-label="View screenshots of ${esc(p.title)}"></button>
    <div class="repo-body">
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      <div class="tags">
        ${(p.tech || []).map(t => `<span>${esc(t)}</span>`).join("")}
      </div>
      ${live ? `<div class="links"><a href="${esc(live)}" target="_blank" rel="noopener">Live site</a></div>` : ""}
    </div>
  </article>`;
}).join("");

/* Load screenshots for each card */
list.querySelectorAll(".shot").forEach(async btn => {
  const found = await findShots(btn.dataset.folder);
  gallery[btn.dataset.folder] = found;
  if (!found.length) { btn.appendChild(placeholder(btn.dataset.title)); btn.style.cursor = "default"; return; }
  const img = document.createElement("img");
  img.src = found[0];
  img.alt = `Cover screenshot of ${btn.dataset.title}`;
  btn.appendChild(img);
  const badge = document.createElement("span");
  badge.className = "count";
  badge.textContent = found.length > 1 ? `${found.length} screenshots · click to view` : "Click to view";
  btn.appendChild(badge);
});