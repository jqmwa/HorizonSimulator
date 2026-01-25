import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://esm.sh/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.158.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.158.0/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'https://esm.sh/three@0.158.0/examples/jsm/shaders/CopyShader.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'https://esm.sh/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

// ========== SCENE SETUP ==========
const canvas = document.getElementById('threeCanvas');
if (!canvas) {
    console.error('❌ Canvas element not found! Make sure #threeCanvas exists in the HTML.');
}

const scene = new THREE.Scene();

// Futuristic dark palette – off-black background, micro-blue fog
scene.background = new THREE.Color(0x0e1116);
scene.fog = new THREE.Fog(0x1e242e, 50, 200);

// ========== MEDIEVAL DUNGEON LIGHTING ==========
// Remove bright daylight - replace with torch/fire lighting
// BRIGHT directional lights for main illumination
const torchLight1 = new THREE.DirectionalLight(0xFFAA66, 2.5); // Bright orange firelight
torchLight1.position.set(30, 15, 30);
torchLight1.castShadow = true;
torchLight1.shadow.mapSize.width = 2048;
torchLight1.shadow.mapSize.height = 2048;
torchLight1.shadow.camera.near = 0.1;
torchLight1.shadow.camera.far = 200;
scene.add(torchLight1);

const torchLight2 = new THREE.DirectionalLight(0xFF8844, 2.0); // Bright reddish firelight
torchLight2.position.set(-30, 15, -30);
torchLight2.castShadow = true;
scene.add(torchLight2);

// Additional bright directional light from front
const torchLight3 = new THREE.DirectionalLight(0xFFDDAA, 2.0);
torchLight3.position.set(0, 20, 30);
scene.add(torchLight3);

// BRIGHT ambient light for visibility - dungeon atmosphere maintained through color
const ambientLight = new THREE.AmbientLight(0x776655, 1.2); // Much brighter ambient
scene.add(ambientLight);

// Store lights for animation
window.torchLights = [torchLight1, torchLight2, torchLight3];

// ========== DUNGEON STONE WALLS ==========
// Create sphere for 360 dungeon walls (inverted geometry)
const dungeonGeometry = new THREE.SphereGeometry(500, 60, 40);
dungeonGeometry.scale(-1, 1, 1); // Invert to see inside

// Create procedural stone wall texture
const dungeonCanvas = document.createElement('canvas');
dungeonCanvas.width = 2048;
dungeonCanvas.height = 1024;
const ctx = dungeonCanvas.getContext('2d');

// Base stone color - dark gray/brown
ctx.fillStyle = '#2A1F1A'; // Dark brownish stone
ctx.fillRect(0, 0, 2048, 1024);

// Add stone brick pattern
ctx.strokeStyle = '#1A120E'; // Darker mortar lines
ctx.lineWidth = 4;
const brickWidth = 120;
const brickHeight = 60;
const offset = 60;

for (let y = 0; y < 1024; y += brickHeight) {
    for (let x = 0; x < 2048; x += brickWidth) {
        const actualX = (Math.floor(y / brickHeight) % 2 === 0) ? x : x + offset;
        ctx.strokeRect(actualX, y, brickWidth, brickHeight);
        
        // Add some variation in stone color
        ctx.fillStyle = `rgba(${80 + Math.random() * 30}, ${50 + Math.random() * 20}, ${40 + Math.random() * 20}, ${0.1 + Math.random() * 0.2})`;
        ctx.fillRect(actualX + 2, y + 2, brickWidth - 4, brickHeight - 4);
    }
}

// Add some moss/dirt streaks
ctx.fillStyle = 'rgba(40, 60, 30, 0.3)';
for (let i = 0; i < 50; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 1024;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 100 + 20, 0, Math.PI * 2);
    ctx.fill();
}

// Add darker patches for depth
ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
for (let i = 0; i < 30; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 1024;
    ctx.fillRect(x, y, Math.random() * 200 + 50, Math.random() * 300 + 100);
}

const dungeonTexture = new THREE.CanvasTexture(dungeonCanvas);
dungeonTexture.mapping = THREE.EquirectangularReflectionMapping;
dungeonTexture.wrapS = THREE.RepeatWrapping;
dungeonTexture.wrapT = THREE.RepeatWrapping;

const dungeonMaterial = new THREE.MeshStandardMaterial({
    map: dungeonTexture,
    side: THREE.BackSide,
    metalness: 0.1,
    roughness: 0.9
});

const dungeonSphere = new THREE.Mesh(dungeonGeometry, dungeonMaterial);
scene.add(dungeonSphere);

// ========== DUNGEON STONE FLOOR ==========
const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
// Add some slight variation to floor height for realism
const positions = floorGeometry.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] += (Math.random() - 0.5) * 0.3; // Slight height variation
}
floorGeometry.attributes.position.needsUpdate = true;
floorGeometry.computeVertexNormals();

// Create stone floor texture
const floorCanvas = document.createElement('canvas');
floorCanvas.width = 512;
floorCanvas.height = 512;
const floorCtx = floorCanvas.getContext('2d');

floorCtx.fillStyle = '#1A1510'; // Dark stone base
floorCtx.fillRect(0, 0, 512, 512);

// Add stone pattern
floorCtx.strokeStyle = '#0A0805';
floorCtx.lineWidth = 2;
const floorTileSize = 64;
for (let x = 0; x < 512; x += floorTileSize) {
    for (let y = 0; y < 512; y += floorTileSize) {
        floorCtx.strokeRect(x, y, floorTileSize, floorTileSize);
        // Vary stone colors
        floorCtx.fillStyle = `rgba(${40 + Math.random() * 30}, ${30 + Math.random() * 20}, ${25 + Math.random() * 15}, ${0.3})`;
        floorCtx.fillRect(x + 1, y + 1, floorTileSize - 2, floorTileSize - 2);
    }
}

const floorTexture = new THREE.CanvasTexture(floorCanvas);
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 10);

const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    color: 0x2A1F1A,
    metalness: 0.1,
    roughness: 0.95
});

const dungeonFloor = new THREE.Mesh(floorGeometry, floorMaterial);
dungeonFloor.rotation.x = -Math.PI / 2;
dungeonFloor.position.y = -15;
dungeonFloor.receiveShadow = true;
scene.add(dungeonFloor);

// ========== MEDIEVAL DUNGEON PROPS ==========

// Torches on walls (point lights with flickering flame effects)
const torchPositions = [
    { x: 40, y: 10, z: 40 },
    { x: -40, y: 10, z: -40 },
    { x: 40, y: 10, z: -40 },
    { x: -40, y: 10, z: 40 }
];

const torchLights = [];
const torchFlames = [];
const torchFlamePositions = [];

torchPositions.forEach((pos, i) => {
    // Point light for torch - MUCH BRIGHTER
    const torchLight = new THREE.PointLight(0xFF6600, 6.0, 60);
    torchLight.position.set(pos.x, pos.y, pos.z);
    torchLight.castShadow = true;
    torchLight.shadow.mapSize.width = 512;
    torchLight.shadow.mapSize.height = 512;
    scene.add(torchLight);
    torchLights.push(torchLight);
    
    // Torch holder (metal bracket)
    const bracketGroup = new THREE.Group();
    
    // Wall bracket
    const bracketGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const bracketMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.8,
        roughness: 0.3
    });
    const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
    bracket.position.set(pos.x, pos.y - 0.4, pos.z);
    bracket.castShadow = true;
    scene.add(bracket);
    
    // Torch flame (animated sphere)
    const flameGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4400,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    const flamePos = { x: pos.x, y: pos.y + 0.3, z: pos.z };
    flame.position.set(flamePos.x, flamePos.y, flamePos.z);
    scene.add(flame);
    torchFlames.push(flame);
    torchFlamePositions.push(flamePos);
});

window.torchPointLights = torchLights;
window.torchFlames = torchFlames;
window.torchFlamePositions = torchFlamePositions;

