import * as THREE from 'three';

/**
 * Generates an HDR-like studio reflection environment using PMREMGenerator
 * with vertical neon light strips and overhead honeycomb ceiling diffusers.
 * Ensures realistic specular highlights on CNC steel, glass, and anodized shells.
 */
export function createFactoryStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#040507');

  // Vertical neon studio pillars for sharp side reflections
  const stripMatWhite = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f4f7ff').multiplyScalar(4.2) });
  const stripMatAmber = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a1a').multiplyScalar(3.4) });
  const stripMatCool = new THREE.MeshBasicMaterial({ color: new THREE.Color('#7dd3fc').multiplyScalar(2.4) });

  const stripGeo = new THREE.PlaneGeometry(0.45, 9.0);
  const angles = [-2.5, -1.9, -1.25, -0.55, 0.55, 1.25, 1.9, 2.5];
  angles.forEach((angle, i) => {
    const strip = new THREE.Mesh(stripGeo, i % 3 === 1 ? stripMatCool : stripMatWhite);
    const radius = 10;
    strip.position.set(Math.sin(angle) * radius, 4.2, Math.cos(angle) * radius);
    strip.lookAt(0, 4.2, 0);
    envScene.add(strip);
  });

  // Overhead hexagon / bay luminaire grid for top reflections on CNC roof & spindle hood
  const ceilGeo = new THREE.RingGeometry(1.1, 1.38, 6);
  const ceilOffsets: Array<[number, number]> = [
    [-2.4, -1.5],
    [0, -1.5],
    [2.4, -1.5],
    [-1.2, 1.2],
    [1.2, 1.2],
  ];
  ceilOffsets.forEach(([x, z]) => {
    const ring = new THREE.Mesh(ceilGeo, stripMatWhite);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 7.6, z);
    envScene.add(ring);
  });

  // Low perimeter amber bounce strips matching the floor LED frame
  const floorGlowGeo = new THREE.PlaneGeometry(6.5, 0.25);
  const frontAmber = new THREE.Mesh(floorGlowGeo, stripMatAmber);
  frontAmber.rotation.x = -Math.PI / 2;
  frontAmber.position.set(0, 0.1, 3.6);
  envScene.add(frontAmber);

  const rearAmber = new THREE.Mesh(floorGlowGeo, stripMatAmber);
  rearAmber.rotation.x = -Math.PI / 2;
  rearAmber.position.set(0, 0.1, -3.6);
  envScene.add(rearAmber);

  const renderTarget = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return renderTarget.texture;
}

/**
 * Generates a crisp canvas texture for the dark epoxy workshop floor
 * with expansion joints and safety yellow perimeter bay lines.
 */
export function createEpoxyFloorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090a0d';
  ctx.fillRect(0, 0, size, size);

  // Subtle concrete micro-grain & tile seams
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 2;
  const step = 128;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Subtle painted safety bay rectangle near the central cell
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.72)';
  ctx.lineWidth = 5;
  ctx.strokeRect(200, 230, 624, 564);

  ctx.setLineDash([22, 16]);
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(172, 202, 680, 620);
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an illuminated back-wall sign canvas for the studio backdrop ("PROMAST").
 */
export function createWallBrandTexture(brand = 'PROMAST'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle backlight aura
  const grad = ctx.createRadialGradient(512, 128, 30, 512, 128, 440);
  grad.addColorStop(0, 'rgba(255, 85, 0, 0.14)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 132px "Unbounded", "Inter", system-ui, sans-serif';

  ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#e8edf7';
  ctx.fillText(brand, 512, 118);

  ctx.shadowBlur = 0;
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ff6a1a';
  ctx.fillText('ЗАВОД ЧПУ · ИНДУСТРИЯ 4.0', 512, 202);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
