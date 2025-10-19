import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, particles, composer, controls;
let time = 0;
let isAnimationEnabled = true;
let currentTheme = 'cosmic'; // Start with purple theme
let morphTarget = 1; // Start with heart (not star)
let morphProgress = 1; // Already at heart

const particleCount = 10000;

const themes = {
  cosmic: {
    name: 'Cosmic',
    colors: [
      new THREE.Color(0x6a0dad),
      new THREE.Color(0x9370db),
      new THREE.Color(0x4b0082),
      new THREE.Color(0x8a2be2),
      new THREE.Color(0xdda0dd)
    ],
    bloom: { strength: 0.4, radius: 0.5, threshold: 0.65 }
  }
};

document.addEventListener('DOMContentLoaded', init);

function createStarPath(particleIndex, totalParticles) {
  const numStarPoints = 5;
  const outerRadius = 35;
  const innerRadius = 15;
  const scale = 1.0;
  const zDepth = 4;

  const starVertices = [];
  for (let i = 0; i < numStarPoints; i++) {
    let angle = (i / numStarPoints) * Math.PI * 2 - Math.PI / 2;
    starVertices.push(new THREE.Vector2(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle)));
    angle += Math.PI / numStarPoints;
    starVertices.push(new THREE.Vector2(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle)));
  }

  const numSegments = starVertices.length;
  const t_path = (particleIndex / totalParticles) * numSegments;
  const segmentIndex = Math.floor(t_path) % numSegments;
  const segmentProgress = t_path - Math.floor(t_path);

  const startVertex = starVertices[segmentIndex];
  const endVertex = starVertices[(segmentIndex + 1) % numSegments];

  const x = THREE.MathUtils.lerp(startVertex.x, endVertex.x, segmentProgress);
  const y = THREE.MathUtils.lerp(startVertex.y, endVertex.y, segmentProgress);
  const z = Math.sin((particleIndex / totalParticles) * Math.PI * 4) * (zDepth / 2);

  const jitterStrength = 0.2;
  return new THREE.Vector3(
    x * scale + (Math.random() - 0.5) * jitterStrength,
    y * scale + (Math.random() - 0.5) * jitterStrength,
    z + (Math.random() - 0.5) * jitterStrength * 0.5
  );
}

function createHeartPath(particleIndex, totalParticles) {
  const t = (particleIndex / totalParticles) * Math.PI * 2;
  const scale = 2.2;

  let x = 16 * Math.pow(Math.sin(t), 3);
  let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

  const finalX = x * scale;
  const finalY = y * scale;
  const z = Math.sin(t * 4) * 2;

  const jitterStrength = 0.2;
  return new THREE.Vector3(
    finalX + (Math.random() - 0.5) * jitterStrength,
    finalY + (Math.random() - 0.5) * jitterStrength,
    z + (Math.random() - 0.5) * jitterStrength * 0.5
  );
}

function init() {
  // Continue music from previous page
  const music = document.getElementById('background-music');
  if (music) {
    const musicPlaying = localStorage.getItem('musicPlaying');
    const musicTime = localStorage.getItem('musicTime');
    
    if (musicPlaying === 'true') {
      if (musicTime) {
        music.currentTime = parseFloat(musicTime);
      }
      music.volume = 0.5;
      music.play().catch(e => console.log('Autoplay prevented:', e));
      
      localStorage.removeItem('musicPlaying');
      localStorage.removeItem('musicTime');
    }
  }

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.z = 90;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('container').appendChild(renderer.domElement);

  // Hide controls (no UI)
  const controlsDiv = document.getElementById('controls');
  if (controlsDiv) controlsDiv.style.display = 'none';

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.rotateSpeed = 0.3;
  controls.minDistance = 30;
  controls.maxDistance = 300;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.15;

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  scene.userData.bloomPass = bloomPass;

  createParticleSystem();

  window.addEventListener('resize', onWindowResize);

  setTheme(currentTheme);
  animate();
  
  // Fade out black overlay after page loads
  setTimeout(() => {
    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      // Remove overlay after fade completes
      setTimeout(() => {
        overlay.remove();
      }, 2000);
    }
  }, 500); // Wait 500ms for everything to load
  
  // Show messages after overlay fades + 2 seconds
  setTimeout(showMessages, 3000);
}

