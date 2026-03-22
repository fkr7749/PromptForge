'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, Environment, MeshDistortMaterial } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Shared scroll progress ref (read from window directly, no event listeners) ─
// Reading window.scrollY inside useFrame is cheap — it's a property access, not a
// callback, so it never causes React re-renders.

// ─── Cursor-following light ───────────────────────────────────────────────────
function CursorLight() {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(({ pointer }) => {
    if (!ref.current) return
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, pointer.x * 6, 0.06)
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, pointer.y * 4, 0.06)
    ref.current.position.z = 4
  })
  return <pointLight ref={ref} intensity={8} color="#FFB800" distance={12} decay={2} />
}

// ─── Camera that shifts with cursor AND pulls back on scroll ─────────────────
function CameraRig() {
  useFrame(({ camera, pointer }) => {
    const scrollProgress = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0,
      1
    )

    // Cursor parallax
    const targetX = pointer.x * 1.2
    const targetY = pointer.y * 0.6 + 0.3

    // On scroll: pull camera back and tilt up
    const targetZ = THREE.MathUtils.lerp(10, 16, scrollProgress)
    const tiltY   = THREE.MathUtils.lerp(0.3, 1.8, scrollProgress)

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.02)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + tiltY * 0.3, 0.02)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.04)
    camera.lookAt(1.5, 0, 0)
  })
  return null
}

// ─── Central glowing blob ────────────────────────────────────────────────────
function CoreBlob() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return
    const scrollProgress = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0,
      1
    )

    meshRef.current.rotation.x = clock.elapsedTime * 0.08
    meshRef.current.rotation.z = clock.elapsedTime * 0.05

    // Cursor tracking
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, pointer.x * 0.7, 0.025)
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, pointer.y * 0.4, 0.025)

    // Scroll: blob shrinks and drifts back
    const targetScale = THREE.MathUtils.lerp(1.0, 0.5, scrollProgress)
    const targetZ     = THREE.MathUtils.lerp(0,   -2.5, scrollProgress)
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.05))
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.05)
  })

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.0, 5]} />
        <MeshDistortMaterial
          color="#FF6B2B"
          roughness={0.05}
          metalness={0.9}
          distort={0.38}
          speed={2.5}
          emissive="#FF3A00"
          emissiveIntensity={0.4}
        />
      </mesh>
    </Float>
  )
}

// ─── Wire shell ───────────────────────────────────────────────────────────────
function WireShell() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const sp = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0, 1
    )
    // Scroll: wire shell expands outward
    const targetScale = THREE.MathUtils.lerp(1.0, 1.6, sp)
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.04))
    ref.current.rotation.y = -clock.elapsedTime * 0.07
    ref.current.rotation.x =  clock.elapsedTime * 0.04
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.9, 1]} />
      <meshBasicMaterial color="#FF6B2B" wireframe transparent opacity={0.12} />
    </mesh>
  )
}

// ─── Outer wire cage ─────────────────────────────────────────────────────────
function OuterCage() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.04
    ref.current.rotation.z = -clock.elapsedTime * 0.03
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[4.0, 1]} />
      <meshBasicMaterial color="#FFB800" wireframe transparent opacity={0.05} />
    </mesh>
  )
}

// ─── Orbiting ring — scroll speeds them up ───────────────────────────────────
function Ring({
  radius = 3.5, thickness = 0.025, speed = 0.3, tilt = 0.4,
  color = '#FFB800', expandOnScroll = 0,
}: {
  radius?: number; thickness?: number; speed?: number; tilt?: number
  color?: string; expandOnScroll?: number
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const sp = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0, 1
    )
    // Rings spin faster and expand on scroll
    const speedMult = THREE.MathUtils.lerp(1, 3.5, sp)
    const scaleMult = THREE.MathUtils.lerp(1, 1 + expandOnScroll, sp)
    ref.current.rotation.z = clock.elapsedTime * speed * speedMult
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, scaleMult, 0.04))
  })
  return (
    <group ref={ref} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <mesh>
        <torusGeometry args={[radius, thickness, 8, 128]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} roughness={0} metalness={1} />
      </mesh>
    </group>
  )
}

