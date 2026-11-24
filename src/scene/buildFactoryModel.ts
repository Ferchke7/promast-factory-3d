import * as THREE from 'three';
import { FinishPreset } from '../data/factoryData';

export interface ExplodablePart {
  object: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeOffset: THREE.Vector3;
}

export interface FactoryRig {
  root: THREE.Group;
  cncShellMaterials: THREE.MeshPhysicalMaterial[];
  xrayTargets: Array<{ mesh: THREE.Mesh; solidMat: THREE.Material; xrayMat: THREE.Material }>;
  explodables: ExplodablePart[];
  frontDoors: [THREE.Object3D, THREE.Object3D];
  topCanopy: THREE.Object3D;
  spindleShaft: THREE.Object3D;
  trunnionCradle: THREE.Object3D;
  workpiece: THREE.Object3D;
  atcWheel: THREE.Object3D;
  robotShoulder: THREE.Object3D;
  robotUpperArm: THREE.Object3D;
  robotForearm: THREE.Object3D;
  chamberLights: THREE.PointLight[];
  laserPlane: THREE.Mesh;
  laserBeamMat: THREE.MeshBasicMaterial;
  floorAccentMat: THREE.MeshBasicMaterial;
  applyFinish: (preset: FinishPreset) => void;
  setXray: (enabled: boolean) => void;
  setLights: (enabled: boolean) => void;
  updateAnimation: (opts: {
    elapsed: number;
    liftProgress: number;
    explodeProgress: number;
    laserActive: boolean;
    spindleRpmScale: number;
  }) => void;
}

function registerExplodable(
  list: ExplodablePart[],
  object: THREE.Object3D,
  dx: number,
  dy: number,
  dz: number
): void {
  list.push({
    object,
    basePos: object.position.clone(),
    explodeOffset: new THREE.Vector3(dx, dy, dz),
  });
}

/**
 * Constructs a detailed procedural 5-axis CNC machining cell + 6-axis industrial robot
 * loader + 24-tool ATC carousel + digital Siemens-style HMI console inside a glowing studio bay.
 */
