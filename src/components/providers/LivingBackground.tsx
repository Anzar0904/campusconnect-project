/// <reference types="@react-three/fiber" />
'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, RootState } from '@react-three/fiber'
import * as THREE from 'three'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

// Define the environment base colors (high fidelity, vibrant palettes)
const ENVIRONMENT_COLORS = {
  morning: {
    bg: '#040610',      // Deep space base
    color1: '#ea580c',  // Warm sunrise orange
    color2: '#eab308',  // Morning gold
    color3: '#2563eb',  // Sky blue
    color4: '#8b5cf6',  // Violet atmospheric glow
  },
  afternoon: {
    bg: '#030712',      // Deep indigo base
    color1: '#0ea5e9',  // Vibrant sky cyan
    color2: '#06b6d4',  // Celestial teal
    color3: '#f1f5f9',  // Cloud white highlight
    color4: '#3b82f6',  // Cobalt blue ambient
  },
  evening: {
    bg: '#080510',      // Sunset violet base
    color1: '#f43f5e',  // Horizon rose
    color2: '#d946ef',  // Neon magenta
    color3: '#f97316',  // Amber sunburst
    color4: '#6366f1',  // Dusk indigo
  },
  night: {
    bg: '#020205',      // Absolute black base
    color1: '#1e1b4b',  // Cosmic navy
    color2: '#10b981',  // Aurora emerald
    color3: '#06b6d4',  // Bright cyan pulse
    color4: '#4f46e5',  // Indigo nebula
  },
}

interface LivingBackgroundProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