function showMessages() {
  const messageText = document.getElementById('message-text');
  
  // First message
  messageText.textContent = '20/10 vui vẻ nhé,\nluôn may mắn và xinh đẹp nè';
  messageText.style.whiteSpace = 'pre-line';
  messageText.classList.add('show');
  
  // Hide first message after 4 seconds
  setTimeout(() => {
    messageText.classList.remove('show');
    
    // Show second message after 1 second
    setTimeout(() => {
      messageText.textContent = 'ngày mai thi tốt nháaaa';
      messageText.style.whiteSpace = 'nowrap';
      messageText.classList.add('show');
    }, 1000);
  }, 4000);
}

function createParticleSystem() {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const starPositions = new Float32Array(particleCount * 3);
  const heartPositions = new Float32Array(particleCount * 3);
  const disintegrationOffsets = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    const starPos = createStarPath(i, particleCount);
    const heartPos = createHeartPath(i, particleCount);

    // Start at heart position
    positions[i3] = heartPos.x;
    positions[i3 + 1] = heartPos.y;
    positions[i3 + 2] = heartPos.z;

    starPositions[i3] = starPos.x;
    starPositions[i3 + 1] = starPos.y;
    starPositions[i3 + 2] = starPos.z;

    heartPositions[i3] = heartPos.x;
    heartPositions[i3 + 1] = heartPos.y;
    heartPositions[i3 + 2] = heartPos.z;

    const { color, size } = getAttributesForParticle(i);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    sizes[i] = size;

    const offsetStrength = 30 + Math.random() * 40;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);

    disintegrationOffsets[i3] = Math.sin(theta) * Math.cos(phi) * offsetStrength;
    disintegrationOffsets[i3 + 1] = Math.sin(theta) * Math.sin(phi) * offsetStrength;
    disintegrationOffsets[i3 + 2] = Math.cos(theta) * offsetStrength * 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('starPosition', new THREE.BufferAttribute(starPositions, 3));
  geometry.setAttribute('heartPosition', new THREE.BufferAttribute(heartPositions, 3));
  geometry.setAttribute('disintegrationOffset', new THREE.BufferAttribute(disintegrationOffsets, 3));

  const texture = createParticleTexture();
  const material = new THREE.PointsMaterial({
    size: 2.8,
    map: texture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    alphaTest: 0.01
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function getAttributesForParticle(i) {
  const t = i / particleCount;
  const colorPalette = themes[currentTheme].colors;

  const colorProgress = (t * colorPalette.length * 1.5 + time * 0.05) % colorPalette.length;
  const colorIndex1 = Math.floor(colorProgress);
  const colorIndex2 = (colorIndex1 + 1) % colorPalette.length;
  const blendFactor = colorProgress - colorIndex1;

  const color1 = colorPalette[colorIndex1];
  const color2 = colorPalette[colorIndex2];
  const baseColor = new THREE.Color().lerpColors(color1, color2, blendFactor);

  const color = baseColor.clone().multiplyScalar(0.65 + Math.random() * 0.55);
  const size = 0.65 + Math.random() * 0.6;

  return { color, size };
}

function createParticleTexture() {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.2;
  const numPoints = 5;

  context.beginPath();
  context.moveTo(centerX, centerY - outerRadius);
  for (let i = 0; i < numPoints; i++) {
    const outerAngle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    context.lineTo(centerX + outerRadius * Math.cos(outerAngle), centerY + outerRadius * Math.sin(outerAngle));
    const innerAngle = outerAngle + Math.PI / numPoints;
    context.lineTo(centerX + innerRadius * Math.cos(innerAngle), centerY + innerRadius * Math.sin(innerAngle));
  }
  context.closePath();

  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 220, 0.9)');
  gradient.addColorStop(0.6, 'rgba(255, 200, 150, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

  context.fillStyle = gradient;
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function animateParticles() {
  if (!particles || !isAnimationEnabled) return;

  const positions = particles.geometry.attributes.position.array;
  const starPositions = particles.geometry.attributes.starPosition.array;
  const heartPositions = particles.geometry.attributes.heartPosition.array;
  const particleColors = particles.geometry.attributes.color.array;
  const particleSizes = particles.geometry.attributes.size.array;
  const disintegrationOffsets = particles.geometry.attributes.disintegrationOffset.array;

  morphProgress += (morphTarget - morphProgress) * 0.04;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const iSize = i;

    const homeX = THREE.MathUtils.lerp(starPositions[i3], heartPositions[i3], morphProgress);
    const homeY = THREE.MathUtils.lerp(starPositions[i3 + 1], heartPositions[i3 + 1], morphProgress);
    const homeZ = THREE.MathUtils.lerp(starPositions[i3 + 2], heartPositions[i3 + 2], morphProgress);

    const disintegrationCycleTime = 20.0;
    const particleCycleOffset = (i / particleCount) * disintegrationCycleTime * 0.5;
    const cycleProgress = ((time * 0.6 + particleCycleOffset) % disintegrationCycleTime) / disintegrationCycleTime;

    let disintegrationAmount = 0;
    const stablePhaseEnd = 0.5;
    const disintegrateStartPhase = stablePhaseEnd;
    const disintegrateFullPhase = stablePhaseEnd + 0.15;
    const holdPhaseEnd = disintegrateFullPhase + 0.1;

    if (cycleProgress < stablePhaseEnd) {
      disintegrationAmount = 0;
    } else if (cycleProgress < disintegrateFullPhase) {
      disintegrationAmount = (cycleProgress - disintegrateStartPhase) / (disintegrateFullPhase - disintegrateStartPhase);
    } else if (cycleProgress < holdPhaseEnd) {
      disintegrationAmount = 1.0;
    } else {
      disintegrationAmount = 1.0 - (cycleProgress - holdPhaseEnd) / (1.0 - holdPhaseEnd);
    }

    disintegrationAmount = Math.sin(disintegrationAmount * Math.PI * 0.5);

    let currentTargetX = homeX;
    let currentTargetY = homeY;
    let currentTargetZ = homeZ;
    let currentLerpFactor = 0.085;

    if (disintegrationAmount > 0.001) {
      currentTargetX = homeX + disintegrationOffsets[i3] * disintegrationAmount;
      currentTargetY = homeY + disintegrationOffsets[i3 + 1] * disintegrationAmount;
      currentTargetZ = homeZ + disintegrationOffsets[i3 + 2] * disintegrationAmount;
      currentLerpFactor = 0.045 + disintegrationAmount * 0.02;
    }

    positions[i3] += (currentTargetX - positions[i3]) * currentLerpFactor;
    positions[i3 + 1] += (currentTargetY - positions[i3 + 1]) * currentLerpFactor;
    positions[i3 + 2] += (currentTargetZ - positions[i3 + 2]) * currentLerpFactor;

    const { color: baseParticleColor, size: baseParticleSize } = getAttributesForParticle(i);

    let brightnessFactor =
      (0.65 + Math.sin((i / particleCount) * Math.PI * 7 + time * 1.3) * 0.35) * (1 - disintegrationAmount * 0.75);
    brightnessFactor *= 0.85 + Math.sin(time * 7 + i * 0.5) * 0.15;

    particleColors[i3] = baseParticleColor.r * brightnessFactor;
    particleColors[i3 + 1] = baseParticleColor.g * brightnessFactor;
    particleColors[i3 + 2] = baseParticleColor.b * brightnessFactor;

    let currentSize = baseParticleSize * (1 - disintegrationAmount * 0.9);
    currentSize *= 0.8 + Math.sin(time * 5 + i * 0.3) * 0.2;
    particleSizes[iSize] = Math.max(0.05, currentSize);
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
  particles.geometry.attributes.size.needsUpdate = true;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function setTheme(themeName) {
  if (!themes[themeName]) return;
  currentTheme = themeName;

  document.body.className = `theme-${currentTheme}`;

  const theme = themes[currentTheme];
  const bloomPass = scene.userData.bloomPass;
  if (bloomPass) {
    bloomPass.strength = theme.bloom.strength;
    bloomPass.radius = theme.bloom.radius;
    bloomPass.threshold = theme.bloom.threshold;
  }

  updateParticleColorsAndSizes();
}

function updateParticleColorsAndSizes() {
  if (!particles) return;

  const pColors = particles.geometry.attributes.color.array;
  const pSizes = particles.geometry.attributes.size.array;

  for (let i = 0; i < particleCount; i++) {
    const { color, size } = getAttributesForParticle(i);
    pColors[i * 3] = color.r;
    pColors[i * 3 + 1] = color.g;
    pColors[i * 3 + 2] = color.b;
    pSizes[i] = size;
  }

  particles.geometry.attributes.color.needsUpdate = true;
  particles.geometry.attributes.size.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  time += 0.02;
  controls.update();

  if (isAnimationEnabled) {
    animateParticles();
  }

  composer.render();
}