export function buildFactoryModel(initialFinish: FinishPreset): FactoryRig {
  const root = new THREE.Group();
  const cncShellMaterials: THREE.MeshPhysicalMaterial[] = [];
  const xrayTargets: Array<{ mesh: THREE.Mesh; solidMat: THREE.Material; xrayMat: THREE.Material }> = [];
  const explodables: ExplodablePart[] = [];
  const chamberLights: THREE.PointLight[] = [];

  // Shared materials
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialFinish.hex),
    metalness: initialFinish.metalness,
    roughness: initialFinish.roughness,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  });
  cncShellMaterials.push(shellMat);

  const darkCastIronMat = new THREE.MeshStandardMaterial({
    color: '#17191f',
    metalness: 0.76,
    roughness: 0.42,
  });

  const machinedSteelMat = new THREE.MeshStandardMaterial({
    color: '#c9d1dd',
    metalness: 0.94,
    roughness: 0.18,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: '#b5becb',
    metalness: 0.96,
    roughness: 0.14,
  });

  const orangeAccentMat = new THREE.MeshStandardMaterial({
    color: '#ff5500',
    emissive: new THREE.Color('#ff3d00'),
    emissiveIntensity: 0.42,
    metalness: 0.35,
    roughness: 0.28,
  });

  const temperedGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#9ec5ff',
    metalness: 0.05,
    roughness: 0.08,
    transmission: 0.76,
    transparent: true,
    opacity: 0.42,
    ior: 1.5,
  });

  const xrayWireMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.32,
  });

  const trackXray = (mesh: THREE.Mesh) => {
    xrayTargets.push({ mesh, solidMat: mesh.material as THREE.Material, xrayMat: xrayWireMat });
  };

  // --- FLOOR AMBER LED PERIMETER FRAME (matching CHARGERS glow under the chassis) ---
  const floorAccentMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ff7315').multiplyScalar(2.4),
  });
  const ledStripFrame = new THREE.Group();
  const barFB = new THREE.BoxGeometry(5.6, 0.025, 0.045);
  const barLR = new THREE.BoxGeometry(0.045, 0.025, 3.6);
  const fBar = new THREE.Mesh(barFB, floorAccentMat);
  fBar.position.set(-0.35, 0.015, 1.82);
  const bBar = new THREE.Mesh(barFB, floorAccentMat);
  bBar.position.set(-0.35, 0.015, -1.82);
  const lBar = new THREE.Mesh(barLR, floorAccentMat);
  lBar.position.set(-3.15, 0.015, 0);
  const rBar = new THREE.Mesh(barLR, floorAccentMat);
  rBar.position.set(2.45, 0.015, 0);
  ledStripFrame.add(fBar, bBar, lBar, rBar);
  root.add(ledStripFrame);

  // =========================================================================
  // 1. 5-AXIS CNC MACHINING CENTER (centered at x = 0.2)
  // =========================================================================
  const cncCell = new THREE.Group();
  cncCell.position.set(0.2, 0, 0);
  root.add(cncCell);

  // Heavy cast-iron machine bed & leveling vibration mounts
  const baseBed = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.48, 2.25), darkCastIronMat);
  baseBed.position.set(0, 0.3, 0);
  baseBed.castShadow = true;
  baseBed.receiveShadow = true;
  cncCell.add(baseBed);

  const footGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.1, 16);
  [
    [-1.18, -0.92],
    [1.18, -0.92],
    [-1.18, 0.92],
    [1.18, 0.92],
  ].forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(footGeo, orangeAccentMat);
    foot.position.set(fx, 0.05, fz);
    cncCell.add(foot);
  });

  // Lower front apron & rear armored shell (painted finish + X-ray toggleable)
  const lowerApron = new THREE.Mesh(new THREE.BoxGeometry(2.78, 0.56, 0.18), shellMat);
  lowerApron.position.set(0, 0.65, 1.06);
  cncCell.add(lowerApron);
  trackXray(lowerApron);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.78, 2.38, 0.32), shellMat);
  backWall.position.set(0, 1.56, -0.98);
  cncCell.add(backWall);
  trackXray(backWall);

  // Rear CNC Electrical Cabinet, Cooling Radiator Grille & Hydraulic Manifold (for 360° & #booking rear view)
  const rearCabLeft = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.72, 0.08), darkCastIronMat);
  rearCabLeft.position.set(-0.66, 1.48, -1.16);
  const rearCabRight = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.72, 0.08), darkCastIronMat);
  rearCabRight.position.set(0.66, 1.48, -1.16);
  const rearTopVent = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.24, 0.09), machinedSteelMat);
  rearTopVent.position.set(0, 2.52, -1.16);
  const rearStrip = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.05, 0.1), orangeAccentMat);
  rearStrip.position.set(0, 0.56, -1.16);
  const chillUnit = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.28), darkCastIronMat);
  chillUnit.position.set(0, 0.96, -1.28);
  const chillFan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20), titaniumMat);
  chillFan.rotation.x = Math.PI / 2;
  chillFan.position.set(0, 1.02, -1.43);
  const hvBadge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.03), orangeAccentMat);
  hvBadge.position.set(-0.66, 1.82, -1.21);
  cncCell.add(rearCabLeft, rearCabRight, rearTopVent, rearStrip, chillUnit, chillFan, hvBadge);

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.38, 2.26), shellMat);
  leftPillar.position.set(-1.24, 1.56, 0);
  cncCell.add(leftPillar);
  trackXray(leftPillar);

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.38, 2.26), shellMat);
  rightPillar.position.set(1.24, 1.56, 0);
  cncCell.add(rightPillar);
  trackXray(rightPillar);

  // Orange industrial stripe accent on pillars
  const stripeGeo = new THREE.BoxGeometry(0.04, 1.7, 0.08);
  const leftStripe = new THREE.Mesh(stripeGeo, orangeAccentMat);
  leftStripe.position.set(-1.39, 1.65, 0.85);
  const rightStripe = new THREE.Mesh(stripeGeo, orangeAccentMat);
  rightStripe.position.set(1.39, 1.65, 0.85);
  cncCell.add(leftStripe, rightStripe);

  // Top canopy (lifts up when hood/lift toggle is active!)
  const topCanopy = new THREE.Group();
  const roofBlock = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.34, 2.32), shellMat);
  roofBlock.position.set(0, 2.86, 0);
  topCanopy.add(roofBlock);
  trackXray(roofBlock);

  const beaconGlow = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.055, 0.08),
    new THREE.MeshBasicMaterial({ color: '#ff5500' })
  );
  beaconGlow.position.set(0, 3.05, 1.08);
  topCanopy.add(beaconGlow);
  cncCell.add(topCanopy);
  registerExplodable(explodables, topCanopy, 0, 0.95, 0);

  // Front sliding safety glass doors (part smoothly when liftProgress > 0)
  const makeDoor = (xOffset: number) => {
    const door = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.68, 0.03), temperedGlassMat);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.07, 0.05), darkCastIronMat);
    frameTop.position.y = 0.85;
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.07, 0.05), darkCastIronMat);
    frameBot.position.y = -0.85;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.07), orangeAccentMat);
    handle.position.set(xOffset > 0 ? -0.44 : 0.44, 0, 0.03);
    door.add(glass, frameTop, frameBot, handle);
    door.position.set(xOffset, 1.82, 1.05);
    return door;
  };
  const doorLeft = makeDoor(-0.54);
  const doorRight = makeDoor(0.54);
  cncCell.add(doorLeft, doorRight);
  registerExplodable(explodables, doorLeft, -0.5, 0, 0.85);
  registerExplodable(explodables, doorRight, 0.5, 0, 0.85);

  // Internal linear guideways & Y/X axis gantry bridge
  const railGeo = new THREE.BoxGeometry(2.05, 0.09, 0.09);
  const rail1 = new THREE.Mesh(railGeo, machinedSteelMat);
  rail1.position.set(0, 2.38, -0.35);
  const rail2 = new THREE.Mesh(railGeo, machinedSteelMat);
  rail2.position.set(0, 2.38, 0.35);
  cncCell.add(rail1, rail2);

  // High-speed 24,000 RPM HSK-A63 Spindle Unit
  const spindleHead = new THREE.Group();
  spindleHead.position.set(-0.05, 2.24, 0.08);
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.58), darkCastIronMat);
  saddle.position.y = 0.16;
  const motorHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.54, 24), machinedSteelMat);
  motorHousing.position.y = -0.18;
  const coolingFins = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.18, 24), orangeAccentMat);
  coolingFins.position.y = -0.1;

  const spindleShaft = new THREE.Group();
  spindleShaft.position.y = -0.48;
  const collet = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.14, 20), titaniumMat);
  const flute = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.26, 12), titaniumMat);
  flute.position.y = -0.18;
  // Crossbar indicator so rotation at idle/high speed is visibly legible
  const nutFlats = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.06), orangeAccentMat);
  nutFlats.position.y = -0.02;
  spindleShaft.add(collet, flute, nutFlats);

  spindleHead.add(saddle, motorHousing, coolingFins, spindleShaft);
  cncCell.add(spindleHead);
  registerExplodable(explodables, spindleHead, 0, 0.85, 0.55);

  // 5-Axis Trunnion Rotary Cradle + Workpiece (Machined Aerospace Impeller/Gear)
  const trunnionGroup = new THREE.Group();
  trunnionGroup.position.set(-0.05, 1.15, 0.08);
  const basePlate = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.12, 1.12), darkCastIronMat);
  basePlate.position.y = -0.34;
  const sideTrunnionL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.46), darkCastIronMat);
  sideTrunnionL.position.set(-0.62, -0.06, 0);
  const sideTrunnionR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.46), darkCastIronMat);
  sideTrunnionR.position.set(0.62, -0.06, 0);
  const rotaryDriveCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24), orangeAccentMat);
  rotaryDriveCap.rotation.z = Math.PI / 2;
  rotaryDriveCap.position.set(0.75, 0.02, 0);

  const trunnionCradle = new THREE.Group();
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.14, 32), machinedSteelMat);
  platter.position.y = -0.04;
  const chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.11, 6), darkCastIronMat);
  chuck.position.y = 0.08;

  // Precision machined titanium turbine impeller / gear billet
  const workpiece = new THREE.Group();
  workpiece.position.y = 0.24;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.22, 24), titaniumMat);
  workpiece.add(hub);
  const bladeGeo = new THREE.BoxGeometry(0.36, 0.14, 0.025);
  for (let i = 0; i < 8; i++) {
    const blade = new THREE.Mesh(bladeGeo, titaniumMat);
    const angle = (i / 8) * Math.PI * 2;
    blade.rotation.y = angle;
    blade.rotation.x = 0.28;
    blade.position.y = -0.01;
    workpiece.add(blade);
  }
  const crownBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), orangeAccentMat);
  crownBolt.position.y = 0.12;
  workpiece.add(crownBolt);

  trunnionCradle.add(platter, chuck, workpiece);
  trunnionGroup.add(basePlate, sideTrunnionL, sideTrunnionR, rotaryDriveCap, trunnionCradle);
  cncCell.add(trunnionGroup);
  registerExplodable(explodables, trunnionGroup, 0, -0.15, 0.72);

  // 24-Tool ATC Carousel Magazine inside upper right
  const atcGroup = new THREE.Group();
  atcGroup.position.set(0.95, 2.38, -0.35);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24), darkCastIronMat);
  const atcWheel = new THREE.Group();
  atcWheel.add(drum);
  const toolGeo = new THREE.CylinderGeometry(0.028, 0.016, 0.22, 10);
  for (let i = 0; i < 12; i++) {
    const tool = new THREE.Mesh(toolGeo, i % 3 === 0 ? orangeAccentMat : titaniumMat);
    const angle = (i / 12) * Math.PI * 2;
    tool.position.set(Math.cos(angle) * 0.31, -0.14, Math.sin(angle) * 0.31);
    atcWheel.add(tool);
  }
  atcWheel.rotation.x = Math.PI / 6;
  atcGroup.add(atcWheel);
  cncCell.add(atcGroup);
  registerExplodable(explodables, atcGroup, 0.95, 0.55, -0.45);

  // Interior work chamber lights + glowing laser inspection scan plane
  const workLightL = new THREE.PointLight('#e2edff', 4.5, 4.5);
  workLightL.position.set(-0.6, 2.55, 0.35);
  const workLightR = new THREE.PointLight('#ff8a3d', 3.2, 4.0);
  workLightR.position.set(0.6, 2.35, 0.35);
  chamberLights.push(workLightL, workLightR);
  cncCell.add(workLightL, workLightR);

  const laserBeamMat = new THREE.MeshBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const laserPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.045), laserBeamMat);
  laserPlane.rotation.x = Math.PI / 2;
  laserPlane.position.set(-0.05, 1.5, 0.08);
  cncCell.add(laserPlane);

  // =========================================================================
  // 2. SIEMENS-STYLE CNC HMI OPERATOR CONSOLE (Right Side)
  // =========================================================================
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(1.72, 0, 0.72);
  consoleGroup.rotation.y = -0.35;

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.55, 0.28), darkCastIronMat);
  pedestal.position.y = 0.78;
  const screenBox = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.54, 0.1), shellMat);
  screenBox.position.set(0, 1.68, 0.08);
  trackXray(screenBox);

  const screenGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.36),
    new THREE.MeshBasicMaterial({ color: '#0ea5e9' })
  );
  screenGlass.position.set(0, 1.73, 0.135);

  const eStopBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16), orangeAccentMat);
  eStopBtn.rotation.x = Math.PI / 2;
  eStopBtn.position.set(0.22, 1.48, 0.15);

  consoleGroup.add(pedestal, screenBox, screenGlass, eStopBtn);
  root.add(consoleGroup);
  registerExplodable(explodables, consoleGroup, 0.85, 0, 0.45);

  // =========================================================================
  // 3. 6-AXIS INDUSTRIAL ROBOTIC ARM LOADER + PALLET STATION (Left-Front Zone)
  // =========================================================================
  const robotGroup = new THREE.Group();
  robotGroup.position.set(-2.38, 0, 0.72);
  root.add(robotGroup);

  const robotPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.44, 24), darkCastIronMat);
  robotPlinth.position.y = 0.22;
  robotGroup.add(robotPlinth);

  const robotShoulder = new THREE.Group();
  robotShoulder.position.y = 0.48;
  robotGroup.add(robotShoulder);

  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.42, 20), shellMat);
  turret.position.y = 0.2;
  trackXray(turret);
  const servoJoint1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.52, 20), darkCastIronMat);
  servoJoint1.rotation.z = Math.PI / 2;
  servoJoint1.position.y = 0.42;
  const jointCap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.56, 20), orangeAccentMat);
  jointCap1.rotation.z = Math.PI / 2;
  jointCap1.position.y = 0.42;
  robotShoulder.add(turret, servoJoint1, jointCap1);

  const robotUpperArm = new THREE.Group();
  robotUpperArm.position.y = 0.42;
  robotShoulder.add(robotUpperArm);

  const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.24), shellMat);
  upperBeam.position.y = 0.56;
  trackXray(upperBeam);
  robotUpperArm.add(upperBeam);

  const elbowJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 20), orangeAccentMat);
  elbowJoint.rotation.z = Math.PI / 2;
  elbowJoint.position.y = 1.14;
  robotUpperArm.add(elbowJoint);

  const robotForearm = new THREE.Group();
  robotForearm.position.y = 1.14;
  robotUpperArm.add(robotForearm);

  const forearmTube = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.96, 0.18), machinedSteelMat);
  forearmTube.rotation.z = -Math.PI / 2;
  forearmTube.position.set(0.46, 0, 0);
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.22, 16), darkCastIronMat);
  wrist.rotation.z = -Math.PI / 2;
  wrist.position.set(1.0, 0, 0);
  const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.22), orangeAccentMat);
  gripperBase.position.set(1.13, 0, 0);
  const jaw1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.06), titaniumMat);
  jaw1.position.set(1.25, 0.12, 0);
  const jaw2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.06), titaniumMat);
  jaw2.position.set(1.25, -0.12, 0);
  robotForearm.add(forearmTube, wrist, gripperBase, jaw1, jaw2);
  registerExplodable(explodables, robotGroup, -0.85, 0.2, 0.35);

  // Raw billet input pallet table in front-left of robot
  const palletTable = new THREE.Group();
  palletTable.position.set(-2.15, 0, 1.98);
  const tableStand = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.72, 0.62), darkCastIronMat);
  tableStand.position.y = 0.36;
  palletTable.add(tableStand);
  const billetGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16);
  [-0.25, 0, 0.25].forEach((bx) => {
    [-0.14, 0.14].forEach((bz) => {
      const billet = new THREE.Mesh(billetGeo, titaniumMat);
      billet.position.set(bx, 0.79, bz);
      palletTable.add(billet);
    });
  });
  root.add(palletTable);
  registerExplodable(explodables, palletTable, -0.6, 0, 0.75);

  return {
    root,
    cncShellMaterials,
    xrayTargets,
    explodables,
    frontDoors: [doorLeft, doorRight],
    topCanopy,
    spindleShaft,
    trunnionCradle,
    workpiece,
    atcWheel,
    robotShoulder,
    robotUpperArm,
    robotForearm,
    chamberLights,
    laserPlane,
    laserBeamMat,
    floorAccentMat,
    applyFinish: (preset: FinishPreset) => {
      cncShellMaterials.forEach((mat) => {
        mat.color.set(preset.hex);
        mat.metalness = preset.metalness;
        mat.roughness = preset.roughness;
        mat.needsUpdate = true;
      });
    },
    setXray: (enabled: boolean) => {
      xrayTargets.forEach(({ mesh, solidMat, xrayMat }) => {
        mesh.material = enabled ? xrayMat : solidMat;
      });
    },
    setLights: (enabled: boolean) => {
      workLightL.intensity = enabled ? 7.0 : 1.5;
      workLightR.intensity = enabled ? 5.2 : 1.0;
      floorAccentMat.color.set('#ff7315').multiplyScalar(enabled ? 2.8 : 0.75);
    },
    updateAnimation: ({ elapsed, liftProgress, explodeProgress, laserActive, spindleRpmScale }) => {
      // 1. Front safety doors open + roof canopy elevates cleanly, plus explode offsets
      const doorOpen = liftProgress * 0.72;
      explodables.forEach((part) => {
        if (part.object === doorLeft) {
          part.object.position.set(
            part.basePos.x - doorOpen + part.explodeOffset.x * explodeProgress,
            part.basePos.y + part.explodeOffset.y * explodeProgress,
            part.basePos.z + part.explodeOffset.z * explodeProgress
          );
          return;
        }
        if (part.object === doorRight) {
          part.object.position.set(
            part.basePos.x + doorOpen + part.explodeOffset.x * explodeProgress,
            part.basePos.y + part.explodeOffset.y * explodeProgress,
            part.basePos.z + part.explodeOffset.z * explodeProgress
          );
          return;
        }
        if (part.object === topCanopy) {
          part.object.position.set(
            part.basePos.x + part.explodeOffset.x * explodeProgress,
            part.basePos.y + liftProgress * 0.42 + part.explodeOffset.y * explodeProgress,
            part.basePos.z + part.explodeOffset.z * explodeProgress
          );
          return;
        }
        part.object.position.set(
          part.basePos.x + part.explodeOffset.x * explodeProgress,
          part.basePos.y + part.explodeOffset.y * explodeProgress,
          part.basePos.z + part.explodeOffset.z * explodeProgress
        );
      });

      // 3. Living machinery kinematics
      spindleShaft.rotation.y += 0.14 * spindleRpmScale;
      trunnionCradle.rotation.z = Math.sin(elapsed * 0.65) * 0.16;
      workpiece.rotation.y = elapsed * 0.45;
      atcWheel.rotation.y = Math.sin(elapsed * 0.35) * 0.35;

      // 4. Smooth 6-axis robot loader choreography sweeping cleanly in front-left zone (zero wall clip)
      const robotCycle = Math.sin(elapsed * 0.75);
      robotShoulder.rotation.y = -0.78 + robotCycle * 0.34;
      robotUpperArm.rotation.z = -0.18 + Math.cos(elapsed * 0.75) * 0.11;
      robotForearm.rotation.z = 0.24 + Math.sin(elapsed * 0.75 + 0.6) * 0.14;

      // 5. Laser optical scan sweep inside CNC chamber
      if (laserActive) {
        laserBeamMat.opacity = 0.78 + Math.sin(elapsed * 12) * 0.14;
        laserPlane.position.y = 1.38 + (Math.sin(elapsed * 2.1) * 0.5 + 0.5) * 0.78;
      } else {
        laserBeamMat.opacity = THREE.MathUtils.lerp(laserBeamMat.opacity, 0, 0.12);
      }
    },
  };
}