// ─── Floating data node ──────────────────────────────────────────────────────
function DataNode({ position, color, phase = 0 }: {
  position: [number, number, number]; color: string; phase?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const sp = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0, 1
    )
    ref.current.rotation.x = clock.elapsedTime * 0.9
    ref.current.rotation.y = clock.elapsedTime * 1.3
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8 + phase) * 0.25
    // Scatter outward on scroll
    const scatter = THREE.MathUtils.lerp(1.0, 2.2, sp)
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, position[0] * scatter, 0.04)
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, position[2] * scatter - sp * 2, 0.04)
  })
  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={0.8}>
      <mesh ref={ref} position={position}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={2}
          roughness={0} metalness={1}
        />
      </mesh>
    </Float>
  )
}

// ─── Particle cloud ───────────────────────────────────────────────────────────
function ParticleCloud() {
  const ref = useRef<THREE.Points>(null)
  const count = 800

  const { basePositions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const orange = new THREE.Color('#FF6B2B')
    const amber  = new THREE.Color('#FFB800')
    const white  = new THREE.Color('#ffffff')

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 5 + Math.pow(Math.random(), 0.5) * 8
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi) - 2

      const c = Math.random() > 0.7 ? white : Math.random() > 0.5 ? amber : orange
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { basePositions: positions, colors }
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const sp = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0, 1
    )
    // Particles spin faster on scroll
    const rotSpeed = THREE.MathUtils.lerp(0.018, 0.06, sp)
    ref.current.rotation.y = clock.elapsedTime * rotSpeed
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.008) * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── Mouse + scroll reactive scene group ─────────────────────────────────────
function SceneGroup() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ pointer }) => {
    if (!groupRef.current) return
    const sp = Math.min(
      typeof window !== 'undefined' ? window.scrollY / (window.innerHeight * 0.9) : 0, 1
    )

    // Cursor rotation
    const targetRotY = pointer.x * 0.25
    const targetRotX = -pointer.y * 0.15

    // Scroll: tilt the whole group forward (like it's launching away)
    const scrollTiltX = sp * 0.4
    const scrollTiltZ = sp * 0.2

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.03)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX + scrollTiltX, 0.03)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, scrollTiltZ, 0.03)
  })

  return (
    <group ref={groupRef} position={[1.5, 0, 0]}>
      <CoreBlob />
      <WireShell />
      <OuterCage />

      <Ring radius={3.6} speed={0.22}  tilt={0.5}  color="#FFB800" thickness={0.028} expandOnScroll={0.4} />
      <Ring radius={4.4} speed={-0.16} tilt={-0.7} color="#FF6B2B" thickness={0.022} expandOnScroll={0.3} />
      <Ring radius={3.0} speed={0.30}  tilt={1.1}  color="#ffffff" thickness={0.015} expandOnScroll={0.5} />

      <DataNode position={[-3.0,  1.8,  0.2]} color="#FF6B2B" phase={0}   />
      <DataNode position={[ 3.2,  1.0, -0.3]} color="#FFB800" phase={1.5} />
      <DataNode position={[ 2.6, -2.0,  0.5]} color="#FF6B2B" phase={3.0} />
      <DataNode position={[-2.5, -1.5,  0.8]} color="#FFB800" phase={4.5} />
      <DataNode position={[ 0.3,  3.5, -0.8]} color="#FF6B2B" phase={2.0} />
      <DataNode position={[-1.2, -3.2,  0.4]} color="#FFB800" phase={5.0} />
      <DataNode position={[ 4.0,  0.2, -1.0]} color="#FF6B2B" phase={0.8} />
      <DataNode position={[-4.2, -0.5,  0.6]} color="#FFB800" phase={3.7} />
    </group>
  )
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 4]}   intensity={8}  color="#FF6B2B" />
      <pointLight position={[-6, 4, 2]}  intensity={4}  color="#FFB800" />
      <pointLight position={[6, -4, 1]}  intensity={3}  color="#FF6B2B" />
      <pointLight position={[0, -6, -2]} intensity={2}  color="#FF3A00" />
      <directionalLight position={[0, 8, 6]} intensity={1.5} color="#ffffff" />

      <CursorLight />
      <CameraRig />

      <SceneGroup />
      <ParticleCloud />

      <Stars radius={50} depth={30} count={300} factor={3} saturation={0} fade speed={0.5} />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={2.0} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 10], fov: 48 }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
      }}
      onCreated={({ scene }) => { scene.background = new THREE.Color('#0A0A0A') }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}