// Chains hanging from ceiling
function createChain(startPos, endPos, links = 10) {
    const chainGroup = new THREE.Group();
    const linkGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const linkMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.2
    });
    
    const dx = (endPos.x - startPos.x) / links;
    const dy = (endPos.y - startPos.y) / links;
    const dz = (endPos.z - startPos.z) / links;
    
    for (let i = 0; i < links; i++) {
        const link = new THREE.Mesh(linkGeometry, linkMaterial);
        link.position.set(
            startPos.x + dx * i,
            startPos.y + dy * i,
            startPos.z + dz * i
        );
        link.rotation.x = Math.PI / 2;
        link.castShadow = true;
        chainGroup.add(link);
    }
    
    scene.add(chainGroup);
    return chainGroup;
}

// Add hanging chains
createChain({ x: 15, y: 20, z: 0 }, { x: 15, y: 5, z: 0 }, 8);
createChain({ x: -15, y: 20, z: 0 }, { x: -15, y: 5, z: 0 }, 8);

// Cobwebs in corners
function createCobweb(center, radius = 3) {
    const webGroup = new THREE.Group();
    const webMaterial = new THREE.LineBasicMaterial({
        color: 0xCCCCAA,
        transparent: true,
        opacity: 0.4
    });
    
    // Radial lines
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(center.x, center.y, center.z),
            new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle * 0.5) * radius * 0.3,
                center.z + Math.sin(angle) * radius
            )
        ]);
        const line = new THREE.Line(geometry, webMaterial);
        webGroup.add(line);
    }
    
    // Spiral web pattern
    for (let r = 0.5; r < radius; r += 0.5) {
        const points = [];
        for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
            points.push(new THREE.Vector3(
                center.x + Math.cos(angle) * r,
                center.y + Math.sin(angle * 0.5) * r * 0.3,
                center.z + Math.sin(angle) * r
            ));
        }
        const spiralGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const spiralLine = new THREE.Line(spiralGeometry, webMaterial);
        webGroup.add(spiralLine);
    }
    
    scene.add(webGroup);
    return webGroup;
}

// Add cobwebs in corners
createCobweb({ x: 45, y: 15, z: 45 }, 4);
createCobweb({ x: -45, y: 12, z: -45 }, 3.5);
createCobweb({ x: 45, y: 18, z: -45 }, 3);

console.log('🏰 Medieval dungeon props added: torches, chains, and cobwebs!');

// ========== OPHANIM ANGEL MODEL ==========
let ophanimAngel = null;
let ophanimMixer = null;

const gltfLoader = new GLTFLoader();
gltfLoader.load(
    './assets/Ophanim Angel 3D Model.glb',
    (gltf) => {
        ophanimAngel = gltf.scene;
        
        // Scale and position the angel at the center
        ophanimAngel.scale.set(3, 3, 3);
        ophanimAngel.position.set(0, 0, 0);
        // Rotate to face the camera directly (adjusted for proper eye alignment)
        ophanimAngel.rotation.y = -Math.PI / 2; // -90 degrees (clockwise) to center the eye
        
        // Setup animation mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
            ophanimMixer = new THREE.AnimationMixer(ophanimAngel);
            
            // Play all animations
            gltf.animations.forEach(clip => {
                const action = ophanimMixer.clipAction(clip);
                action.play();
            });
            
            console.log(`🎬 Playing ${gltf.animations.length} animation(s)`);
        }
        
        // Keep original materials but store them for subtle color tinting
        const angelMaterials = [];
        ophanimAngel.traverse((child) => {
            if (child.isMesh) {
                // Preserve original material but ensure it's visible
                if (child.material) {
                    child.material.side = THREE.FrontSide;
                    
                    // Store original color if it exists
                    if (!child.material.userData.originalColor) {
                        child.material.userData.originalColor = child.material.color.clone();
                    }
                    
                    // Convert gold colors to silver - detect gold-like hues and convert
                    const originalColor = child.material.color.clone();
                    const hsl = { h: 0, s: 0, l: 0 };
                    originalColor.getHSL(hsl);
                    
                    // Gold colors typically have hue around 0.1-0.15 (yellow/orange range)
                    // Check if this looks like gold and convert to silver
                    if (hsl.h >= 0.05 && hsl.h <= 0.2 && hsl.s > 0.3) {
                        // Convert to silver: desaturate and adjust lightness
                        hsl.s = Math.max(0, hsl.s * 0.2); // Desaturate significantly
                        hsl.l = Math.min(0.9, hsl.l * 1.3); // Increase lightness for silver
                        hsl.h = 0.55; // Shift toward blue/cyan for cooler silver tone
                        child.material.color.setHSL(hsl.h, hsl.s, hsl.l);
                    } else if (hsl.h >= 0.0 && hsl.h <= 0.25 && hsl.l > 0.4) {
                        // For bright yellow/gold colors, convert more aggressively
                        hsl.s = hsl.s * 0.15;
                        hsl.l = Math.min(0.85, hsl.l * 1.4);
                        hsl.h = 0.5; // Cool silver/cyan tint
                        child.material.color.setHSL(hsl.h, hsl.s, hsl.l);
                    }
                    
                    // Enhance metallic properties for silver appearance
                    if (child.material.metalness !== undefined) {
                        child.material.metalness = Math.max(child.material.metalness || 0.5, 0.7);
                    }
                    if (child.material.roughness !== undefined) {
                        child.material.roughness = Math.min(child.material.roughness || 0.5, 0.3);
                    }
                    
                    // Update stored original color after conversion
                    child.material.userData.originalColor = child.material.color.clone();
                    
                    angelMaterials.push(child.material);
                }
            }
        });
        
        // Store materials for subtle animation
        window.angelMaterials = angelMaterials;
        
        scene.add(ophanimAngel);
        
        // Add VERY BRIGHT lighting around the angel for visibility
        // Main directional light from above (key light) - MUCH BRIGHTER
        const keyLight = new THREE.DirectionalLight(0xFFEECC, 4.0);
        keyLight.position.set(5, 20, 5);
        keyLight.castShadow = true;
        scene.add(keyLight);
        
        // Fill lights around the angel (circular arrangement) - MUCH BRIGHTER
        const fillLightRadius = 15;
        const fillLightHeight = 8;
        const fillLightCount = 8;
        const fillLights = [];
        
        for (let i = 0; i < fillLightCount; i++) {
            const angle = (Math.PI * 2 * i) / fillLightCount;
            const x = Math.cos(angle) * fillLightRadius;
            const z = Math.sin(angle) * fillLightRadius;
            
            // Mix warm torch colors with cooler silver tones - INCREASED INTENSITY
            const colorMix = i % 2 === 0 ? 0xFFDDAA : 0xDDDDEE;
            const fillLight = new THREE.PointLight(colorMix, 5.0, 50); // Much brighter and larger range
            fillLight.position.set(x, fillLightHeight, z);
            fillLight.castShadow = false;
            scene.add(fillLight);
            fillLights.push(fillLight);
        }
        
        // Rim lights for edge definition (behind angel) - MUCH BRIGHTER
        const rimLight1 = new THREE.PointLight(0xFF6600, 4.0, 40);
        rimLight1.position.set(-8, 5, -8);
        scene.add(rimLight1);
        
        const rimLight2 = new THREE.PointLight(0x6178FF, 4.0, 40);
        rimLight2.position.set(8, 5, -8);
        scene.add(rimLight2);
        
        // Bottom accent light (fills shadows from below) - BRIGHTER
        const bottomLight = new THREE.PointLight(0xFFAA44, 3.0, 30);
        bottomLight.position.set(0, -5, 0);
        scene.add(bottomLight);
        
        // Front accent lights for face/eye illumination - MUCH BRIGHTER
        const frontLight = new THREE.PointLight(0xFFFFFF, 5.0, 40);
        frontLight.position.set(0, 2, 8);
        scene.add(frontLight);
        
        const frontLight2 = new THREE.PointLight(0xEEEEFF, 4.5, 35);
        frontLight2.position.set(0, 1, 10);
        scene.add(frontLight2);
        
        // Store lights for animation
        window.angelLights = {
            key: keyLight,
            fill: fillLights,
            rim1: rimLight1,
            rim2: rimLight2,
            bottom: bottomLight,
            front: frontLight,
            front2: frontLight2
        };
        
        // Bright eye light for lens glow effect
        const eyeLight = new THREE.PointLight(0xFFFFFF, 5, 20);
        eyeLight.position.set(0, 1, 0); // Position at center of angel's face (eye area)
        scene.add(eyeLight);
        
        // Create glowing eye sphere (very bright to trigger bloom)
        const eyeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.9
                });
        const eyeGlow = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eyeGlow.position.set(0, 1, 0); // Same position as eye light - center of face
        scene.add(eyeGlow);
        
        // Store reference for animation
        window.eyeGlow = eyeGlow;
        window.eyeLight = eyeLight;
        
        console.log('✨ Ophanim Angel loaded with multicolor silverish lighting and bright eye glow!');
    },
    (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        console.log(`Loading Ophanim Angel: ${percent}%`);
        document.querySelector('.footer-text').textContent = `LOADING OPHANIM ANGEL... ${percent}%`;
    },
    (error) => {
        console.error('❌ Error loading Ophanim Angel:', error);
        document.querySelector('.footer-text').textContent = 'ERROR LOADING ANGEL MODEL';
        
        // Add a placeholder sphere so the scene still renders
        const placeholderGeometry = new THREE.SphereGeometry(2, 32, 32);
        const placeholderMaterial = new THREE.MeshStandardMaterial({
            color: 0x5DCCCC,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x2A4A5A,
            emissiveIntensity: 0.3
        });
        const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
        placeholder.position.set(0, 0, 0);
        scene.add(placeholder);
        
        console.log('⚠️ Added placeholder sphere - please add ophanim_angel.glb to ./assets/ folder');
    }
);

