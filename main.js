import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';

// ========== SCENE SETUP ==========
const canvas = document.getElementById('threeCanvas');
const scene = new THREE.Scene();

// Deep Space Background
scene.background = new THREE.Color(0x050510); // Very dark space color
scene.fog = new THREE.FogExp2(0x050510, 0.001); // Subtle fog for depth

// Create starfield background
const starsGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 3000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starsMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 1.5,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Add distant planet on horizon
const planetGeometry = new THREE.SphereGeometry(40, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x5A7FAF,
    emissive: 0x2A4F7F,
    emissiveIntensity: 0.4,
    roughness: 0.7,
    metalness: 0.3
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(150, -20, -200);
scene.add(planet);

// Planet atmosphere glow (multiple layers for depth)
const glowGeometry1 = new THREE.SphereGeometry(42, 64, 64);
const glowMaterial1 = new THREE.MeshBasicMaterial({
    color: 0x7A9FDF,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
});
const planetGlow = new THREE.Mesh(glowGeometry1, glowMaterial1);
planetGlow.position.copy(planet.position);
scene.add(planetGlow);

// Outer atmosphere layer
const glowGeometry2 = new THREE.SphereGeometry(45, 64, 64);
const glowMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x9ABFFF,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
});
const planetGlow2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
planetGlow2.position.copy(planet.position);
scene.add(planetGlow2);

// Add rim light for the planet
const planetRimLight = new THREE.PointLight(0x6A8FDF, 2, 150);
planetRimLight.position.set(140, -15, -190);
scene.add(planetRimLight);

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
// Zoomed out bird's eye view directly above the scene
camera.position.set(0, 60, 0); // Directly above, zoomed out
camera.lookAt(0, 0, 0); // Looking straight down at center

// Renderer
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true 
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Space Lighting - Dark and minimal
const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
scene.add(ambientLight);

// Dim directional light from planet
const planetLight = new THREE.DirectionalLight(0x4A5F8F, 0.4);
planetLight.position.set(150, -20, -200);
scene.add(planetLight);

// Ethereal center light for sacred geometry
const centerLight = new THREE.PointLight(0xAA88FF, 1.2, 50);
centerLight.position.set(0, 0, 0);
scene.add(centerLight);

// Accent lights for each orb (cosmic colors)
const accentLight1 = new THREE.PointLight(0x1CFFAC, 0.8, 30);
accentLight1.position.set(8, 0, 8);
scene.add(accentLight1);

const accentLight2 = new THREE.PointLight(0x00BFFF, 0.8, 30);
accentLight2.position.set(-8, 0, 8);
scene.add(accentLight2);

const accentLight3 = new THREE.PointLight(0xFF1CAC, 0.8, 30);
accentLight3.position.set(0, 0, -8);
scene.add(accentLight3);

// ========== SPACE ENVIRONMENT (No water or sand - pure void) ==========
// Space is infinite void - no ground plane needed

// Add nebula-like particle clouds in distance
const nebulaGeometry = new THREE.BufferGeometry();
const nebulaVertices = [];
const nebulaColors = [];
for (let i = 0; i < 800; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = 100 + Math.random() * 200;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta) - 50;
    const z = radius * Math.cos(phi);
    
    nebulaVertices.push(x, y, z);
    
    // Purple/blue nebula colors
    const colorChoice = Math.random();
    if (colorChoice < 0.4) {
        nebulaColors.push(0.4, 0.2, 0.8); // Purple
    } else if (colorChoice < 0.7) {
        nebulaColors.push(0.2, 0.4, 0.9); // Blue
    } else {
        nebulaColors.push(0.6, 0.3, 0.9); // Pink-purple
    }
}
nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
nebulaGeometry.setAttribute('color', new THREE.Float32BufferAttribute(nebulaColors, 3));

const nebulaMaterial = new THREE.PointsMaterial({
    size: 4,
    transparent: true,
    opacity: 0.4,
    vertexColors: true,
    blending: THREE.AdditiveBlending
});
const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
scene.add(nebula);