// Custom shader definition with liquid domain warping, aurora blobs, grain, and parallax
const CustomShaderMaterial = {
  uniforms: {
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0, 0) },
    u_scroll: { value: 0 },
    u_color_bg: { value: new THREE.Color('#020205') },
    u_color1: { value: new THREE.Color('#1e1b4b') },
    u_color2: { value: new THREE.Color('#10b981') },
    u_color3: { value: new THREE.Color('#06b6d4') },
    u_color4: { value: new THREE.Color('#4f46e5') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_scroll;
    uniform vec3 u_color_bg;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    uniform vec3 u_color4;
    varying vec2 vUv;

    // Pseudo-random noise generator for premium grain
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      
      // Gentle breathing scale driven by time
      float breath = sin(u_time * 0.3) * 0.04 + 1.0;
      vec2 p = (uv - 0.5) * breath;
      
      // Mouse parallax shift
      p += u_mouse * 0.12;
      
      float t = u_time * 0.07;
      float scrollOffset = u_scroll * 0.45;
      
      // Domain warping (nested sines) for fluid liquid mesh look
      vec2 warpedP = p;
      for(float i = 1.0; i < 4.0; i++) {
        float offset = t + scrollOffset * (i * 0.15);
        warpedP.x += sin(p.y * 1.6 + offset) * 0.32 / i;
        warpedP.y += cos(p.x * 1.4 - offset) * 0.28 / i;
      }
      
      // Create large slow-moving aurora blobs using distance functions in warped space
      vec2 blob1_pos = vec2(sin(t * 0.4) * 0.35, cos(t * 0.2) * 0.3);
      vec2 blob2_pos = vec2(cos(t * 0.3) * 0.4, sin(t * 0.5) * 0.35);
      vec2 blob3_pos = vec2(sin(t * 0.2 + 0.8) * 0.3, cos(t * 0.4 + 1.6) * 0.4);
      
      float d1 = length(warpedP - blob1_pos);
      float d2 = length(warpedP - blob2_pos);
      float d3 = length(warpedP - blob3_pos);
      
      float b1 = smoothstep(0.85, 0.0, d1);
      float b2 = smoothstep(0.75, 0.0, d2);
      float b3 = smoothstep(0.95, 0.0, d3);
      
      // Blend colors based on warped blobs and base gradients
      vec3 col = u_color_bg;
      col = mix(col, u_color1, b1 * 0.75);
      col = mix(col, u_color2, b2 * 0.65);
      col = mix(col, u_color3, b3 * 0.60);
      
      // Soft radial lighting (glow from center)
      float radialGlow = smoothstep(1.3, 0.0, length(p));
      col = mix(col, u_color4, radialGlow * 0.22);
      
      // Mouse halo spotlight glow
      float distToMouse = length(uv - (u_mouse * 0.5 + 0.5));
      float mouseGlow = smoothstep(0.45, 0.0, distToMouse);
      col = mix(col, u_color4, mouseGlow * 0.24);
      
      // Apply noise/grain texture
      float grain = noise(uv * 950.0 + sin(u_time)) * 0.018;
      col += vec3(grain);
      
      // Contrast vignette
      float vignette = smoothstep(1.6, 0.35, length(uv - 0.5));
      col = mix(col * 0.45, col, vignette);
      
      gl_FragColor = vec4(col, 1.0);
    }
  `
}

function LivingShader({ timeOfDay }: LivingBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Internal color refs for GSAP interpolation
  const currentColors = useRef({
    bg: new THREE.Color(ENVIRONMENT_COLORS[timeOfDay].bg),
    color1: new THREE.Color(ENVIRONMENT_COLORS[timeOfDay].color1),
    color2: new THREE.Color(ENVIRONMENT_COLORS[timeOfDay].color2),
    color3: new THREE.Color(ENVIRONMENT_COLORS[timeOfDay].color3),
    color4: new THREE.Color(ENVIRONMENT_COLORS[timeOfDay].color4),
  })

  // Smooth color transitions on time change
  useGSAP(() => {
    const targetColors = ENVIRONMENT_COLORS[timeOfDay]
    
    // Animate the internal Color channels using GSAP
    gsap.to(currentColors.current.bg, {
      r: new THREE.Color(targetColors.bg).r,
      g: new THREE.Color(targetColors.bg).g,
      b: new THREE.Color(targetColors.bg).b,
      duration: 2.8,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color1, {
      r: new THREE.Color(targetColors.color1).r,
      g: new THREE.Color(targetColors.color1).g,
      b: new THREE.Color(targetColors.color1).b,
      duration: 2.8,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color2, {
      r: new THREE.Color(targetColors.color2).r,
      g: new THREE.Color(targetColors.color2).g,
      b: new THREE.Color(targetColors.color2).b,
      duration: 2.8,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color3, {
      r: new THREE.Color(targetColors.color3).r,
      g: new THREE.Color(targetColors.color3).g,
      b: new THREE.Color(targetColors.color3).b,
      duration: 2.8,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color4, {
      r: new THREE.Color(targetColors.color4).r,
      g: new THREE.Color(targetColors.color4).g,
      b: new THREE.Color(targetColors.color4).b,
      duration: 2.8,
      ease: 'power2.out',
    })
  }, { dependencies: [timeOfDay] })

  // WebGL frame-loop updates
  useFrame((state: RootState) => {
    const mat = materialRef.current
    if (!mat) return

    // Update time
    mat.uniforms.u_time.value = state.clock.getElapsedTime()

    // Smoothly interpolate mouse vectors
    const targetMouseX = state.mouse.x
    const targetMouseY = state.mouse.y
    const uMouse = mat.uniforms.u_mouse.value
    uMouse.x += (targetMouseX - uMouse.x) * 0.04
    uMouse.y += (targetMouseY - uMouse.y) * 0.04

    // Track scroll coordinates
    if (typeof window !== 'undefined') {
      const scrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      mat.uniforms.u_scroll.value = maxScroll > 0 ? scrollY / maxScroll : 0
    }

    // Sync tweened colors into the material uniforms
    mat.uniforms.u_color_bg.value.copy(currentColors.current.bg)
    mat.uniforms.u_color1.value.copy(currentColors.current.color1)
    mat.uniforms.u_color2.value.copy(currentColors.current.color2)
    mat.uniforms.u_color3.value.copy(currentColors.current.color3)
    mat.uniforms.u_color4.value.copy(currentColors.current.color4)
  })

  // Full screen quad geometry
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={CustomShaderMaterial.vertexShader}
        fragmentShader={CustomShaderMaterial.fragmentShader}
        uniforms={{
          u_time: { value: 0 },
          u_mouse: { value: new THREE.Vector2(0, 0) },
          u_scroll: { value: 0 },
          u_color_bg: { value: new THREE.Color().copy(currentColors.current.bg) },
          u_color1: { value: new THREE.Color().copy(currentColors.current.color1) },
          u_color2: { value: new THREE.Color().copy(currentColors.current.color2) },
          u_color3: { value: new THREE.Color().copy(currentColors.current.color3) },
          u_color4: { value: new THREE.Color().copy(currentColors.current.color4) },
        }}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  
  // Generate random particles (soft 3D stardust)
  const [particleData] = useState(() => {
    const count = 75
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 - 1.5 // depth between -2.5 and 0.5
      randoms[i] = Math.random()
    }
    return { positions, randoms, count }
  })

  useFrame((state: RootState) => {
    if (!pointsRef.current) return
    const time = state.clock.getElapsedTime()
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    // Drift particles and make them float gently
    for (let i = 0; i < particleData.count; i++) {
      const idx = i * 3
      const rand = particleData.randoms[i]
      
      // Vertical float movement
      positions[idx + 1] += Math.sin(time * 0.15 + rand * 10) * 0.0008
      // Horizontal drift
      positions[idx] += Math.cos(time * 0.1 + rand * 10) * 0.0005
      
      // Wrap particles if they go too far out of bounds
      if (positions[idx + 1] > 3) positions[idx + 1] = -3
      if (positions[idx + 1] < -3) positions[idx + 1] = 3
      if (positions[idx] > 3) positions[idx] = -3
      if (positions[idx] < -3) positions[idx] = 3
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    
    // Add dynamic mouse parallax to the entire points system
    pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, state.mouse.x * 0.25, 0.05)
    pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, state.mouse.y * 0.25, 0.05)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={0.18}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function LivingBackground({ timeOfDay }: LivingBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        gl={{ alpha: false, depth: false, stencil: false, antialias: false }}
      >
        <LivingShader timeOfDay={timeOfDay} />
        <FloatingParticles />
      </Canvas>
    </div>
  )
}