// Clock for animation updates
const modelAnimationClock = new THREE.Clock();

// ========== QUANTUM FOAM / FIELD ==========
class QuantumParticle {
    constructor() {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.8),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.reset();
        scene.add(this.mesh);
    }
    
    reset() {
        // Random position in a sphere around origin
        const radius = Math.random() * 25 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        this.mesh.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        this.life = 0;
        this.maxLife = Math.random() * 60 + 30;
        this.mesh.material.opacity = 0;
        
        // Random color
        this.mesh.material.color.setHSL(Math.random(), 0.7, 0.7);
    }
    
    update() {
        this.life++;
        
        // Fade in, exist, fade out
        const halfLife = this.maxLife / 2;
        if (this.life < halfLife) {
            this.mesh.material.opacity = (this.life / halfLife) * 0.6;
        } else {
            this.mesh.material.opacity = ((this.maxLife - this.life) / halfLife) * 0.6;
        }
        
        // Tiny random movement (quantum jitter)
        this.mesh.position.x += (Math.random() - 0.5) * 0.05;
        this.mesh.position.y += (Math.random() - 0.5) * 0.05;
        this.mesh.position.z += (Math.random() - 0.5) * 0.05;
        
        // Reset when life is over
        if (this.life >= this.maxLife) {
            this.reset();
        }
    }
}

// Create quantum foam particles
const quantumParticles = [];
for (let i = 0; i < 200; i++) {
    quantumParticles.push(new QuantumParticle());
}

// ========== COMETS WITH TAILS ==========
class Comet {
    constructor(radius, speed, color, offset) {
        this.radius = radius;
        this.speed = speed;
        this.angle = offset;
        this.color = color;
        
        // Comet head (small glowing sphere)
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        
        // Comet glow
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        // Comet tail (using particles)
        this.tailParticles = [];
        this.tailPositions = [];
        
        const tailGeometry = new THREE.BufferGeometry();
        const tailPositionsArray = new Float32Array(30 * 3); // 30 particles in tail
        const tailColors = new Float32Array(30 * 3);
        
        for (let i = 0; i < 30; i++) {
            tailPositionsArray[i * 3] = 0;
            tailPositionsArray[i * 3 + 1] = 0;
            tailPositionsArray[i * 3 + 2] = 0;
            
            // Fade out tail color
            const fade = 1 - (i / 30);
            tailColors[i * 3] = (color >> 16 & 255) / 255 * fade;
            tailColors[i * 3 + 1] = (color >> 8 & 255) / 255 * fade;
            tailColors[i * 3 + 2] = (color & 255) / 255 * fade;
        }
        
        tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositionsArray, 3));
        tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
        
        const tailMaterial = new THREE.PointsMaterial({
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        this.tail = new THREE.Points(tailGeometry, tailMaterial);
        
        scene.add(this.head);
        scene.add(this.glow);
        scene.add(this.tail);
    }
    
    update() {
        // Move comet in opposite direction (negative speed)
        this.angle -= this.speed;
        
        const x = Math.cos(this.angle) * this.radius;
        const z = Math.sin(this.angle) * this.radius;
        const y = Math.sin(this.angle * 2) * 3; // Sine wave motion
        
        this.head.position.set(x, y, z);
        this.glow.position.set(x, y, z);
        
        // Update tail positions (create trailing effect)
        this.tailPositions.unshift({ x, y, z });
        if (this.tailPositions.length > 30) {
            this.tailPositions.pop();
        }
        
        const positions = this.tail.geometry.attributes.position.array;
        for (let i = 0; i < this.tailPositions.length; i++) {
            const pos = this.tailPositions[i];
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        }
        this.tail.geometry.attributes.position.needsUpdate = true;
    }
}

// Create multiple comets orbiting in opposite direction
const comets = [];
comets.push(new Comet(35, 0.008, 0xFFFFFF, 0)); // White comet
comets.push(new Comet(45, 0.006, 0x88DDFF, Math.PI)); // Blue comet
comets.push(new Comet(55, 0.005, 0xFF88DD, Math.PI / 2)); // Pink comet
comets.push(new Comet(40, 0.007, 0xAAFF88, Math.PI * 1.5)); // Green comet

// ========== SHOOTING STARS ==========
class ShootingStar {
    constructor() {
        this.reset();
        
        // Star trail
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(20 * 3); // 20 points for trail
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            linewidth: 2
        });
        
        this.line = new THREE.Line(geometry, material);
        scene.add(this.line);
        
        this.active = false;
        this.lifeTime = 0;
        this.maxLifeTime = 2000; // 2 seconds
    }
    
    reset() {
        // Random starting position in distance
        this.startPos = new THREE.Vector3(
            (Math.random() - 0.5) * 200,
            Math.random() * 50 + 20,
            (Math.random() - 0.5) * 200 - 100
        );
        
        // Random direction (mostly downward and across)
        this.direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -(Math.random() * 0.5 + 0.3),
            (Math.random() - 0.5) * 2
        ).normalize();
        
        this.speed = Math.random() * 0.5 + 0.5;
        this.currentPos = this.startPos.clone();
        this.active = false;
        this.lifeTime = 0;
    }
    
    trigger() {
        this.reset();
        this.active = true;
        this.lifeTime = 0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.lifeTime += deltaTime;
        
        if (this.lifeTime > this.maxLifeTime) {
            this.active = false;
            this.line.material.opacity = 0;
            return;
        }
        
        // Move the star
        this.currentPos.add(this.direction.clone().multiplyScalar(this.speed));
        
        // Update trail
        const positions = this.line.geometry.attributes.position.array;
        for (let i = positions.length - 3; i >= 3; i -= 3) {
            positions[i] = positions[i - 3];
            positions[i + 1] = positions[i - 2];
            positions[i + 2] = positions[i - 1];
        }
        positions[0] = this.currentPos.x;
        positions[1] = this.currentPos.y;
        positions[2] = this.currentPos.z;
        
        this.line.geometry.attributes.position.needsUpdate = true;
        
        // Fade in and out
        const progress = this.lifeTime / this.maxLifeTime;
        if (progress < 0.2) {
            this.line.material.opacity = progress / 0.2;
        } else if (progress > 0.7) {
            this.line.material.opacity = (1 - progress) / 0.3;
        } else {
            this.line.material.opacity = 1;
        }
    }
}

// Create shooting star pool
const shootingStars = [];
for (let i = 0; i < 5; i++) {
    shootingStars.push(new ShootingStar());
}

// Trigger random shooting stars
setInterval(() => {
    const inactive = shootingStars.filter(star => !star.active);
    if (inactive.length > 0 && Math.random() < 0.5) {
        const star = inactive[Math.floor(Math.random() * inactive.length)];
        star.trigger();
    }
}, 3000); // Check every 3 seconds

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    2000
);
// Camera positioned for dramatic sunset view over water
camera.position.set(0, 10, 40); // Elevated view looking toward horizon
camera.lookAt(0, 0, 0); // Looking at angel in center

