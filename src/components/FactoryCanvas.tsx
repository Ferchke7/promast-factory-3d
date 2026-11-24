import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import {
  FINISH_PRESETS,
  FinishPreset,
  SECTION_KEYFRAMES,
  STUDIO_HOTSPOTS,
} from '../data/factoryData';
import {
  createEpoxyFloorTexture,
  createFactoryStudioEnv,
  createWallBrandTexture,
} from '../scene/createFactoryStudioEnv';
import { buildFactoryModel, FactoryRig } from '../scene/buildFactoryModel';

export interface TelemetryData {
  camDeg: number;
  fov: number;
  liftMeters: number;
  fps: number;
}

export interface StudioControlsState {
  liftOpen: boolean;
  exploded: boolean;
  xray: boolean;
  lightsOn: boolean;
  autoRotate: boolean;
  finish: FinishPreset;
}

interface FactoryCanvasProps {
  scrollProgress: number; // Continuous 0 .. SECTION_KEYFRAMES.length - 1
  studioActive: boolean;
  studioControls: StudioControlsState;
  activeHotspotId: string | null;
  zoomSignal: { delta: number; seq: number } | null;
  resetSignal: number;
  onSelectHotspot: (id: string) => void;
  onTelemetry: (data: TelemetryData) => void;
  onReady: () => void;
}

