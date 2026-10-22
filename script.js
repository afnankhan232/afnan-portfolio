import * as THREE from 'three';

document.addEventListener("DOMContentLoaded", () => {
  const canvases = document.querySelectorAll('#threeCanvas, .landing-globe-canvas');
  if (!canvases.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const globePalettes = {
    ember: {
      dark: { ambient: 0x8bcacb, key: 0x4de6d2, rim: 0xf58764, surface: 0x0a2835, emissive: 0x062d32, grid: 0x46d9cf, atmosphere: 0x33d6ca, orbit: [0x3dd8c8, 0xf39a68], route: [0x4be1d0, 0xf39a68], node: [0xa6fff2, 0xffbd83] },
      light: { ambient: 0xd5f1f0, key: 0xffb06f, rim: 0xdd657d, surface: 0x124f5c, emissive: 0x1a5f63, grid: 0x9df6df, atmosphere: 0x69e8cb, orbit: [0xf08b68, 0x6d9de6], route: [0xee8261, 0x2faaa5], node: [0xffd27f, 0xf9ae98] },
    },
    ocean: {
      dark: { ambient: 0xa5e7ee, key: 0x35cad9, rim: 0x8f9dff, surface: 0x082c42, emissive: 0x103958, grid: 0x55cfe8, atmosphere: 0x3289df, orbit: [0x2bd6d0, 0x7d9fff], route: [0x3bd3e5, 0x89a8ff], node: [0x9beeff, 0xffc17b] },
      light: { ambient: 0xcaf6ed, key: 0xffb36b, rim: 0x78aaf0, surface: 0x176674, emissive: 0x1c7276, grid: 0xa3ffdf, atmosphere: 0x7de7d9, orbit: [0x31b8ba, 0x6e9feb], route: [0x28adaf, 0x6b94d6], node: [0xffc875, 0xa9efff] },
    },
    forest: {
      dark: { ambient: 0xb3d894, key: 0x9ad574, rim: 0xe9a36d, surface: 0x193a2d, emissive: 0x183e2a, grid: 0x9edb79, atmosphere: 0x7dbe69, orbit: [0x8fc86a, 0xe99b63], route: [0x90cf6b, 0xe99b63], node: [0xc9f29d, 0xffbf86] },
      light: { ambient: 0xd8efc3, key: 0xffad68, rim: 0xc87558, surface: 0x4f8057, emissive: 0x3d6d46, grid: 0xd3f0a6, atmosphere: 0xaedc82, orbit: [0x6aab66, 0xe38e5d], route: [0x5d9e58, 0xd98459], node: [0xd4f4a2, 0xffc68a] },
    },
  };

  canvases.forEach((canvas) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42,
    canvas.clientWidth / Math.max(canvas.clientHeight, 1),
    0.1,
    1000
  );
  camera.position.set(0, 0, 4.8);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);
  const ambientLight = new THREE.AmbientLight(0x8bcacb, 1.15);
  scene.add(ambientLight);

  const keyLight = new THREE.PointLight(0x4de6d2, 32, 10);
  keyLight.position.set(3, 2, 4);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xf58764, 19, 9);
  rimLight.position.set(-3, -1, -2);
  scene.add(rimLight);

  const radius = 1.27;
  const globeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a2835,
    metalness: 0.48,
    roughness: 0.48,
    clearcoat: 0.7,
    clearcoatRoughness: 0.35,
    emissive: 0x062d32,
    emissiveIntensity: 0.65,
  });
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 72, 72),
    globeMaterial
  );
  globeGroup.add(globe);

  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x46d9cf,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });
  const grid = new THREE.Mesh(
    new THREE.SphereGeometry(radius + 0.008, 36, 24),
    gridMaterial
  );
  globeGroup.add(grid);

  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x33d6ca,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.11,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius + 0.09, 48, 48),
    atmosphereMaterial
  );
  globeGroup.add(atmosphere);

  const orbitMaterials = [0x3dd8c8, 0xf39a68].map((color) => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.44,
  }));
  const orbitOne = new THREE.Mesh(new THREE.TorusGeometry(1.66, 0.006, 8, 180), orbitMaterials[0]);
  orbitOne.rotation.set(1.12, 0.28, -0.22);
  globeGroup.add(orbitOne);
  const orbitTwo = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.004, 8, 180), orbitMaterials[1]);
  orbitTwo.rotation.set(0.45, -0.72, 0.9);
  globeGroup.add(orbitTwo);

  const routes = [
    [[-38, 12], [42, 18]],
    [[-8, 52], [104, 8]],
    [[132, 34], [-76, -22]],
    [[20, -42], [-112, 36]],
    [[-148, -8], [76, -38]],
  ];
  const signals = [];
  const routeMaterials = [];
  const signalMaterials = [];
  const toGlobePoint = (longitude, latitude, distance) => {
    const lon = THREE.MathUtils.degToRad(longitude);
    const lat = THREE.MathUtils.degToRad(latitude);
    return new THREE.Vector3(
      -distance * Math.cos(lat) * Math.sin(lon),
      distance * Math.sin(lat),
      distance * Math.cos(lat) * Math.cos(lon)
    );
  };

  routes.forEach((route, index) => {
    const start = toGlobePoint(route[0][0], route[0][1], radius + 0.015);
    const end = toGlobePoint(route[1][0], route[1][1], radius + 0.015);
    const control = start.clone().add(end).normalize().multiplyScalar(radius + 0.4 + (index % 2) * 0.12);
    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const routeMaterial = new THREE.MeshBasicMaterial({
      color: index % 2 ? 0xf39a68 : 0x4be1d0,
      transparent: true,
      opacity: 0.58,
    });
    const routeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.006, 5, false),
      routeMaterial
    );
    globeGroup.add(routeMesh);
    routeMaterials.push(routeMaterial);

    const signalMaterial = new THREE.MeshBasicMaterial({ color: index % 2 ? 0xffbd83 : 0xa6fff2 });
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.033, 12, 12),
      signalMaterial
    );
    const startNode = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 10), signalMaterial);
    const endNode = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 10), signalMaterial);
    startNode.position.copy(start);
    endNode.position.copy(end);
    globeGroup.add(startNode, endNode, node);
    signalMaterials.push(signalMaterial);
    signals.push({ curve, node, offset: index / routes.length });
  });

  let activeTheme = '';
  function applyGlobeTheme() {
    const mode = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    const selectedPalette = globePalettes[document.body.dataset.colorTheme] ? document.body.dataset.colorTheme : 'ember';
    const themeKey = `${selectedPalette}-${mode}`;
    if (themeKey === activeTheme) return;
    activeTheme = themeKey;
    const colors = globePalettes[selectedPalette][mode];
    ambientLight.color.setHex(colors.ambient);
    keyLight.color.setHex(colors.key);
    rimLight.color.setHex(colors.rim);
    globeMaterial.color.setHex(colors.surface);
    globeMaterial.emissive.setHex(colors.emissive);
    gridMaterial.color.setHex(colors.grid);
    atmosphereMaterial.color.setHex(colors.atmosphere);
    orbitMaterials.forEach((material, index) => material.color.setHex(colors.orbit[index]));
    routeMaterials.forEach((material, index) => material.color.setHex(colors.route[index % 2]));
    signalMaterials.forEach((material, index) => material.color.setHex(colors.node[index % 2]));
    gridMaterial.opacity = mode === 'light' ? 0.3 : 0.2;
    atmosphereMaterial.opacity = mode === 'light' ? 0.16 : 0.11;
  }

  applyGlobeTheme();
  const themeObserver = new MutationObserver(applyGlobeTheme);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-color-theme'] });

  const resize = () => {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  let pointerX = 0;
  let pointerY = 0;
  canvas.addEventListener('pointermove', (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.35;
    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.2;
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    if (!reducedMotion) {
      globeGroup.rotation.y += 0.0018;
      globeGroup.rotation.x += (pointerY - globeGroup.rotation.x) * 0.018;
      globeGroup.rotation.z += (pointerX - globeGroup.rotation.z) * 0.018;
      orbitOne.rotation.z += 0.0007;
      orbitTwo.rotation.y -= 0.0005;
    }
    signals.forEach(({ curve, node, offset }) => {
      const progress = reducedMotion ? 0.5 : (elapsed * 0.075 + offset) % 1;
      node.position.copy(curve.getPointAt(progress));
    });
    renderer.render(scene, camera);
  }

  animate();
  window.addEventListener('pagehide', () => {
    resizeObserver.disconnect();
    themeObserver.disconnect();
  }, { once: true });
  });
});