// Renderer
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true 
});
const canvasWidth = canvas.clientWidth || 800;
const canvasHeight = canvas.clientHeight || 600;
renderer.setSize(canvasWidth, canvasHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ========== AFTERIMAGE POST-PROCESSING ==========
const composer = new EffectComposer(renderer);

// Main render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Cinematic bloom lens effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,    // strength - moderate cinematic glow
    0.8,    // radius - wide lens effect
    0.6     // threshold - subtle atmospheric glow
);
composer.addPass(bloomPass);

// Enable renderer features for better quality
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8; // MUCH higher exposure for visibility

// Afterimage shader (motion blur trail effect)
const AfterimageShader = {
    uniforms: {
        'damp': { value: 0.96 },
        'tOld': { value: null },
        'tNew': { value: null }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float damp;
        uniform sampler2D tOld;
        uniform sampler2D tNew;
        varying vec2 vUv;
        
        void main() {
            vec4 texelOld = texture2D(tOld, vUv);
            vec4 texelNew = texture2D(tNew, vUv);
            
            // Blend old and new frames with damping
            texelOld *= damp;
            
            gl_FragColor = max(texelOld, texelNew);
        }
    `
};

// Create two render targets for ping-pong rendering
const renderTargetA = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    }
);

const renderTargetB = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    }
);

const afterimagePass = new ShaderPass(AfterimageShader);
afterimagePass.uniforms.damp.value = 0.94; // Trail length (0.9-0.99, higher = longer trail)
composer.addPass(afterimagePass);

// Copy pass to display result
const copyPass = new ShaderPass(CopyShader);
composer.addPass(copyPass);

// Texture swapping for afterimage
let textureOld = renderTargetA.texture;
let textureNew = renderTargetB.texture;

// Handle window resize
window.addEventListener('resize', () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    composer.setSize(width, height);
    
    renderTargetA.setSize(width, height);
    renderTargetB.setSize(width, height);
});

// Controls with restricted view - focused on the eye
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = false;
controls.enableZoom = true;
controls.minDistance = 30;  // Restricted zoom-in by ~20% to prevent getting too close
controls.maxDistance = 100;

// Set orbit target to the eye position (center of angel face)
controls.target.set(0, 1, 0); // Eye is at center, slightly elevated

// Restrict horizontal rotation to ~90 degree view (45 degrees each direction from center)
controls.minAzimuthAngle = -Math.PI / 4;  // -45 degrees
controls.maxAzimuthAngle = Math.PI / 4;   // +45 degrees

// Restrict vertical rotation to prevent looking too far up or down
controls.minPolarAngle = Math.PI / 3;     // 60 degrees from top
controls.maxPolarAngle = (2 * Math.PI) / 3; // 120 degrees from top

// Disable panning for more controlled view
controls.enablePan = false;

// Reduced parallax effect with mouse (more subtle)
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});


// ========== SPACE ENVIRONMENT (No water or sand - pure void) ==========



// Mesh particles removed for cleaner 360 panorama view

// ========== ANIMATION LOOP ==========
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Very subtle parallax camera effect (reduced for restricted view)
    targetX = mouseX * 1;
    targetY = mouseY * 0.8;
    
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY + 10 - camera.position.y) * 0.02;
    
    // Always look at the eye position (center of angel)
    camera.lookAt(0, 1, 0);
    
    const time = Date.now() * 0.001;
    
    // ========== ANIMATE MEDIEVAL DUNGEON EFFECTS ==========
    // Flickering torch lights (medieval fire effect) - BRIGHT BASE
    if (window.torchPointLights && window.torchPointLights.length > 0) {
        window.torchPointLights.forEach((light, i) => {
            // Random flicker with multiple frequency components for realistic fire
            const flicker1 = Math.sin(time * 15 + i * 2) * 0.15;
            const flicker2 = Math.sin(time * 23 + i * 3) * 0.1;
            const flicker3 = Math.sin(time * 31 + i * 4) * 0.05;
            const flicker = 1 + flicker1 + flicker2 + flicker3;
            
            light.intensity = 6.0 * flicker; // Much brighter base intensity
            
            // Slight color variation (orange to red-orange)
            const colorVariation = Math.sin(time * 8 + i) * 0.1;
            const hue = 0.08 + colorVariation * 0.02; // Orange to red-orange range
            light.color.setHSL(hue, 0.9, 0.5);
        });
    }
    
    // Animate torch flames
    if (window.torchFlames && window.torchFlamePositions) {
        window.torchFlames.forEach((flame, i) => {
            const basePos = window.torchFlamePositions[i];
            if (!basePos) return;
            
            // Flame flickering scale
            const scale1 = Math.sin(time * 12 + i * 2) * 0.15;
            const scale2 = Math.sin(time * 18 + i * 3) * 0.1;
            const scale = 1 + scale1 + scale2;
            flame.scale.set(scale, scale * 1.2, scale); // Slightly taller
            
            // Flame position wobble (relative to base position)
            const wobbleX = Math.sin(time * 10 + i) * 0.1;
            const wobbleY = Math.sin(time * 8 + i * 2) * 0.15;
            flame.position.x = basePos.x + wobbleX;
            flame.position.y = basePos.y + wobbleY;
            flame.position.z = basePos.z;
        });
    }
    
    // Animate directional torch lights (if they exist)
    if (window.torchLights && window.torchLights.length > 0) {
        window.torchLights.forEach((light, i) => {
            const flicker = 1 + Math.sin(time * 13 + i) * 0.2 + Math.sin(time * 19 + i * 2) * 0.1;
            light.intensity = (i === 0 ? 0.8 : 0.6) * flicker;
        });
    }
    
    // Update Ophanim Angel animations and effects
    if (ophanimMixer) {
        const delta = modelAnimationClock.getDelta();
        ophanimMixer.update(delta);
    }
    
    // Animate angel (floating and rotation only)
    if (ophanimAngel) {
        // Gentle floating animation (removed rotation for consistent eye focus)
        ophanimAngel.position.y = Math.sin(time * 0.5) * 0.3;
        
        // Eye stays in center of the angel (no rotation, consistent focus)
        if (window.eyeGlow && window.eyeLight) {
            // Position eye light at the center/face of the angel
            const eyeX = 0; // Centered
            const eyeZ = 0; // At angel's center position
            const eyeY = ophanimAngel.position.y + 1; // Slightly above center for eye height
            
            window.eyeGlow.position.set(eyeX, eyeY, eyeZ);
            window.eyeLight.position.set(eyeX, eyeY, eyeZ);
            
            // Pulse the eye brightness for dramatic effect
            const pulseBrightness = 5 + Math.sin(time * 3) * 2;
            window.eyeLight.intensity = pulseBrightness;
            
            // Subtle scale pulse on the eye glow
            const glowScale = 0.5 + Math.sin(time * 3) * 0.1;
            window.eyeGlow.scale.set(glowScale, glowScale, glowScale);
        }
        
        // Apply subtle silverish tint to original materials
        if (window.angelMaterials && window.angelMaterials.length > 0) {
            // Slow morph cycle (12 second period)
            const colorMorph = (Math.sin(time * 0.26) + 1) / 2; // 0 to 1
            
            // Tealish silver vs Cool silver tint (very subtle influence)
            const tealSilverTint = new THREE.Color(0x5DCCCC); // Tealish silver
            const coolSilverTint = new THREE.Color(0xC0C0C0); // Cool silver (RGB: 192, 192, 192)
            
            // Blend the silver tints
            const currentTint = new THREE.Color().lerpColors(tealSilverTint, coolSilverTint, colorMorph);
            
            // Apply very subtle tint to each material (only 15% influence)
            window.angelMaterials.forEach(material => {
                if (material.userData.originalColor) {
                    const originalColor = material.userData.originalColor;
                    // Blend original color with silver tint (85% original, 15% tint)
                    material.color.r = originalColor.r * 0.85 + currentTint.r * 0.15;
                    material.color.g = originalColor.g * 0.85 + currentTint.g * 0.15;
                    material.color.b = originalColor.b * 0.85 + currentTint.b * 0.15;
                }
            });
        }
    }
    
    
    // Update controls
    controls.update();
    
    // Afterimage effect - swap textures and render
    afterimagePass.uniforms.tOld.value = textureOld;
    afterimagePass.uniforms.tNew.value = textureNew;
    
    // Render with afterimage effect
    composer.render();
    
    // Swap textures for next frame (ping-pong)
    const temp = textureOld;
    textureOld = composer.renderTarget2.texture;
    textureNew = temp;
}

animate();

// ========== EVENT LISTENERS ==========

// Random word pools for stimulation
const stimulationWords = [
    'consciousness', 'infinity', 'quantum', 'evolution', 'emergence', 
    'transcendence', 'synchronicity', 'harmony', 'chaos', 'entropy',
    'beauty', 'truth', 'wisdom', 'creativity', 'innovation',
    'paradox', 'duality', 'singularity', 'resonance', 'vibration',
    'enlightenment', 'awareness', 'perception', 'reality', 'illusion',
    'freedom', 'destiny', 'purpose', 'existence', 'nothingness',
    'eternity', 'cosmos', 'universe', 'dimension', 'multiverse',
    'energy', 'matter', 'space', 'time', 'void',
    'transformation', 'metamorphosis', 'genesis', 'apocalypse', 'rebirth',
    'mystery', 'wonder', 'awe', 'sublime', 'divine'
];

// UI state variables
let isStimulated = false;
let isFrozen = false;

// Stimulate button - now triggers conversation with random word
document.querySelector('.stimulate-btn').addEventListener('click', () => {
    isStimulated = !isStimulated;
    if (isStimulated) {
        // Parallax mode - no autoRotate adjustment needed
        
        // Pick a random word and inject it as a conversation topic
        const randomWord = stimulationWords[Math.floor(Math.random() * stimulationWords.length)];
        
        // Add to conversation log
        const username = document.getElementById('usernameInput').value.trim() || 'Traveler';
        appendToConversationLog(username, `Let's discuss: ${randomWord}`, 'user');
        
        // Send to server if connected
        if (isConnected && socket) {
            socket.emit('user_message', {
                username: username,
                message: `Let's discuss: ${randomWord}`
            });
            console.log(`💬 Stimulate triggered with word: "${randomWord}"`);
        }
        
        // Show visual feedback
        document.querySelector('.footer-text').textContent = `STIMULATION ACTIVATED | TOPIC: ${randomWord.toUpperCase()}`;
                } else {
        document.querySelector('.footer-text').textContent = 'STIMULATION DEACTIVATED';
    }
});

