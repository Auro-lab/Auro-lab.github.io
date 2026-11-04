const username = "Auro-lab";
const featured = ["Servicenode_auro", "Website-Project"];

/* 1. Name: letters rise in once on load */
const nameEl = document.getElementById("name");
nameEl.innerHTML = [...nameEl.textContent]
  .map((c, i) => `<span style="animation-delay:${i * 80}ms" aria-hidden="true">${c}</span>`)
  .join("");

/* 2. 3D night scene: centered glowing orb */
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

/* 3. Project cards with screenshots */
const list = document.getElementById("repo-list");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const exts = ["png", "jpg", "webp"];

function placeholder(name) {
  const d = document.createElement("div");
  d.className = "ph";
  d.innerHTML = `<strong>${esc(name)}</strong><span>Screenshot coming soon</span>`;
  return d;
}

function wireShot(img) {
  let i = 0;
  img.addEventListener("error", () => {
    i++;
    if (i < exts.length) img.src = `screenshots/${encodeURIComponent(img.dataset.name)}.${exts[i]}`;
    else img.replaceWith(placeholder(img.dataset.name));
  });
}

(async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error(res.status);
    const all = await res.json();
    const repos = featured
    .map(n => all.find(r => r.name.toLowerCase() === n.toLowerCase()))
    .filter(Boolean);
    if (!repos.length) { list.textContent = "No public projects yet. Push your first repo and it will appear here."; return; }

    list.innerHTML = repos.map(r => {
      const live = /^https?:\/\//.test(r.homepage || "") ? r.homepage : "";
      const date = new Date(r.pushed_at).toLocaleDateString("en", { month: "short", year: "numeric" });
      return `
      <article class="repo">
        <a class="shot" href="${esc(live || r.html_url)}" target="_blank" rel="noopener" aria-label="Open ${esc(r.name)}">
          <img src="screenshots/${encodeURIComponent(r.name)}.png" data-name="${esc(r.name)}" alt="Screenshot of ${esc(r.name)}" loading="lazy">
        </a>
        <div class="repo-body">
          <h3>${esc(r.name)}</h3>
          <p>${esc(r.description) || "No description yet."}</p>
          <small>${esc(r.language) || "Mixed"} &middot; Updated ${date}</small>
          <div class="links">
            <a href="${esc(r.html_url)}" target="_blank" rel="noopener">View code</a>
            ${live ? `<a href="${esc(live)}" target="_blank" rel="noopener">Live site</a>` : ""}
          </div>
        </div>
      </article>`;
    }).join("");

    list.querySelectorAll(".shot img").forEach(wireShot);
  } catch {
    list.innerHTML = `Couldn't load projects right now. <a href="https://github.com/${username}" target="_blank" rel="noopener">View them on GitHub</a>.`;
  }
})();