export const FactoryCanvas: React.FC<FactoryCanvasProps> = ({
  scrollProgress,
  studioActive,
  studioControls,
  activeHotspotId,
  zoomSignal,
  resetSignal,
  onSelectHotspot,
  onTelemetry,
  onReady,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const hotspotLayerRef = useRef<HTMLDivElement>(null);
  const hotspotElRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Latest props synced to animation loop via refs (avoids tearing down WebGL context)
  const stateRef = useRef({
    scrollProgress,
    studioActive,
    studioControls,
    activeHotspotId,
  });
  stateRef.current = {
    scrollProgress,
    studioActive,
    studioControls,
    activeHotspotId,
  };

  const rigRef = useRef<FactoryRig | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraGoalRef = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
    active: boolean;
  }>({
    pos: new THREE.Vector3(...SECTION_KEYFRAMES[6].cameraPos),
    target: new THREE.Vector3(...SECTION_KEYFRAMES[6].target),
    active: false,
  });

  // Sync material finish preset dynamically
  useEffect(() => {
    rigRef.current?.applyFinish(studioControls.finish);
  }, [studioControls.finish]);

  useEffect(() => {
    rigRef.current?.setXray(studioControls.xray);
  }, [studioControls.xray]);

  useEffect(() => {
    rigRef.current?.setLights(studioControls.lightsOn);
  }, [studioControls.lightsOn]);

  // Smoothly focus camera on selected 3D hotspot in Studio section
  useEffect(() => {
    if (!studioActive || !activeHotspotId) return;
    const spot = STUDIO_HOTSPOTS.find((h) => h.id === activeHotspotId);
    if (!spot) return;
    cameraGoalRef.current = {
      pos: new THREE.Vector3(...spot.cameraOffset),
      target: new THREE.Vector3(...spot.lookAt),
      active: true,
    };
  }, [activeHotspotId, studioActive]);

  // Handle + / - zoom buttons from Studio dock
  useEffect(() => {
    if (!zoomSignal || !cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const dir = new THREE.Vector3().subVectors(cam.position, ctrl.target);
    const len = dir.length();
    const nextLen = THREE.MathUtils.clamp(len + zoomSignal.delta, 2.8, 12.5);
    dir.normalize().multiplyScalar(nextLen);
    cam.position.copy(ctrl.target).add(dir);
    cameraGoalRef.current.active = false;
  }, [zoomSignal]);

  // Handle reset view button in Studio dock
  useEffect(() => {
    if (resetSignal === 0) return;
    const keyframe = SECTION_KEYFRAMES[6];
    cameraGoalRef.current = {
      pos: new THREE.Vector3(...keyframe.cameraPos),
      target: new THREE.Vector3(...keyframe.target),
      active: true,
    };
  }, [resetSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      onReady();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040507');
    scene.fog = new THREE.FogExp2('#040507', 0.042);

    const envTexture = createFactoryStudioEnv(renderer);
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(
      SECTION_KEYFRAMES[0].fov,
      container.clientWidth / container.clientHeight,
      0.1,
      80
    );
    camera.position.set(...SECTION_KEYFRAMES[0].cameraPos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = true;
    controls.minDistance = 2.8;
    controls.maxDistance = 12.5;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.target.set(...SECTION_KEYFRAMES[0].target);
    controls.enabled = false;
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      cameraGoalRef.current.active = false;
    });

    // Studio Lighting
    const hemi = new THREE.HemisphereLight('#c7d9ff', '#090b10', 0.65);
    scene.add(hemi);

    const keySpot = new THREE.SpotLight('#fff6eb', 95, 28, Math.PI / 4, 0.48, 1.5);
    keySpot.position.set(4.5, 7.5, 6.0);
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.set(1024, 1024);
    scene.add(keySpot);

    const rimLightL = new THREE.DirectionalLight('#60a5fa', 1.45);
    rimLightL.position.set(-7, 4.5, -5);
    scene.add(rimLightL);

    const amberBounce = new THREE.PointLight('#ff6a1a', 8.5, 11);
    amberBounce.position.set(-0.4, 0.45, 0.6);
    scene.add(amberBounce);

    // Reflective dark epoxy industrial bay floor
    const floorReflector = new Reflector(new THREE.PlaneGeometry(34, 34), {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x3b404d,
    });
    floorReflector.rotation.x = -Math.PI / 2;
    floorReflector.position.y = -0.003;
    scene.add(floorReflector);

    const epoxyTex = createEpoxyFloorTexture();
    const overlayFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.MeshStandardMaterial({
        map: epoxyTex,
        transparent: true,
        opacity: 0.68,
        roughness: 0.25,
        metalness: 0.2,
      })
    );
    overlayFloor.rotation.x = -Math.PI / 2;
    overlayFloor.position.y = 0.002;
    overlayFloor.receiveShadow = true;
    scene.add(overlayFloor);

    // Vertical studio neon columns + subtle perimeter horizon bar + wall PROMAST sign
    const pillarGeo = new THREE.BoxGeometry(0.055, 6.2, 0.055);
    const pillarWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const pillarPositions: Array<[number, number]> = [
      [-6.8, -5.2],
      [-4.2, -5.8],
      [-1.5, -6.1],
      [1.5, -6.1],
      [4.5, -5.8],
      [7.2, -5.0],
      [-7.8, -2.0],
      [7.8, -2.0],
      [-7.8, 2.2],
      [7.8, 2.2],
    ];
    pillarPositions.forEach(([px, pz]) => {
      const col = new THREE.Mesh(pillarGeo, pillarWhiteMat);
      col.position.set(px, 3.1, pz);
      scene.add(col);
    });

    const horizonAmber = new THREE.Mesh(
      new THREE.RingGeometry(8.9, 8.96, 64, 1, Math.PI * 0.65, Math.PI * 1.7),
      new THREE.MeshBasicMaterial({ color: '#ff6a1a', side: THREE.DoubleSide })
    );
    horizonAmber.rotation.x = Math.PI / 2;
    horizonAmber.position.y = 0.85;
    scene.add(horizonAmber);

    const wallTex = createWallBrandTexture('PROMAST');
    const wallSign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 1.4),
      new THREE.MeshBasicMaterial({ map: wallTex, transparent: true, opacity: 0.94 })
    );
    wallSign.position.set(2.2, 2.85, -4.8);
    wallSign.rotation.y = -0.34;
    scene.add(wallSign);

    // CNC + Robot + ATC Rig
    const rig = buildFactoryModel(FINISH_PRESETS[0]);
    rigRef.current = rig;
    scene.add(rig.root);

    // Subtle pointer parallax
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Current smooth animation state
    let curLift = 0;
    let curExplode = 0;
    const camTargetPos = new THREE.Vector3(...SECTION_KEYFRAMES[0].cameraPos);
    const camTargetLook = new THREE.Vector3(...SECTION_KEYFRAMES[0].target);
    let wasStudio = false;

    const clock = new THREE.Clock();
    let frameId = 0;
    let frameCounter = 0;
    let fpsTimer = performance.now();
    let lastFps = 60;
    let readyFired = false;
    const projVec = new THREE.Vector3();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const st = stateRef.current;

      pointer.sx += (pointer.x - pointer.sx) * 0.06;
      pointer.sy += (pointer.y - pointer.sy) * 0.06;

      // Blend adjacent scroll keyframes smoothly
      const clampedScroll = THREE.MathUtils.clamp(
        st.scrollProgress,
        0,
        SECTION_KEYFRAMES.length - 1
      );
      const idxA = Math.floor(clampedScroll);
      const idxB = Math.min(idxA + 1, SECTION_KEYFRAMES.length - 1);
      const alpha = clampedScroll - idxA;
      const kfA = SECTION_KEYFRAMES[idxA];
      const kfB = SECTION_KEYFRAMES[idxB];

      const desiredLift = st.studioActive
        ? st.studioControls.liftOpen
          ? 1
          : 0
        : THREE.MathUtils.lerp(kfA.liftProgress, kfB.liftProgress, alpha);

      const desiredExplode = st.studioActive
        ? st.studioControls.exploded
          ? 1
          : 0
        : THREE.MathUtils.lerp(kfA.explodeProgress, kfB.explodeProgress, alpha);

      const desiredLaser = st.studioActive ? st.studioControls.lightsOn : kfA.laserScan || (alpha > 0.35 && kfB.laserScan);
      const desiredRpm = THREE.MathUtils.lerp(kfA.spindleRpm, kfB.spindleRpm, alpha);

      curLift = THREE.MathUtils.lerp(curLift, desiredLift, 0.08);
      curExplode = THREE.MathUtils.lerp(curExplode, desiredExplode, 0.08);

      rig.updateAnimation({
        elapsed,
        liftProgress: curLift,
        explodeProgress: curExplode,
        laserActive: desiredLaser,
        spindleRpmScale: desiredRpm,
      });

      if (st.studioActive) {
        if (!wasStudio) {
          controls.enabled = true;
          wasStudio = true;
        }
        controls.autoRotate = st.studioControls.autoRotate && !cameraGoalRef.current.active;
        controls.autoRotateSpeed = 1.4;

        if (cameraGoalRef.current.active) {
          camera.position.lerp(cameraGoalRef.current.pos, 0.08);
          controls.target.lerp(cameraGoalRef.current.target, 0.08);
          if (camera.position.distanceTo(cameraGoalRef.current.pos) < 0.04) {
            cameraGoalRef.current.active = false;
          }
        }
        controls.update();
      } else {
        if (wasStudio) {
          controls.enabled = false;
          wasStudio = false;
          cameraGoalRef.current.active = false;
        }
        camTargetPos.set(
          THREE.MathUtils.lerp(kfA.cameraPos[0], kfB.cameraPos[0], alpha) + pointer.sx * 0.22,
          THREE.MathUtils.lerp(kfA.cameraPos[1], kfB.cameraPos[1], alpha) + pointer.sy * 0.12,
          THREE.MathUtils.lerp(kfA.cameraPos[2], kfB.cameraPos[2], alpha)
        );
        camTargetLook.set(
          THREE.MathUtils.lerp(kfA.target[0], kfB.target[0], alpha),
          THREE.MathUtils.lerp(kfA.target[1], kfB.target[1], alpha),
          THREE.MathUtils.lerp(kfA.target[2], kfB.target[2], alpha)
        );
        camera.position.lerp(camTargetPos, Math.min(1, dt * 4.8));
        controls.target.lerp(camTargetLook, Math.min(1, dt * 4.8));

        const targetFov = THREE.MathUtils.lerp(kfA.fov, kfB.fov, alpha);
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
          camera.updateProjectionMatrix();
        }
        camera.lookAt(controls.target);
      }

      // Project interactive 3D hotspots to screen coordinates cleanly via direct transform
      if (hotspotLayerRef.current) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        STUDIO_HOTSPOTS.forEach((spot) => {
          const el = hotspotElRefs.current[spot.id];
          if (!el) return;
          if (!st.studioActive) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
          projVec.set(...spot.position);
          projVec.project(camera);
          const inFront = projVec.z < 1;
          const sx = (projVec.x * 0.5 + 0.5) * w;
          const sy = (-projVec.y * 0.5 + 0.5) * h;
          if (!inFront || sx < 20 || sx > w - 20 || sy < 70 || sy > h - 90) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          } else {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%)`;
          }
        });
      }

      renderer.render(scene, camera);
      if (!readyFired) {
        readyFired = true;
        onReady();
      }

      frameCounter += 1;
      const now = performance.now();
      if (now - fpsTimer >= 420) {
        lastFps = Math.round((frameCounter * 1000) / (now - fpsTimer));
        frameCounter = 0;
        fpsTimer = now;
        const dx = camera.position.x - controls.target.x;
        const dz = camera.position.z - controls.target.z;
        let deg = Math.round((Math.atan2(dx, dz) * 180) / Math.PI);
        if (deg < 0) deg += 360;
        onTelemetry({
          camDeg: deg,
          fov: Math.round(camera.fov),
          liftMeters: Number((curLift * 0.42).toFixed(2)),
          fps: lastFps,
        });
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      envTexture.dispose();
      epoxyTex.dispose();
      wallTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onReady, onTelemetry]);

  return (
    <div className="factory-canvas-shell">
      <div
        ref={mountRef}
        className={`factory-webgl-mount ${studioActive ? 'is-interactive' : ''}`}
      />
      <div ref={hotspotLayerRef} className="factory-hotspot-layer">
        {STUDIO_HOTSPOTS.map((spot) => {
          const isActive = activeHotspotId === spot.id;
          return (
            <button
              key={spot.id}
              ref={(el) => {
                hotspotElRefs.current[spot.id] = el;
              }}
              type="button"
              className={`hotspot-pin ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectHotspot(spot.id)}
              aria-label={spot.title}
            >
              <span className="hotspot-ring" />
              <span className="hotspot-dot" />
              <span className="hotspot-pill">
                <span className="hotspot-num">{spot.index}</span>
                {spot.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
