'use client'

import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function Orb({ color = '#FF6B2B', size = 1.4 }: { color?: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.x = clock.elapsedTime * 0.1
    ref.current.rotation.z = clock.elapsedTime * 0.07
  })

  return (
    <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[size, 4]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.05}
          metalness={0.9}
          distort={0.35}
          speed={2}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Wire shell */}
      <mesh>
        <icosahedronGeometry args={[size * 1.35, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.12} />
      </mesh>
    </Float>
  )
}

function OrbScene({ color }: { color: string }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[2, 2, 2]} intensity={4} color={color} />
      <pointLight position={[-2, -2, 1]} intensity={2} color="#FFB800" />
      <Orb color={color} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function FloatingOrb({
  className = '',
  color = '#FF6B2B',
}: {
  className?: string
  color?: string
}) {
  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <OrbScene color={color} />
        </Suspense>
      </Canvas>
    </div>
  )
}