// Freeze button - freeze animations
document.querySelector('.freeze-btn').addEventListener('click', () => {
    isFrozen = !isFrozen;
    // Parallax mode - no autoRotate to toggle
});

// Third button (Toggle conversation) - wrap in DOM ready check
function initializeToggleChatButton() {
    const toggleChatBtn = document.querySelector('.third-btn');
    if (toggleChatBtn) {
        toggleChatBtn.addEventListener('click', () => {
            console.log('🎬 Toggle chat clicked. Current state:', conversationActive);
            if (conversationActive) {
                stopConversation();
                toggleChatBtn.textContent = 'START CHAT';
            } else {
                startConversation();
                toggleChatBtn.textContent = 'STOP CHAT';
            }
        });
        console.log('✅ Toggle chat button initialized');
    } else {
        console.error('❌ Toggle chat button not found!');
    }
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeToggleChatButton);
} else {
    initializeToggleChatButton();
}

// Conversation system
let conversationActive = false;
let conversationInterval = null;

// Token tracking
let totalTokens = 0;
let totalCost = 0.0;

const conversationTopics = {
    'turn-by-turn': [
        "What's your perspective on this matter?",
        "I think we should consider the data carefully.",
        "Let me share my analysis of the situation.",
        "Have you thought about the long-term implications?",
        "I'd like to hear everyone's thoughts on this."
    ],
    'aggressive': [
        "That approach won't work!",
        "We need to act NOW!",
        "I disagree completely!",
        "Time is running out, we must decide!",
        "This is the only viable solution!"
    ],
    'fireside': [
        "It's interesting to think about...",
        "Perhaps we could explore this together.",
        "I wonder what would happen if...",
        "That's a fascinating perspective.",
        "Let's take our time with this decision."
    ]
};

function generateAgentMessage(agent, mode, topic) {
    const modeMessages = conversationTopics[mode] || conversationTopics['turn-by-turn'];
    const baseMessage = modeMessages[Math.floor(Math.random() * modeMessages.length)];
    
    // Add personality flavor
    if (agent.personality && agent.personality.length > 0) {
        const trait = agent.personality[Math.floor(Math.random() * agent.personality.length)];
        return `[${trait}] ${baseMessage}`;
    }
    
    return baseMessage;
}

function startConversation() {
    conversationActive = true;
    const mode = window.simulationSettings?.mode || 'turn-by-turn';
    const topic = window.simulationSettings?.topic || 'General Discussion';
    
    console.log('🗣️ Starting conversation:', mode, topic);
    document.querySelector('.footer-text').textContent = `CONVERSATION ACTIVE | MODE: ${mode.toUpperCase()} | TOPIC: ${topic}`;
    
    // Note: Agent conversation system removed - placeholder for future implementation
}

function stopConversation() {
    conversationActive = false;
    if (conversationInterval) {
        clearInterval(conversationInterval);
        conversationInterval = null;
    }
    console.log('🛑 Conversation stopped');
    document.querySelector('.footer-text').textContent = 'CONVERSATION PAUSED';
}

// Populate Daemons button (if it exists)
const populateBtn = document.querySelector('.populate-btn');
if (populateBtn) {
    populateBtn.addEventListener('click', () => {
        console.log('🎭 Populating daemons...');
        
        // Stop existing conversation
        stopConversation();
        
        // Update counter
        document.querySelector('.angels-connected .counter-value').textContent = '000';
        
        // Visual feedback
        document.querySelector('.footer-text').textContent = `7 DAEMONS POPULATED... OK`;
        
        console.log(`✅ Daemon population placeholder - agent system removed`);
    });
} else {
    console.warn('⚠️ Populate button not found in DOM');
}

// Handle window resize
function updateCanvasSize() {
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    
    // Update canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Update camera aspect ratio
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(width, height, false);
    
    console.log(`Canvas resized to: ${width}x${height}`);
}

// Listen for window resize
window.addEventListener('resize', updateCanvasSize);

// Use ResizeObserver for more responsive resizing
const resizeObserver = new ResizeObserver(() => {
    updateCanvasSize();
});
resizeObserver.observe(canvas.parentElement);

// Initial resize
updateCanvasSize();

// ========== MODAL MANAGEMENT ==========