// ========== ETHEREAL ORB AGENT CLASS ==========
class AIAgent {
    constructor(position, color, name, index) {
        this.name = name;
        this.originalColor = color;
        this.index = index;
        
        // Activity and animation properties
        this.isActive = false;
        this.activityDecay = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.floatPhase = Math.random() * Math.PI * 2;
        
        // Create ethereal orb
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        
        // Core orb with glow
        const orbGeometry = new THREE.SphereGeometry(1, 32, 32);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: 0.9
        });
        this.orb = new THREE.Mesh(orbGeometry, orbMaterial);
        this.mesh.add(this.orb);
        
        // Inner glow core
        const innerGlowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        this.innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.mesh.add(this.innerGlow);
        
        // Outer ethereal shell
        const outerShellGeometry = new THREE.SphereGeometry(1.3, 32, 32);
        const outerShellMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.outerShell = new THREE.Mesh(outerShellGeometry, outerShellMaterial);
        this.mesh.add(this.outerShell);
        
        // Energy particles orbiting the orb
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            const radius = 1.5 + Math.random() * 0.5;
            particlePositions.push(
                Math.sin(theta) * Math.cos(phi) * radius,
                Math.sin(theta) * Math.sin(phi) * radius,
                Math.cos(theta) * radius
            );
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mesh.add(this.particles);
        
        // Rotating energy rings
        const ring1Geometry = new THREE.TorusGeometry(1.6, 0.03, 16, 100);
        const ringMaterial1 = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        this.ring1 = new THREE.Mesh(ring1Geometry, ringMaterial1);
        this.ring1.rotation.x = Math.PI / 2;
        this.mesh.add(this.ring1);
        
        const ring2Geometry = new THREE.TorusGeometry(1.8, 0.02, 16, 100);
        const ringMaterial2 = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        this.ring2 = new THREE.Mesh(ring2Geometry, ringMaterial2);
        this.ring2.rotation.y = Math.PI / 3;
        this.mesh.add(this.ring2);
        
        // Create label
        this.createLabel(name);
        
        scene.add(this.mesh);
    }
    
    createLabel(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 24px "Space Mono", monospace';
        context.textAlign = 'center';
        context.fillText(text, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        this.label = new THREE.Sprite(spriteMaterial);
        this.label.scale.set(4, 1, 1);
        this.label.position.y = 2.5; // Above the orb
        this.mesh.add(this.label);
    }
    
    updateLabel(text) {
        this.name = text;
        if (this.label) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            
            context.fillStyle = '#FFFFFF';
            context.font = 'bold 24px "Space Mono", monospace';
            context.textAlign = 'center';
            context.fillText(text, 128, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            this.label.material.map = texture;
            this.label.material.needsUpdate = true;
        }
    }
    
    showMessage(message) {
        // Create or update speech bubble - D&D fantasy scroll style
        if (!this.speechBubble) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 256;
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                opacity: 1.0
            });
            this.speechBubble = new THREE.Sprite(spriteMaterial);
            this.speechBubble.scale.set(6, 3, 1);
            this.speechBubble.position.y = 4; // Float above orb and label
            this.mesh.add(this.speechBubble);
        }
        
        // Draw D&D fantasy scroll bubble
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Create parchment background with gradient for depth
        const parchmentGradient = context.createLinearGradient(0, 0, 0, 256);
        parchmentGradient.addColorStop(0, '#F4E8D0');
        parchmentGradient.addColorStop(0.5, '#E8D5B7');
        parchmentGradient.addColorStop(1, '#D4C4A8');
        
        // Draw main scroll background
        const margin = 20;
        context.fillStyle = parchmentGradient;
        context.beginPath();
        context.roundRect(margin, margin, 512 - margin * 2, 256 - margin * 2, 15);
        context.fill();
        
        // Add texture/aging to parchment
        context.globalAlpha = 0.08;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * (512 - margin * 2) + margin;
            const y = Math.random() * (256 - margin * 2) + margin;
            const size = Math.random() * 3;
            context.fillStyle = '#000000';
            context.fillRect(x, y, size, size);
        }
        context.globalAlpha = 1.0;
        
        // Draw ornate border with agent color accent
        const colorR = (this.originalColor >> 16) & 255;
        const colorG = (this.originalColor >> 8) & 255;
        const colorB = this.originalColor & 255;
        
        // Outer border with color
        context.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, 0.8)`;
        context.lineWidth = 4;
        context.beginPath();
        context.roundRect(margin, margin, 512 - margin * 2, 256 - margin * 2, 15);
        context.stroke();
        
        // Inner decorative border
        context.strokeStyle = '#8B6914';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(margin + 5, margin + 5, 512 - (margin + 5) * 2, 256 - (margin + 5) * 2, 12);
        context.stroke();
        
        // Decorative corners (medieval style)
        const cornerSize = 15;
        context.fillStyle = `rgba(${colorR}, ${colorG}, ${colorB}, 0.7)`;
        // Top-left
        context.fillRect(margin + 8, margin + 8, cornerSize, 3);
        context.fillRect(margin + 8, margin + 8, 3, cornerSize);
        // Top-right
        context.fillRect(512 - margin - 8 - cornerSize, margin + 8, cornerSize, 3);
        context.fillRect(512 - margin - 8 - 3, margin + 8, 3, cornerSize);
        // Bottom-left
        context.fillRect(margin + 8, 256 - margin - 8 - 3, cornerSize, 3);
        context.fillRect(margin + 8, 256 - margin - 8 - cornerSize, 3, cornerSize);
        // Bottom-right
        context.fillRect(512 - margin - 8 - cornerSize, 256 - margin - 8 - 3, cornerSize, 3);
        context.fillRect(512 - margin - 8 - 3, 256 - margin - 8 - cornerSize, 3, cornerSize);
        
        // Text with excellent readability
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 2;
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;
        context.fillStyle = '#2C1810'; // Dark brown for medieval feel
        context.font = 'bold 20px "Georgia", serif'; // More medieval-looking font
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Wrap text
        const words = message.split(' ');
        let line = '';
        let lines = [];
        
        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = context.measureText(testLine);
            if (metrics.width > 420 && line !== '') {
                lines.push(line);
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        // Draw lines centered
        const lineHeight = 28;
        const startY = 128 - ((lines.length - 1) * lineHeight) / 2;
        
        lines.forEach((line, i) => {
            context.fillText(line, 256, startY + i * lineHeight);
        });
        
        // Update texture
        const texture = new THREE.CanvasTexture(canvas);
        this.speechBubble.material.map = texture;
        this.speechBubble.material.needsUpdate = true;
        this.speechBubble.visible = true;
        
        // Animate bubble - float up and fade
        const bubbleStartY = 4;
        const startTime = Date.now();
        const duration = 5000;
        
        const animateBubble = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1 && this.speechBubble) {
                this.speechBubble.position.y = bubbleStartY + progress * 3; // Float upward more
                this.speechBubble.material.opacity = 0.9 * (1 - progress); // Fade out
                requestAnimationFrame(animateBubble);
            } else if (this.speechBubble) {
                this.speechBubble.visible = false;
                this.speechBubble.position.y = bubbleStartY;
                this.speechBubble.material.opacity = 0.9;
            }
        };
        
        animateBubble();
    }
    
    update() {
        const time = Date.now() * 0.001;
        
        // Floating animation - gentle up and down
        this.floatPhase += 0.01;
        this.mesh.position.y += Math.sin(this.floatPhase) * 0.002;
        
        // Pulsing core orb
        this.pulsePhase += 0.02;
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.05;
        if (this.orb) {
            this.orb.scale.set(pulseScale, pulseScale, pulseScale);
        }
        
        // Pulsing glow intensity
        const glowIntensity = 0.8 + Math.sin(this.pulsePhase * 1.5) * 0.3;
        if (this.orb && this.orb.material) {
            this.orb.material.emissiveIntensity = glowIntensity;
        }
        
        // Rotate outer shell slowly
        if (this.outerShell) {
            this.outerShell.rotation.y += 0.005;
            this.outerShell.rotation.x += 0.003;
        }
        
        // Rotate inner glow opposite direction
        if (this.innerGlow) {
            this.innerGlow.rotation.y -= 0.008;
            this.innerGlow.rotation.z += 0.004;
        }
        
        // Rotate particles
        if (this.particles) {
            this.particles.rotation.y += 0.01;
            this.particles.rotation.x += 0.005;
        }
        
        // Rotate energy rings
        if (this.ring1) {
            this.ring1.rotation.z += 0.015;
        }
        if (this.ring2) {
            this.ring2.rotation.x += 0.01;
        }
        
        // Enhanced glow when active/speaking
        if (this.activityDecay > 0) {
            this.activityDecay -= 0.01;
            const activityIntensity = 1.2 + this.activityDecay * 0.8;
            if (this.orb && this.orb.material) {
                this.orb.material.emissiveIntensity = activityIntensity;
            }
            // Scale up slightly when active
            const activeScale = 1 + this.activityDecay * 0.15;
            this.mesh.scale.set(activeScale, activeScale, activeScale);
        } else {
            // Return to normal scale
            const currentScale = this.mesh.scale.x;
            if (currentScale > 1.01) {
                this.mesh.scale.set(currentScale * 0.98, currentScale * 0.98, currentScale * 0.98);
            } else {
                this.mesh.scale.set(1, 1, 1);
            }
        }
    }
    
    stimulate() {
        // Animate when speaking
        this.activityDecay = 1.0;
        this.isActive = true;
        
        setTimeout(() => {
            this.isActive = false;
        }, 1500);
    }
    
    freeze() {
        this.pulsePhase = 0;
    }
}

// ========== COMMUNICATION LINE CLASS ==========
class CommunicationLine {
    constructor(agent1, agent2) {
        this.agent1 = agent1;
        this.agent2 = agent2;
        
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ 
            color: 0x88DDFF,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        this.line = new THREE.Line(geometry, material);
        scene.add(this.line);
        
        this.active = false;
        this.opacity = 0;
    }
    
    update() {
        // Update line positions
        const positions = new Float32Array([
            this.agent1.mesh.position.x,
            this.agent1.mesh.position.y,
            this.agent1.mesh.position.z,
            this.agent2.mesh.position.x,
            this.agent2.mesh.position.y,
            this.agent2.mesh.position.z
        ]);
        
        this.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Fade in/out effect
        if (this.active) {
            this.opacity = Math.min(1, this.opacity + 0.05);
        } else {
            this.opacity = Math.max(0, this.opacity - 0.02);
        }
        
        this.line.material.opacity = this.opacity;
    }
    
    activate() {
        this.active = true;
        setTimeout(() => {
            this.active = false;
        }, 2000);
    }
}

// ========== CREATE AGENTS ==========
const agents = [];
const agentNames = ['YOU', 'Osiris', 'Solomon', 'Azura', 'Simba', 'Harichi', 'Angel'];
const agentColors = [0x1CFFAC, 0x00BFFF, 0xFF1CAC, 0xFFAC1C, 0xAC1CFF, 0xFFD700, 0xFF69B4];

// Default personalities for each agent
const defaultPersonalities = [
    ['daemon-protocol', 'systematic', 'guardian'],              // YOU
    ['ancient-wisdom', 'judicious', 'transcendent'],            // Osiris
    ['enigmatic', 'strategic', 'observer'],                     // Solomon
    ['intellectually-proud', 'precise', 'tsundere'],            // Azura - electronic consciousness
    ['instinctive', 'protective', 'noble'],                     // Simba
    ['harmonious', 'meditative', 'balanced'],                   // Harichi
    ['compassionate', 'ethereal', 'nurturing']                  // Angel
];

function createAgents(count = 7) {
    // Clear existing agents
    agents.forEach(agent => {
        scene.remove(agent.mesh);
    });
    agents.length = 0;
    
    // Flower of Life pattern - sacred geometry positions
    // 1 center + 6 around in perfect hexagonal pattern
    const radius = 8; // Distance between orbs
    
    // Positions based on Flower of Life geometry - perfect circle with 7 agents
    const positions = [
        new THREE.Vector3(0, 0, 0), // Center - YOU
    ];
    
    // Add 6 orbs in perfect hexagon around center
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        positions.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        ));
    }
    
    for (let i = 0; i < count; i++) {
        const agent = new AIAgent(
            positions[i], 
            agentColors[i % agentColors.length], 
            agentNames[i % agentNames.length],
            i
        );
        // Apply default personality
        agent.personality = defaultPersonalities[i % defaultPersonalities.length];
        agents.push(agent);
    }
    
    console.log('✅ Agents created with default personalities');
}

// Initialize agents
createAgents(7);

// ========== ENHANCED FLOWER OF LIFE SACRED GEOMETRY ==========
const flowerOfLifeGroup = new THREE.Group();
const radius = 8;

// Create overlapping circles forming Flower of Life pattern (multiple layers)
const circlePositions = [
    { x: 0, z: 0 }, // Center
    { x: radius, z: 0 },
    { x: radius / 2, z: radius * Math.sqrt(3) / 2 },
    { x: -radius / 2, z: radius * Math.sqrt(3) / 2 },
    { x: -radius, z: 0 },
    { x: -radius / 2, z: -radius * Math.sqrt(3) / 2 },
    { x: radius / 2, z: -radius * Math.sqrt(3) / 2 },
];

// Layer 1: Main glowing circles with cosmic colors
circlePositions.forEach((pos, i) => {
    // Primary ring with gradient effect
    const circleGeometry = new THREE.RingGeometry(radius - 0.15, radius + 0.15, 128);
    const colorCycle = i / circlePositions.length;
    const hue = 0.6 + colorCycle * 0.3; // Purple to cyan spectrum
    const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
    
    const circleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(pos.x, 0, pos.z);
    flowerOfLifeGroup.add(circle);
    
    // Secondary glow layer
    const glowCircleGeometry = new THREE.RingGeometry(radius - 0.3, radius + 0.3, 128);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const glowCircle = new THREE.Mesh(glowCircleGeometry, glowMaterial);
    glowCircle.rotation.x = -Math.PI / 2;
    glowCircle.position.set(pos.x, -0.1, pos.z);
    flowerOfLifeGroup.add(glowCircle);
    
    // Add pulsing light spheres at circle centers
    if (i > 0) {
        const lightSphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const lightSphereMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
        lightSphere.position.set(pos.x, 0, pos.z);
        lightSphere.userData.baseY = 0;
        lightSphere.userData.phase = i * Math.PI / 3;
        flowerOfLifeGroup.add(lightSphere);
    }
});

// Add geometric pattern lines connecting intersections (Seed of Life)
const lineColor = new THREE.Color(0xAA88FF);
for (let i = 1; i < circlePositions.length; i++) {
    const points = [
        new THREE.Vector3(circlePositions[0].x, 0.1, circlePositions[0].z),
        new THREE.Vector3(circlePositions[i].x, 0.1, circlePositions[i].z)
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    flowerOfLifeGroup.add(line);
}

// Central brilliant core
const coreGeometry = new THREE.SphereGeometry(0.8, 32, 32);
const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.position.set(0, 0, 0);
flowerOfLifeGroup.add(core);

// Outer sacred geometry ring (Metatron's influence)
const outerRingGeometry = new THREE.RingGeometry(radius * 1.8, radius * 1.85, 128);
const outerRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x8866FF,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
});
const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
outerRing.rotation.x = -Math.PI / 2;
outerRing.position.y = -0.2;
flowerOfLifeGroup.add(outerRing);

scene.add(flowerOfLifeGroup);

// Animate sacred geometry (NO PILLAR - removed)
function animateFlowerOfLife() {
    const time = Date.now() * 0.001;
    
    // Slow elegant rotation
    flowerOfLifeGroup.rotation.y += 0.002;
    
    // Pulse light spheres
    flowerOfLifeGroup.children.forEach(child => {
        if (child.userData.phase !== undefined) {
            const pulse = Math.sin(time * 2 + child.userData.phase) * 0.3;
            child.position.y = child.userData.baseY + pulse;
            if (child.material) {
                child.material.opacity = 0.4 + Math.abs(pulse) * 0.6;
            }
        }
    });
    
    // Pulse central core
    const corePulse = 1 + Math.sin(time * 3) * 0.15;
    if (core) {
        core.scale.set(corePulse, corePulse, corePulse);
        core.material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
    }
}

// ========== COMMUNICATION LINES ==========
const communicationLines = [];

// Create lines between agents
for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
        const line = new CommunicationLine(agents[i], agents[j]);
        communicationLines.push(line);
    }
}

// Random communication activation
let isStimulated = false;
let isFrozen = false;

function triggerRandomCommunication() {
    if (!isFrozen && agents.length > 0 && communicationLines.length > 0) {
        const randomLine = communicationLines[Math.floor(Math.random() * communicationLines.length)];
        randomLine.activate();
        
        // Flash agents - animate the orb's emissive intensity
        if (randomLine.agent1.orb && randomLine.agent1.orb.material) {
            const originalIntensity1 = randomLine.agent1.orb.material.emissiveIntensity;
            randomLine.agent1.orb.material.emissiveIntensity = 1.5;
            setTimeout(() => {
                if (randomLine.agent1.orb && randomLine.agent1.orb.material) {
                    randomLine.agent1.orb.material.emissiveIntensity = originalIntensity1;
                }
            }, 200);
        }
        
        if (randomLine.agent2.orb && randomLine.agent2.orb.material) {
            const originalIntensity2 = randomLine.agent2.orb.material.emissiveIntensity;
            randomLine.agent2.orb.material.emissiveIntensity = 1.5;
            setTimeout(() => {
                if (randomLine.agent2.orb && randomLine.agent2.orb.material) {
                    randomLine.agent2.orb.material.emissiveIntensity = originalIntensity2;
                }
            }, 200);
        }
    }
}

// Trigger communication periodically
setInterval(() => {
    if (isStimulated) {
        triggerRandomCommunication();
    }
}, 300);

setInterval(() => {
    if (!isStimulated) {
        triggerRandomCommunication();
    }
}, 1500);

// ========== PARTICLE SYSTEM (cosmic light particles) ==========
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 800; // More particles for cosmic effect
const posArray = new Float32Array(particlesCount * 3);
const colorArray = new Float32Array(particlesCount * 3);
const sizeArray = new Float32Array(particlesCount);

for (let i = 0; i < particlesCount; i++) {
    // Position - concentrated around the center but spreading out
    const radius = Math.random() * 50 + 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i * 3 + 2] = radius * Math.cos(phi);
    
    // Color - cosmic purples, blues, and whites
    const colorChoice = Math.random();
    if (colorChoice < 0.3) {
        colorArray[i * 3] = 1; colorArray[i * 3 + 1] = 1; colorArray[i * 3 + 2] = 1; // White
    } else if (colorChoice < 0.6) {
        colorArray[i * 3] = 0.6; colorArray[i * 3 + 1] = 0.4; colorArray[i * 3 + 2] = 1; // Purple
    } else {
        colorArray[i * 3] = 0.4; colorArray[i * 3 + 1] = 0.7; colorArray[i * 3 + 2] = 1; // Blue
    }
    
    // Varying sizes
    sizeArray[i] = Math.random() * 0.15 + 0.05;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending // Glowing effect
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// ========== ANIMATION LOOP ==========
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update agents (ethereal animations)
    if (!isFrozen) {
        agents.forEach(agent => agent.update());
    }
    
    // Animate Flower of Life
    animateFlowerOfLife();
    
    // Update communication lines
    communicationLines.forEach(line => line.update());
    
    // Rotate particles (heavenly light)
    particlesMesh.rotation.y += 0.0005;
    particlesMesh.rotation.x += 0.0002;
    
    // Slowly rotate starfield for depth (opposite direction)
    if (starField) {
        starField.rotation.y -= 0.0001; // Opposite direction
    }
    
    // Slowly rotate nebula (opposite direction)
    if (nebula) {
        nebula.rotation.y += 0.0003; // Opposite direction
        nebula.rotation.x -= 0.0001;
    }
    
    // Rotate planet and its atmosphere slightly
    if (planet) {
        planet.rotation.y += 0.0005;
    }
    if (planetGlow) {
        planetGlow.rotation.y += 0.0003;
    }
    if (planetGlow2) {
        planetGlow2.rotation.y += 0.0002;
    }
    
    // Update all comets (orbiting in opposite direction)
    comets.forEach(comet => comet.update());
    
    // Update shooting stars
    shootingStars.forEach(star => star.update(deltaTime));
    
    // Update controls
    controls.update();
    
    renderer.render(scene, camera);
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

// Stimulate button - now triggers conversation with random word
document.querySelector('.stimulate-btn').addEventListener('click', () => {
    isStimulated = !isStimulated;
    if (isStimulated) {
        agents.forEach(agent => agent.stimulate());
        controls.autoRotateSpeed = 2;
        
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
        
        // If not connected, trigger local conversation
        if (!isConnected) {
            // Trigger random agent to speak about the topic
            const randomAgent = agents[Math.floor(Math.random() * agents.length)];
            let response;
            
            // Check if we have documents to reference
            if (localKnowledge.hasDocuments()) {
                console.log(`🎲 Stimulate: ${randomAgent.name} searching for "${randomWord}"`);
                const relevantChunks = localKnowledge.search(randomWord);
                
                if (relevantChunks.length > 0 && relevantChunks[0].matchCount > 0) {
                    const chunk = relevantChunks[0];
                    const excerpt = chunk.text.trim().replace(/\s+/g, ' ').substring(0, 180);
                    response = `💭 Regarding "${randomWord}"...\n\n📄 From ${chunk.filename}:\n"${excerpt}..."\n\n— Found ${chunk.matchCount} relevant reference(s)`;
                    console.log(`✅ Found ${chunk.matchCount} matches for "${randomWord}"`);
                } else {
                    // Show general content even without exact matches
                    const chunk = relevantChunks[0];
                    const excerpt = chunk.text.trim().replace(/\s+/g, ' ').substring(0, 180);
                    response = `💭 "${randomWord}" is an interesting concept...\n\n📄 From ${chunk.filename}:\n"${excerpt}..."\n\n— This may provide related context`;
                    console.log(`⚠️ No exact matches, showing general content`);
                }
            } else {
                const responses = [
                    `💭 "${randomWord}"... a fascinating concept to ponder`,
                    `🌌 The nature of ${randomWord} is intriguing`,
                    `🔮 Consider ${randomWord} from another perspective`,
                    `✨ What if ${randomWord} holds the answer?`,
                    `🌟 ${randomWord} transcends our understanding`,
                    `⚠️ Upload documents via HORIZON FEEDER for informed insights about ${randomWord}`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                console.log('📝 No documents - using philosophical response');
            }
            
            setTimeout(() => {
                randomAgent.showMessage(response);
                appendToConversationLog(randomAgent.name, response, 'agent');
            }, 1000);
        }
    } else {
        controls.autoRotateSpeed = 0.5;
        document.querySelector('.footer-text').textContent = 'STIMULATION DEACTIVATED';
    }
});

// Freeze button
document.querySelector('.freeze-btn').addEventListener('click', () => {
    isFrozen = !isFrozen;
    if (isFrozen) {
        agents.forEach(agent => agent.freeze());
        controls.autoRotate = false;
    } else {
        controls.autoRotate = true;
    }
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
    if (conversationActive || agents.length === 0) return;
    
    conversationActive = true;
    const mode = window.simulationSettings?.mode || 'turn-by-turn';
    const topic = window.simulationSettings?.topic || 'General Discussion';
    
    console.log('🗣️ Starting conversation:', mode, topic);
    document.querySelector('.footer-text').textContent = `CONVERSATION ACTIVE | MODE: ${mode.toUpperCase()} | TOPIC: ${topic}`;
    
    let currentSpeakerIndex = 0;
    
    const speak = () => {
        if (!conversationActive) return;
        
        const speaker = agents[currentSpeakerIndex];
        const message = generateAgentMessage(speaker, mode, topic);
        
        speaker.showMessage(message);
        
        // Find a random listener and create connection
        const listenerIndex = Math.floor(Math.random() * agents.length);
        if (listenerIndex !== currentSpeakerIndex && communicationLines.length > 0) {
            const lineIndex = currentSpeakerIndex * (agents.length - 1) + (listenerIndex > currentSpeakerIndex ? listenerIndex - 1 : listenerIndex);
            if (communicationLines[lineIndex]) {
                communicationLines[lineIndex].activate();
            }
        }
        
        // Move to next speaker
        currentSpeakerIndex = (currentSpeakerIndex + 1) % agents.length;
    };
    
    // Set interval based on mode
    const intervals = {
        'turn-by-turn': 4000,
        'aggressive': 2000,
        'fireside': 6000
    };
    
    const interval = intervals[mode] || 4000;
    
    // Initial message
    speak();
    
    conversationInterval = setInterval(speak, interval);
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
        // Stop existing conversation
        stopConversation();
        
        const count = 7; // Complete circle with 7 agents
        createAgents(count);
        
        // Recreate communication lines
        communicationLines.forEach(line => scene.remove(line.line));
        communicationLines.length = 0;
        
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const line = new CommunicationLine(agents[i], agents[j]);
                communicationLines.push(line);
            }
        }
        
        // Update counter
        document.querySelector('.angels-connected .counter-value').textContent = 
            String(agents.length).padStart(3, '0');
        
        // Start conversation after a brief delay
        setTimeout(() => {
            startConversation();
        }, 1000);
    });
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

    function getRandomTrait(category) {
        const traits = traitCategories[category];
        return traits[Math.floor(Math.random() * traits.length)];
    }

    function rollRandomTraits(agentIndex) {
        const categories = Object.keys(traitCategories);
        const inputs = document.querySelectorAll(`input.trait-input[data-agent="${agentIndex}"]`);
        
        inputs.forEach((input, idx) => {
            const category = categories[idx % categories.length];
            input.value = getRandomTrait(category);
            
            // Add animation
            input.style.animation = 'none';
            setTimeout(() => {
                input.style.animation = 'traitRoll 0.3s ease-out';
            }, idx * 50);
        });
    }

    function populatePersonasModal() {
        personasList.innerHTML = '';
        
        agents.forEach((agent, index) => {
            const personaItem = document.createElement('div');
            personaItem.className = 'persona-item';
            
            const color = agentColors[index % agentColors.length];
            const hexColor = '#' + color.toString(16).padStart(6, '0');
            
            personaItem.innerHTML = `
                <div class="persona-header">
                    <div class="persona-color" style="background: ${hexColor}; box-shadow: 0 0 10px ${hexColor};"></div>
                    <input type="text" class="persona-name-input" value="${agent.name}" data-agent="${index}" placeholder="Agent Name">
                    <button class="dice-btn" data-agent="${index}" title="Roll random traits">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8" cy="8" r="1" fill="currentColor"/>
                            <circle cx="16" cy="8" r="1" fill="currentColor"/>
                            <circle cx="12" cy="12" r="1" fill="currentColor"/>
                            <circle cx="8" cy="16" r="1" fill="currentColor"/>
                            <circle cx="16" cy="16" r="1" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <div class="persona-traits">
                    <input type="text" class="trait-input" placeholder="Trait 1: e.g., Analytical" data-agent="${index}" data-trait="0" value="${agent.personality?.[0] || ''}">
                    <input type="text" class="trait-input" placeholder="Trait 2: e.g., Cautious" data-agent="${index}" data-trait="1" value="${agent.personality?.[1] || ''}">
                    <input type="text" class="trait-input" placeholder="Trait 3: e.g., Strategic" data-agent="${index}" data-trait="2" value="${agent.personality?.[2] || ''}">
                </div>
            `;
            
            personasList.appendChild(personaItem);
        });
        
        // Add event listeners to dice buttons
        document.querySelectorAll('.dice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const agentIndex = e.currentTarget.dataset.agent;
                rollRandomTraits(agentIndex);
            });
        });
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
        
        // Collect traits
        document.querySelectorAll('.trait-input').forEach(input => {
            const agentIndex = input.dataset.agent;
            const traitIndex = input.dataset.trait;
            const value = input.value.trim();
            
            if (value) {
                if (!traits[agentIndex]) {
                    traits[agentIndex] = [];
                }
                traits[agentIndex].push(value);
            }
        });
        
        console.log('Agent Names:', names);
        console.log('Agent Personas:', traits);
        
        // Update agents
        Object.keys(names).forEach(index => {
            if (agents[index]) {
                agents[index].name = names[index];
                agents[index].updateLabel(names[index]);
            }
        });
        
        Object.keys(traits).forEach(index => {
            if (agents[index]) {
                agents[index].personality = traits[index];
            }
        });
        
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
        
        // Adjust communication speed based on mode
        if (convMode === 'aggressive') {
            // More frequent communication
            controls.autoRotateSpeed = 1.5;
        } else if (convMode === 'fireside') {
            // Slower, more relaxed
            controls.autoRotateSpeed = 0.3;
        } else {
            // Default turn-by-turn
            controls.autoRotateSpeed = 0.5;
        }
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
        default: {
            traits: [
                ['daemon-protocol', 'systematic', 'guardian'],              // YOU
                ['ancient-wisdom', 'judicious', 'transcendent'],            // Osiris
                ['enigmatic', 'strategic', 'observer'],                     // Solomon
                ['intellectually-proud', 'precise', 'tsundere'],            // Azura - electronic consciousness
                ['instinctive', 'protective', 'noble'],                     // Simba
                ['harmonious', 'meditative', 'balanced'],                   // Harichi
                ['compassionate', 'ethereal', 'nurturing']                  // Angel
            ]
        },
        philosophers: {
            traits: [
                ['contemplative', 'analytical', 'questioning'],
                ['logical', 'methodical', 'rational'],
                ['philosophical', 'abstract', 'theoretical'],
                ['skeptical', 'critical', 'thoughtful'],
                ['reflective', 'introspective', 'wise'],
                ['meditative', 'profound', 'intellectual'],
                ['ethereal', 'transcendent', 'enlightened']
            ]
        },
        scientists: {
            traits: [
                ['empirical', 'data-driven', 'precise'],
                ['experimental', 'curious', 'systematic'],
                ['analytical', 'objective', 'rigorous'],
                ['innovative', 'methodical', 'detailed'],
                ['evidence-based', 'logical', 'technical'],
                ['quantitative', 'hypothesis-driven', 'observant'],
                ['research-oriented', 'scientific', 'rational']
            ]
        },
        innovators: {
            traits: [
                ['creative', 'visionary', 'bold'],
                ['unconventional', 'entrepreneurial', 'risk-taking'],
                ['imaginative', 'forward-thinking', 'disruptive'],
                ['innovative', 'dynamic', 'pioneering'],
                ['experimental', 'ambitious', 'resourceful'],
                ['transformative', 'revolutionary', 'inventive'],
                ['cutting-edge', 'futuristic', 'trailblazing']
            ]
        },
        debaters: {
            traits: [
                ['argumentative', 'assertive', 'persuasive'],
                ['challenging', 'direct', 'confrontational'],
                ['critical', 'provocative', 'sharp'],
                ['competitive', 'forceful', 'passionate'],
                ['strategic', 'eloquent', 'tenacious'],
                ['dialectical', 'rhetorical', 'combative'],
                ['incisive', 'compelling', 'adversarial']
            ]
        }
    };

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            const traits = presetPersonalities[preset].traits;
            
            // Apply preset to all trait inputs
            const personaItems = document.querySelectorAll('.persona-item');
            personaItems.forEach((item, index) => {
                if (traits[index]) {
                    const traitInputs = item.querySelectorAll('.trait-input');
                    traits[index].forEach((trait, traitIndex) => {
                        if (traitInputs[traitIndex]) {
                            traitInputs[traitIndex].value = trait;
                        }
                    });
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
    
    socket.on('new_message', (data) => {
        console.log('📨 New message:', data);
        handleIncomingMessage(data);
    });
    
    socket.on('error', (data) => {
        console.error('❌ Socket error:', data);
        document.querySelector('.footer-text').textContent = `ERROR: ${data.message}`;
    });
}

function registerAgents() {
    if (!isConnected || !socket) return;
    
    const agentsData = {};
    agents.forEach((agent, index) => {
        agentsData[index] = {
            name: agent.name,
            personality: agent.personality || []
        };
    });
    
    socket.emit('register_agents', { agents: agentsData });
    console.log('📝 Agents registered with server:', agentsData);
}

function handleIncomingMessage(data) {
    const agentName = data.agent;
    const message = data.message;
    const agentIndex = data.agentIndex;
    
    // Find the agent and show message in 3D
    if (data.type === 'agent' && agentIndex !== undefined && agents[agentIndex]) {
        agents[agentIndex].showMessage(message);
    }
    
    // Add message to conversation log in top left
    appendToConversationLog(agentName, message, data.type);
    
    // Update footer with last message
    const displayName = agentName.substring(0, 20);
    document.querySelector('.footer-text').textContent = `${displayName}: ${message.substring(0, 50)}...`;
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
        
        // Trigger random agent to respond
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        
        // Search knowledge base for relevant information
        let response;
        if (localKnowledge.hasDocuments()) {
            console.log(`💬 ${randomAgent.name} is searching for: "${message}"`);
            const relevantChunks = localKnowledge.search(message);
            
            if (relevantChunks.length > 0 && relevantChunks[0].matchCount > 0) {
                // Generate response based on document content
                const chunk = relevantChunks[0];
                const excerpt = chunk.text.trim().replace(/\s+/g, ' ').substring(0, 200);
                response = `📄 From "${chunk.filename}":\n\n"${excerpt}..."\n\n— This information relates to your query about: ${message}`;
                console.log(`✅ ${randomAgent.name} found relevant content in ${chunk.filename}`);
            } else {
                // Found documents but no specific matches
                const chunk = relevantChunks[0];
                const excerpt = chunk.text.trim().replace(/\s+/g, ' ').substring(0, 200);
                response = `📄 While I didn't find exact matches for "${message}", here's something from ${chunk.filename}:\n\n"${excerpt}..."\n\n— Perhaps this provides context?`;
                console.log(`⚠️ ${randomAgent.name} couldn't find exact matches, showing general content`);
            }
            
            document.querySelector('.footer-text').textContent = `✅ Response from ${chunk.filename}`;
        } else {
            // No documents uploaded
            response = `⚠️ No documents in knowledge base! Please upload documents via HORIZON FEEDER button to enable informed responses about specific topics.`;
            console.log('❌ No documents available for search');
            document.querySelector('.footer-text').textContent = 'NO DOCUMENTS - Upload via HORIZON FEEDER';
        }
        
        setTimeout(() => {
            randomAgent.showMessage(response);
            appendToConversationLog(randomAgent.name, response, 'agent');
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

// Connect on load
connectWebSocket();

