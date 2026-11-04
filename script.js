const username = "Auro-lab";

/* 1. Name: letters drop in once on load */
const nameEl = document.getElementById("name");
nameEl.innerHTML = [...nameEl.textContent]
  .map((c, i) => `<span style="animation-delay:${i * 70}ms" aria-hidden="true">${c}</span>`)
  .join("");

/* 2. 3D scene */
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
    new THREE.IcosahedronGeometry(1.5, 40),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float uTime;
        varying vec3 vN; varying vec3 vPos; varying float vD;
        float n(vec3 p){ return sin(p.x*2.1+uTime)*sin(p.y*2.3+uTime*1.2)*sin(p.z*2.7-uTime*.8); }
        void main(){
          float d = n(position*1.4)*.3 + n(position*3.1)*.08;
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
          vec3 base = mix(vec3(.14,.22,1.), vec3(.79,.82,1.), smoothstep(-.3,.3,vD));
          vec3 col = mix(base, vec3(1.,.42,.24), f) + f*.35;
          gl_FragColor = vec4(col, 1.);
        }`
    })
  );
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.15, 1),
    new THREE.MeshBasicMaterial({ color: 0xc9d0ff, wireframe: true, transparent: true, opacity: 0.22 })
  );
  group.add(orb, cage);

  const count = 1400, pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3.5 + Math.random() * 6, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r * Math.sin(b) * Math.cos(a);
    pos[i*3+1] = r * Math.sin(b) * Math.sin(a);
    pos[i*3+2] = r * Math.cos(b);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf5f7ff, size: 0.03, transparent: true, opacity: 0.75 }));
  scene.add(points);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 800;
    group.position.set(wide ? 2.3 : 0, wide ? 0.4 : 1.5, 0);
    group.scale.setScalar(wide ? 1 : 0.75);
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
    group.rotation.y = cur.x * 1.2 + scrollY * 0.002 + t * 0.12;
    group.rotation.x = cur.y * 0.8;
    cage.rotation.y = -t * 0.18;
    points.rotation.y = t * 0.02 + scrollY * 0.0004;
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

/* 3. Projects from GitHub, with 3D tilt */
const list = document.getElementById("repo-list");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

list.addEventListener("pointermove", e => {
  const c = e.target.closest(".repo");
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 14 + "deg");
  c.style.setProperty("--rx", -((e.clientY - r.top) / r.height - 0.5) * 14 + "deg");
});
list.addEventListener("pointerout", e => {
  const c = e.target.closest(".repo");
  if (c) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); }
});

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