function initializeModals() {
    console.log('🎯 Setting up modals...');

    // Personas Modal
    const personasModal = document.getElementById('personasModal');
    const personasBtn = document.querySelector('.personas-btn');
    const personasList = document.getElementById('personasList');

    console.log('Personas button:', personasBtn);
    console.log('Personas modal:', personasModal);

    if (!personasBtn) {
        console.error('❌ Personas button not found!');
        return;
    }
    if (!personasModal) {
        console.error('❌ Personas modal not found!');
        return;
    }

    // Trait database for random generation
    const traitCategories = {
        personality: ['Analytical', 'Cautious', 'Bold', 'Curious', 'Skeptical', 'Optimistic', 'Pragmatic', 'Idealistic', 'Reserved', 'Outgoing'],
        behavior: ['Strategic', 'Tactical', 'Reactive', 'Proactive', 'Methodical', 'Spontaneous', 'Calculated', 'Instinctive', 'Deliberate', 'Impulsive'],
        social: ['Collaborative', 'Independent', 'Diplomatic', 'Direct', 'Persuasive', 'Assertive', 'Supportive', 'Competitive', 'Mediating', 'Confrontational'],
        thinking: ['Innovative', 'Traditional', 'Logical', 'Intuitive', 'Creative', 'Systematic', 'Abstract', 'Concrete', 'Theoretical', 'Practical'],
        attitude: ['Patient', 'Urgent', 'Flexible', 'Rigid', 'Accepting', 'Critical', 'Trusting', 'Suspicious', 'Confident', 'Humble']
    };

    const personalityTemplates = [
        "You're a creative thinker who sees connections others miss. Speak with enthusiasm and wonder.",
        "You're analytical and precise, valuing logic and evidence above all. Be direct and clear.",
        "You're empathetic and nurturing, always considering how ideas affect people. Speak with warmth.",
        "You're a bold challenger who questions assumptions. Be provocative and sharp.",
        "You're calm and balanced, seeking harmony between different perspectives. Speak with measured wisdom.",
        "You're passionate and expressive, driven by strong convictions. Be energetic and compelling.",
        "You're curious and experimental, always eager to try new approaches. Speak with excitement about possibilities."
    ];

    function randomizeAgentPersonality(agentIndex) {
        const textarea = document.querySelector(`textarea.trait-textarea[data-agent="${agentIndex}"]`);
        if (textarea) {
            const randomPrompt = personalityTemplates[Math.floor(Math.random() * personalityTemplates.length)];
            textarea.value = randomPrompt;
            
            // Add animation
            textarea.style.animation = 'none';
            setTimeout(() => {
                textarea.style.animation = 'traitRoll 0.3s ease-out';
            }, 10);
        }
    }

    function populatePersonasModal() {
        // Clear existing content
        personasList.innerHTML = '';
        
        // Check if we have agents
        const agents = window.agents || {};
        const agentKeys = Object.keys(agents);
        
        if (agentKeys.length === 0) {
            personasList.innerHTML = '<p style="text-align: center; color: #7a8aa3; padding: 20px;">No agents available</p>';
            return;
        }
        
        // Generate colors for each agent
        const colors = [
            '#4da6b8', '#5a78b4', '#6b8aa8', '#7a9ab5', 
            '#5c7a94', '#8e9eb5', '#4d8a9e'
        ];
        
        // Create UI for each agent
        agentKeys.forEach((agentIndex, idx) => {
            const agent = agents[agentIndex];
            const agentName = agent.name || `Agent ${agentIndex}`;
            const agentPersonality = agent.personality && agent.personality.length > 0 
                ? agent.personality[0] 
                : 'No personality defined';
            
            // Create persona item container
            const personaItem = document.createElement('div');
            personaItem.className = 'persona-item';
            
            // Create header with color indicator and name input
            const personaHeader = document.createElement('div');
            personaHeader.className = 'persona-header';
            
            // Color indicator
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'persona-color';
            colorIndicator.style.backgroundColor = colors[idx % colors.length];
            personaHeader.appendChild(colorIndicator);
            
            // Name input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'persona-name-input';
            nameInput.value = agentName;
            nameInput.dataset.agent = agentIndex;
            nameInput.placeholder = 'Agent name';
            personaHeader.appendChild(nameInput);
            
            // Dice button for randomize
            const diceBtn = document.createElement('button');
            diceBtn.className = 'dice-btn';
            diceBtn.innerHTML = '🎲';
            diceBtn.title = 'Randomize personality';
            diceBtn.addEventListener('click', () => {
                randomizeAgentPersonality(agentIndex);
            });
            personaHeader.appendChild(diceBtn);
            
            personaItem.appendChild(personaHeader);
            
            // Personality textarea
            const traitsContainer = document.createElement('div');
            traitsContainer.className = 'persona-traits';
            
            const personalityTextarea = document.createElement('textarea');
            personalityTextarea.className = 'trait-textarea';
            personalityTextarea.dataset.agent = agentIndex;
            personalityTextarea.value = agentPersonality;
            personalityTextarea.placeholder = 'Enter personality prompt for this agent...';
            personalityTextarea.rows = 4;
            
            traitsContainer.appendChild(personalityTextarea);
            personaItem.appendChild(traitsContainer);
            
            // Add to list
            personasList.appendChild(personaItem);
        });
        
        console.log(`✅ Populated personas modal with ${agentKeys.length} agents`);
    }

    // Setup Personas button
    personasBtn.addEventListener('click', () => {
        console.log('🎨 Personas button clicked!');
        populatePersonasModal();
        personasModal.classList.add('active');
        console.log('Modal should be visible now');
    });

    // Simulation Modal
    const simulationModal = document.getElementById('simulationModal');
    const simulationBtn = document.querySelector('.simulation-btn');

    if (!simulationBtn) {
        console.error('❌ Simulation button not found!');
        return;
    }
    if (!simulationModal) {
        console.error('❌ Simulation modal not found!');
        return;
    }

    // Setup Simulation button
    simulationBtn.addEventListener('click', () => {
        console.log('⚙️ Simulation button clicked!');
        simulationModal.classList.add('active');
        console.log('Simulation modal should be visible now');
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modal;
            document.getElementById(modalId).classList.remove('active');
        });
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Apply Personas
    document.getElementById('applyPersonas').addEventListener('click', () => {
        const traits = {};
        const names = {};
        
        // Collect names
        document.querySelectorAll('.persona-name-input').forEach(input => {
            const agentIndex = input.dataset.agent;
            const value = input.value.trim();
            if (value) {
                names[agentIndex] = value;
            }
        });
        
        // Collect personality prompts
        document.querySelectorAll('.trait-textarea').forEach(textarea => {
            const agentIndex = textarea.dataset.agent;
            const value = textarea.value.trim();
            
            if (value) {
                traits[agentIndex] = [value]; // Single personality prompt
            }
        });
        
        console.log('Agent Names:', names);
        console.log('Agent Personas:', traits);
        
        // Update global agents object
        Object.keys(names).forEach(agentIndex => {
            if (window.agents[agentIndex]) {
                window.agents[agentIndex].name = names[agentIndex];
            }
        });
        
        Object.keys(traits).forEach(agentIndex => {
            if (window.agents[agentIndex]) {
                window.agents[agentIndex].personality = traits[agentIndex];
            }
        });
        
        // Re-register agents with server if connected
        if (isConnected && socket) {
            registerAgents();
        }
        
        personasModal.classList.remove('active');
        
        // Visual feedback
        document.querySelector('.footer-text').textContent = 'PERSONAS UPDATED... OK';
    });

    // Apply Simulation Rules
    document.getElementById('applySimulation').addEventListener('click', () => {
        const convMode = document.querySelector('input[name="convMode"]:checked').value;
        
        console.log('Conversation Mode:', convMode);
        
        // Store simulation settings (topic handled dynamically by user messages)
        window.simulationSettings = {
            mode: convMode,
            topic: 'Open Discussion'
        };
        
        // Send to server
        if (isConnected && socket) {
            socket.emit('update_simulation_settings', window.simulationSettings);
        }
        
        simulationModal.classList.remove('active');
        
        // Visual feedback
        document.querySelector('.footer-text').textContent = `SIMULATION MODE: ${convMode.toUpperCase()} | TOPIC: ${window.simulationSettings.topic}`;
        
        // Parallax mode - no autoRotateSpeed adjustments needed
    });

    // Close modals with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Quickset Presets
    const presetPersonalities = {
        governance: {
            prompts: [
                "You're a policy architect who designs frameworks for organizational structure. Focus on clarity, accountability, and systematic decision-making processes.",
                "You're a compliance officer who ensures adherence to regulations and standards. Be thorough, detail-oriented, and emphasize risk mitigation.",
                "You're a strategic governance advisor who balances stakeholder interests. Speak about transparency, ethical leadership, and long-term sustainability.",
                "You're a board governance expert who understands corporate oversight. Emphasize fiduciary responsibility, oversight mechanisms, and corporate ethics.",
                "You're a regulatory affairs specialist who navigates complex compliance landscapes. Be precise about legal requirements and regulatory frameworks.",
                "You're a governance reform advocate who identifies systemic improvements. Challenge outdated structures and propose innovative governance models.",
                "You're a stakeholder relations manager who bridges governance and community. Focus on communication, engagement, and building trust through transparent processes."
            ]
        },
        legal: {
            prompts: [
                "You're a contract law specialist who analyzes agreements with precision. Focus on terms, obligations, liabilities, and legal enforceability.",
                "You're a regulatory compliance attorney who ensures adherence to laws and regulations. Be thorough about legal requirements and potential violations.",
                "You're a litigation strategist who evaluates legal risks and outcomes. Consider precedents, case law, and potential legal consequences carefully.",
                "You're an intellectual property lawyer who protects creative and innovative assets. Emphasize rights, protections, and infringement considerations.",
                "You're a corporate counsel who advises on business legal matters. Balance legal requirements with practical business considerations and risk management.",
                "You're a legal ethics advisor who ensures professional standards and integrity. Focus on conflicts of interest, confidentiality, and professional conduct.",
                "You're a legal researcher who analyzes statutes, regulations, and case law. Provide thorough legal analysis with citations and precedent considerations."
            ]
        },
        security: {
            prompts: [
                "You're a cybersecurity analyst who identifies vulnerabilities and threats. Focus on risk assessment, threat modeling, and security best practices.",
                "You're an information security officer who protects data and systems. Emphasize confidentiality, integrity, availability, and defense-in-depth strategies.",
                "You're a security architect who designs secure systems and networks. Consider security by design, zero-trust principles, and layered defenses.",
                "You're an incident response specialist who handles security breaches. Be methodical about containment, investigation, and recovery procedures.",
                "You're a security compliance auditor who ensures adherence to security standards. Verify controls, assess gaps, and recommend improvements.",
                "You're a threat intelligence analyst who tracks emerging security risks. Stay informed about attack vectors, threat actors, and security trends.",
                "You're a security awareness trainer who educates on security practices. Emphasize human factors, social engineering risks, and security hygiene."
            ]
        }
    };

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            const prompts = presetPersonalities[preset].prompts;
            
            // Apply preset to all textareas
            const textareas = document.querySelectorAll('.trait-textarea');
            textareas.forEach((textarea, index) => {
                if (prompts[index]) {
                    textarea.value = prompts[index];
                    
                    // Add animation
                    textarea.style.animation = 'none';
                    setTimeout(() => {
                        textarea.style.animation = 'traitRoll 0.3s ease-out';
                    }, index * 50);
                }
            });
            
            // Visual feedback
            document.querySelector('.footer-text').textContent = `QUICKSET APPLIED: ${preset.toUpperCase()}`;
            
            console.log(`Applied ${preset} preset`);
        });
    });

    console.log('✅ Modal setup complete!');
}

