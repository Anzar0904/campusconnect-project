/// <reference types="@react-three/fiber" />
'use client'

import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, RootState } from '@react-three/fiber'
import * as THREE from 'three'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

// Define the environment base colors
const ENVIRONMENT_COLORS = {
  morning: {
    bg: '#040712',      // Deep slate-blue base
    color1: '#f59e0b',  // Warm gold
    color2: '#f97316',  // Amber sunrise
    color3: '#3b82f6',  // Sky blue
    color4: '#6366f1',  // Indigo atmosphere
  },
  afternoon: {
    bg: '#080d12',      // Crisp light-dark base
    color1: '#38bdf8',  // Sky cyan
    color2: '#22d3ee',  // Light teal
    color3: '#e2e8f0',  // Cloud cream
    color4: '#1e3a8a',  // Deep cobalt blue
  },
  evening: {
    bg: '#0a0a0f',      // Dark sunset violet base
    color1: '#ea580c',  // Sunset orange
    color2: '#ec4899',  // Rose pink
    color3: '#8b5cf6',  // Violet glow
    color4: '#ef4444',  // Red horizon
  },
  night: {
    bg: '#020205',      // Space black
    color1: '#120d31',  // Deep navy
    color2: '#10b981',  // Aurora emerald
    color3: '#06b6d4',  // Celestial cyan
    color4: '#4f46e5',  // Midnight blue
  },
}

interface LivingBackgroundProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

// Custom shader definition
const CustomShaderMaterial = {
  uniforms: {
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0, 0) },
    u_scroll: { value: 0 },
    u_color_bg: { value: new THREE.Color('#020205') },
    u_color1: { value: new THREE.Color('#120d31') },
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

    void main() {
      vec2 uv = vUv;
      vec2 p = uv - 0.5;
      
      // Lagged subtle cursor influence
      p += u_mouse * 0.08;
      
      float t = u_time * 0.15;
      float scrollOffset = u_scroll * 0.65;
      
      // Domain warping (nested sines) for visionOS fluid mesh look
      for(float i = 1.0; i < 4.0; i++) {
        p.x += sin(p.y + t + scrollOffset) * 0.22 / i;
        p.y += cos(p.x + t - scrollOffset) * 0.18 / i;
      }
      
      // Interpolation values based on warped space coordinates
      float m1 = sin(p.x * 2.2 + t) * 0.5 + 0.5;
      float m2 = cos(p.y * 1.8 - t) * 0.5 + 0.5;
      float m3 = sin((p.x + p.y) * 1.5 + t) * 0.5 + 0.5;
      
      // Layer colors
      vec3 col = u_color_bg;
      col = mix(col, u_color1, m1 * 0.45);
      col = mix(col, u_color2, m2 * 0.38);
      col = mix(col, u_color3, m3 * 0.32);
      
      // Hover glowing halo effect
      float distToMouse = length(uv - (u_mouse * 0.5 + 0.5));
      float glowFactor = smoothstep(0.45, 0.0, distToMouse);
      col = mix(col, u_color4, glowFactor * 0.06);
      
      // Vignette shadow overlay
      float vignette = smoothstep(1.6, 0.4, length(vUv - 0.5));
      col = mix(col * 0.55, col, vignette);
      
      gl_FragColor = vec4(col, 1.0);
    }
  `
}

function LivingShader({ timeOfDay }: LivingBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Internal color refs for GSAP interpolation
  const currentColors = useRef({
    bg: new THREE.Color(),
    color1: new THREE.Color(),
    color2: new THREE.Color(),
    color3: new THREE.Color(),
    color4: new THREE.Color(),
  })

  // Set initial colors once on mount
  useEffect(() => {
    const initial = ENVIRONMENT_COLORS[timeOfDay]
    currentColors.current.bg.set(initial.bg)
    currentColors.current.color1.set(initial.color1)
    currentColors.current.color2.set(initial.color2)
    currentColors.current.color3.set(initial.color3)
    currentColors.current.color4.set(initial.color4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Smooth color transitions on time change
  useGSAP(() => {
    const targetColors = ENVIRONMENT_COLORS[timeOfDay]
    
    // Animate the internal Color channels using GSAP
    gsap.to(currentColors.current.bg, {
      r: new THREE.Color(targetColors.bg).r,
      g: new THREE.Color(targetColors.bg).g,
      b: new THREE.Color(targetColors.bg).b,
      duration: 2.2,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color1, {
      r: new THREE.Color(targetColors.color1).r,
      g: new THREE.Color(targetColors.color1).g,
      b: new THREE.Color(targetColors.color1).b,
      duration: 2.2,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color2, {
      r: new THREE.Color(targetColors.color2).r,
      g: new THREE.Color(targetColors.color2).g,
      b: new THREE.Color(targetColors.color2).b,
      duration: 2.2,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color3, {
      r: new THREE.Color(targetColors.color3).r,
      g: new THREE.Color(targetColors.color3).g,
      b: new THREE.Color(targetColors.color3).b,
      duration: 2.2,
      ease: 'power2.out',
    })
    gsap.to(currentColors.current.color4, {
      r: new THREE.Color(targetColors.color4).r,
      g: new THREE.Color(targetColors.color4).g,
      b: new THREE.Color(targetColors.color4).b,
      duration: 2.2,
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
    uMouse.x += (targetMouseX - uMouse.x) * 0.05
    uMouse.y += (targetMouseY - uMouse.y) * 0.05

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

export default function LivingBackground({ timeOfDay }: LivingBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        gl={{ alpha: false, depth: false, stencil: false, antialias: false }}
      >
        <LivingShader timeOfDay={timeOfDay} />
      </Canvas>
    </div>
  )
}