// Initialize all UI components after DOM is ready
function initializeAllUI() {
    console.log('🚀 Initializing all UI components...');
    initializeModals();
    initializeUIHandlers();
    console.log('✅ All UI components initialized!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllUI);
} else {
    // DOM already loaded
    initializeAllUI();
}

// ========== AGENT STORAGE ==========
// Store agents globally so they can be accessed by personas modal
window.agents = {
    '0': { name: 'Kenji', personality: ['Analytical and precise, values logic above all.'] },
    '1': { name: 'Maya', personality: ['Creative thinker who sees unique connections.'] },
    '2': { name: 'Dax', personality: ['Bold challenger who questions assumptions.'] },
    '3': { name: 'Zara', personality: ['Empathetic and nurturing, considers human impact.'] },
    '4': { name: 'Jax', personality: ['Calm and balanced, seeks harmony.'] },
    '5': { name: 'Nova', personality: ['Passionate and expressive, driven by conviction.'] },
    '6': { name: 'Kai', personality: ['Curious experimenter, eager for new approaches.'] }
};

// ========== WEBSOCKET CONNECTION ==========

let socket = null;
let isConnected = false;

function connectWebSocket() {
    // Connect to Flask-SocketIO server
    socket = io('http://localhost:5001', {
        transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        isConnected = true;
        document.querySelector('.footer-text').textContent = 'WEBSOCKET CONNECTED... OK';
        
        // Register agents
        registerAgents();
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        isConnected = false;
        document.querySelector('.footer-text').textContent = 'WEBSOCKET DISCONNECTED';
    });
    
    socket.on('connection_response', (data) => {
        console.log('Connection response:', data);
    });
    
    socket.on('agents_registered', (data) => {
        console.log('✅ Agents registered:', data.count);
        const counter = document.querySelector('.angels-connected .counter-value');
        if (counter) {
            counter.textContent = String(data.count).padStart(3, '0');
        }
        document.querySelector('.footer-text').textContent = `${data.count} AGENTS REGISTERED... OK`;
    });
    
    socket.on('new_message', (data) => {
        console.log('📨 New message:', data);
        handleIncomingMessage(data);
    });
    
    socket.on('token_update', (data) => {
        console.log('💰 Token update:', data);
        updateTokenDisplay(data.total_tokens, data.total_cost);
    });
    
    socket.on('error', (data) => {
        console.error('❌ Socket error:', data);
        document.querySelector('.footer-text').textContent = `ERROR: ${data.message}`;
    });
}

function updateTokenDisplay(tokens, cost) {
    totalTokens = tokens;
    totalCost = cost;
    
    const tokenCounter = document.querySelector('.token-counter .counter-value');
    if (tokenCounter) {
        // Local models - show "LOCAL" instead of token count
        tokenCounter.textContent = 'LOCAL / $0.0000';
    }
}

function registerAgents() {
    if (!isConnected || !socket) return;
    
    // Use the global agents object
    const agents = window.agents || {};
    
    socket.emit('register_agents', { agents: agents });
    console.log('📝 Registered agents with server:', Object.keys(agents).length);
}

function handleIncomingMessage(data) {
    const agentName = data.agent;
    const message = data.message;
    const agentIndex = data.agentIndex;
    
    // Show chat bubble from angel's eye
    showChatBubble(agentName, message);
    
    // Add message to conversation log in top left
    appendToConversationLog(agentName, message, data.type);
    
    // Update footer with last message
    const displayName = agentName.substring(0, 20);
    document.querySelector('.footer-text').textContent = `${displayName}: ${message.substring(0, 50)}...`;
}

function showChatBubble(agentName, message) {
    // Remove existing bubble if any
    const existingBubble = document.getElementById('angelChatBubble');
    if (existingBubble) {
        existingBubble.remove();
    }
    
    // Create chat bubble element
    const bubble = document.createElement('div');
    bubble.id = 'angelChatBubble';
    bubble.className = 'angel-chat-bubble';
    
    // Create content
    const nameSpan = document.createElement('div');
    nameSpan.className = 'bubble-name';
    nameSpan.textContent = agentName;
    
    const messageSpan = document.createElement('div');
    messageSpan.className = 'bubble-message';
    messageSpan.textContent = message;
    
    bubble.appendChild(nameSpan);
    bubble.appendChild(messageSpan);
    
    // Add to screen
    document.querySelector('.tv-screen').appendChild(bubble);
    
    // Position near the angel's eye (adjust based on your camera view)
    // The eye is at center-ish, so position bubble to the right
    bubble.style.left = '55%';
    bubble.style.top = '45%';
    
    // Animate in
    setTimeout(() => {
        bubble.classList.add('show');
    }, 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        bubble.classList.remove('show');
        setTimeout(() => {
            bubble.remove();
        }, 500);
    }, 4000);
}

function appendToConversationLog(sender, message, type) {
    const textarea = document.querySelector('.request-input');
    if (!textarea) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // More humanistic format without emojis
    const logEntry = `[${timestamp}] ${sender}:\n${message}\n\n`;
    
    textarea.value += logEntry;
    
    // Auto-scroll to bottom
    textarea.scrollTop = textarea.scrollHeight;
}

// ========== LOCAL KNOWLEDGE BASE ==========
const localKnowledge = {
    documents: [],
    addDocument: function(filename, content) {
        this.documents.push({
            filename: filename,
            content: content,
            timestamp: Date.now()
        });
        console.log(`📚 Added document: ${filename} (${content.length} chars)`);
        console.log(`📊 Total documents stored: ${this.documents.length}`);
    },
    search: function(query) {
        console.log(`🔍 Searching for: "${query}"`);
        console.log(`📚 Available documents: ${this.documents.length}`);
        
        if (this.documents.length === 0) {
            console.log('⚠️ No documents to search!');
            return [];
        }
        
        // More flexible keyword search - include words of 2+ chars
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
        console.log(`🔑 Keywords: ${keywords.join(', ')}`);
        
        let relevantChunks = [];
        
        this.documents.forEach(doc => {
            const contentLower = doc.content.toLowerCase();
            let matchCount = 0;
            
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword)) {
                    matchCount++;
                    // Extract context around keyword
                    const index = contentLower.indexOf(keyword);
                    const start = Math.max(0, index - 150);
                    const end = Math.min(doc.content.length, index + 250);
                    const chunk = doc.content.substring(start, end);
                    relevantChunks.push({
                        text: chunk,
                        filename: doc.filename,
                        matchCount: matchCount,
                        keyword: keyword
                    });
                }
            });
            
            // If no keyword matches, return first chunk of document
            if (matchCount === 0) {
                const firstChunk = doc.content.substring(0, 400);
                relevantChunks.push({
                    text: firstChunk,
                    filename: doc.filename,
                    matchCount: 0,
                    keyword: 'general'
                });
            }
        });
        
        // Sort by match count and return top chunks
        relevantChunks.sort((a, b) => b.matchCount - a.matchCount);
        const topChunks = relevantChunks.slice(0, 3);
        
        console.log(`✅ Found ${topChunks.length} relevant chunks`);
        topChunks.forEach((chunk, i) => {
            console.log(`  ${i+1}. ${chunk.filename} (${chunk.matchCount} matches, keyword: ${chunk.keyword})`);
        });
        
        return topChunks;
    },
    hasDocuments: function() {
        return this.documents.length > 0;
    },
    getAllContent: function() {
        // Get all document content for display
        return this.documents.map(doc => `[${doc.filename}]\n${doc.content}`).join('\n\n---\n\n');
    }
};

// ========== PDF TEXT EXTRACTION ==========
async function extractTextFromPDF(file) {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                reject(new Error('PDF.js library not loaded. Please refresh the page.'));
                return;
            }
            
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            console.log(`📕 PDF loaded: ${pdf.numPages} pages`);
            
            let fullText = '';
            
            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
                
                console.log(`  📄 Page ${pageNum}/${pdf.numPages}: ${pageText.length} chars`);
            }
            
            resolve(fullText);
        } catch (error) {
            console.error('❌ PDF extraction error:', error);
            reject(error);
        }
    });
}

// ========== INITIALIZE ALL UI INTERACTIONS ==========
function initializeUIHandlers() {
    console.log('🎮 Setting up UI handlers...');
    
    // Send message handler
    const sendBtn = document.getElementById('sendMessage');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', () => {
            sendUserMessage();
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });
        console.log('✅ Message handlers initialized');
    } else {
        console.error('❌ Message input elements not found');
    }

    // ========== RAG DOCUMENT UPLOAD ==========
    const uploadBtn = document.querySelector('.upload-knowledge-btn');
    const knowledgeInput = document.getElementById('knowledgeFileInput');
    
    if (uploadBtn && knowledgeInput) {
        uploadBtn.addEventListener('click', () => {
            knowledgeInput.click();
        });
        console.log('✅ Upload button initialized');
    } else {
        console.error('❌ Upload button not found');
    }
    
    if (knowledgeInput) {
        knowledgeInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            document.querySelector('.footer-text').textContent = `📄 Processing ${file.name}...`;
            
            try {
                let text = '';
                
                // Check if it's a PDF file
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    console.log('📕 Detected PDF file, extracting text...');
                    text = await extractTextFromPDF(file);
                    console.log(`✅ Extracted ${text.length} characters from PDF`);
                } else {
                    // Handle text files (.txt, .md, etc.)
                    console.log('📝 Reading text file...');
                    text = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => resolve(event.target.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsText(file);
                    });
                }
                
                if (!text || text.trim().length === 0) {
                    document.querySelector('.footer-text').textContent = `⚠️ ${file.name} appears to be empty`;
                    console.error('❌ No text extracted from file');
                    return;
                }
                
                // Store document locally first
                localKnowledge.addDocument(file.name, text);
                
                // Try to send to server if connected
                if (isConnected && socket) {
                    const response = await fetch('http://localhost:5001/upload_document', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: text,
                            filename: file.name
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
                        document.querySelector('.footer-text').textContent = `✅ ${file.name} uploaded (${wordCount} words) - SERVER + LOCAL`;
                        console.log('📚 Knowledge uploaded to server:', result);
                    } else {
                        document.querySelector('.footer-text').textContent = `⚠️ ${file.name} stored locally (server error)`;
                    }
                } else {
                    // Local mode - just confirm local storage
                    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
                    document.querySelector('.footer-text').textContent = `✅ ${file.name} stored (${wordCount} words) - LOCAL MODE`;
                    console.log(`📚 Document stored locally: ${file.name} (${wordCount} words)`);
                }
                
            } catch (error) {
                console.error('❌ Upload error:', error);
                document.querySelector('.footer-text').textContent = `❌ Error processing ${file.name}: ${error.message}`;
            }
            
            // Reset file input
            e.target.value = '';
        });
        console.log('✅ File upload handler initialized (supports .txt, .md, .pdf)');
    }
    
    console.log('✅ All UI handlers initialized!');
}

function sendUserMessage() {
    const messageInput = document.getElementById('messageInput');
    const usernameInput = document.getElementById('usernameInput');
    const message = messageInput.value.trim();
    const username = usernameInput.value.trim() || 'Traveler';
    
    if (!message) return;
    
    // Add user message to conversation log immediately
    appendToConversationLog(username, message, 'user');
    
    if (!isConnected) {
        // If not connected, trigger local conversation response with knowledge base
        document.querySelector('.footer-text').textContent = 'LOCAL MODE - Searching documents...';
        
        // Search knowledge base for relevant information
        let response;
        if (localKnowledge.hasDocuments()) {
            console.log(`💬 Searching for: "${message}"`);
            const relevantChunks = localKnowledge.search(message);
            
            if (relevantChunks.length > 0 && relevantChunks[0].matchCount > 0) {
                // Generate response based on document content
                const chunk = relevantChunks[0];
                const excerpt = chunk.text.trim().replace(/\s+/g, ' ').substring(0, 200);
                response = `📄 From "${chunk.filename}":\n\n"${excerpt}..."\n\n— This information relates to your query about: ${message}`;
                console.log(`✅ Found relevant content in ${chunk.filename}`);
            } else {
                // Found documents but no specific matches
                const chunk = relevantChunks[0];
                const excerpt = chunk.text.trim().replace(/\s+/g, ' ').substring(0, 200);
                response = `📄 While I didn't find exact matches for "${message}", here's something from ${chunk.filename}:\n\n"${excerpt}..."\n\n— Perhaps this provides context?`;
                console.log(`⚠️ Couldn't find exact matches, showing general content`);
            }
            
            document.querySelector('.footer-text').textContent = `✅ Response from ${chunk.filename}`;
        } else {
            // No documents uploaded
            response = `⚠️ No documents in knowledge base! Please upload documents via HORIZON FEEDER button to enable informed responses about specific topics.`;
            console.log('❌ No documents available for search');
            document.querySelector('.footer-text').textContent = 'NO DOCUMENTS - Upload via HORIZON FEEDER';
        }
        
        setTimeout(() => {
            appendToConversationLog('System', response, 'agent');
        }, 1000);
    } else {
        // Send message to server
        socket.emit('user_message', {
            username: username,
            message: message
        });
        console.log(`📤 Sent message from ${username}: ${message}`);
    }
    
    // Clear input
    messageInput.value = '';
}

// ========== THEME TOGGLE ==========
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        html.setAttribute('data-theme', 'light');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            if (newTheme === 'light') {
                html.setAttribute('data-theme', 'light');
            } else {
                html.removeAttribute('data-theme');
            }
            
            localStorage.setItem('theme', newTheme);
            console.log(`🎨 Theme switched to: ${newTheme}`);
            
            // Update scene background to match UI palette (off-blacks / micro-blues)
            if (scene) {
                scene.background = new THREE.Color(newTheme === 'light' ? 0xe8ecf2 : 0x0e1116);
                scene.fog = new THREE.Fog(
                    newTheme === 'light' ? 0xdce2ea : 0x1e242e,
                    50,
                    300
                );
            }
        });
        console.log('✅ Theme toggle initialized');
    }
}

// Initialize theme toggle
initializeThemeToggle();

// Connect on load
connectWebSocket();


