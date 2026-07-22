'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, RoundedBox, Torus, Cylinder, Sphere, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

gsap.registerPlugin(ScrollTrigger)

const SCROLL_HEIGHT = 12000

function BugattiCar() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Main body */}
      <RoundedBox args={[4.2, 0.7, 1.8]} radius={0.15} position={[0, 0.6, 0]}>
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={1}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={2}
        />
      </RoundedBox>

      {/* Roof / Cabin */}
      <RoundedBox args={[2.0, 0.6, 1.7]} radius={0.2} position={[0.2, 1.25, 0]}>
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2}
        />
      </RoundedBox>

      {/* Windshield */}
      <RoundedBox args={[0.05, 0.55, 1.6]} radius={0.02} position={[-0.85, 1.2, 0]} rotation={[0, 0, -0.3]}>
        <meshPhysicalMaterial
          color="#111"
          metalness={0}
          roughness={0}
          transmission={0.8}
          thickness={0.1}
          ior={1.5}
          envMapIntensity={1.5}
        />
      </RoundedBox>

      {/* Hood curve */}
      <RoundedBox args={[1.8, 0.15, 1.7]} radius={0.08} position={[1.2, 0.95, 0]}>
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={1}
          roughness={0.05}
          clearcoat={1}
          envMapIntensity={2}
        />
      </RoundedBox>

      {/* Front splitter */}
      <RoundedBox args={[0.3, 0.12, 1.9]} radius={0.02} position={[2.2, 0.28, 0]}>
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.8} roughness={0.15} />
      </RoundedBox>

      {/* Rear diffuser */}
      <RoundedBox args={[0.25, 0.15, 1.9]} radius={0.02} position={[-2.1, 0.3, 0]}>
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.8} roughness={0.15} />
      </RoundedBox>

      {/* Side skirts - left */}
      <RoundedBox args={[3.8, 0.12, 0.12]} radius={0.02} position={[0, 0.32, 0.95]}>
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </RoundedBox>

      {/* Side skirts - right */}
      <RoundedBox args={[3.8, 0.12, 0.12]} radius={0.02} position={[0, 0.32, -0.95]}>
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </RoundedBox>

      {/* Headlights */}
      <Sphere args={[0.08]} position={[2.05, 0.7, 0.65]}>
        <meshPhysicalMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={3}
          metalness={0}
          roughness={0}
        />
      </Sphere>
      <Sphere args={[0.08]} position={[2.05, 0.7, -0.65]}>
        <meshPhysicalMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={3}
          metalness={0}
          roughness={0}
        />
      </Sphere>

      {/* Tail lights */}
      <RoundedBox args={[0.08, 0.08, 1.2]} radius={0.03} position={[-2.15, 0.7, 0]}>
        <meshPhysicalMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={2}
          metalness={0}
          roughness={0}
        />
      </RoundedBox>

      {/* Wheels */}
      {[
        [1.4, 0.1, 1.05],
        [1.4, 0.1, -1.05],
        [-1.4, 0.1, 1.05],
        [-1.4, 0.1, -1.05],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Tire */}
          <Cylinder args={[0.35, 0.35, 0.25, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshPhysicalMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
          </Cylinder>
          {/* Rim */}
          <Cylinder args={[0.28, 0.28, 0.26, 16]} rotation={[Math.PI / 2, 0, 0]}>
            <meshPhysicalMaterial
              color="#888"
              metalness={1}
              roughness={0.15}
              envMapIntensity={3}
            />
          </Cylinder>
          {/* Brake caliper */}
          <RoundedBox args={[0.12, 0.15, 0.05]} radius={0.02} position={[0, 0, 0.14]}>
            <meshPhysicalMaterial
              color="#e8e8e8"
              metalness={0.9}
              roughness={0.1}
            />
          </RoundedBox>
        </group>
      ))}

      {/* Active rear wing */}
      <group position={[-1.8, 1.05, 0]} rotation={[0, 0, 0.1]}>
        <RoundedBox args={[0.6, 0.04, 1.6]} radius={0.01}>
          <meshPhysicalMaterial
            color="#0a0a0a"
            metalness={1}
            roughness={0.05}
            clearcoat={1}
          />
        </RoundedBox>
        {/* Wing supports */}
        <RoundedBox args={[0.04, 0.15, 0.04]} radius={0.01} position={[0, -0.08, 0.6]}>
          <meshPhysicalMaterial color="#333" metalness={0.9} roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.15, 0.04]} radius={0.01} position={[0, -0.08, -0.6]}>
          <meshPhysicalMaterial color="#333" metalness={0.9} roughness={0.2} />
        </RoundedBox>
      </group>

      {/* Side mirrors */}
      <group position={[0.7, 1.15, 1.05]}>
        <RoundedBox args={[0.15, 0.08, 0.12]} radius={0.02}>
          <meshPhysicalMaterial color="#0a0a0a" metalness={1} roughness={0.05} clearcoat={1} />
        </RoundedBox>
      </group>
      <group position={[0.7, 1.15, -1.05]}>
        <RoundedBox args={[0.15, 0.08, 0.12]} radius={0.02}>
          <meshPhysicalMaterial color="#0a0a0a" metalness={1} roughness={0.05} clearcoat={1} />
        </RoundedBox>
      </group>

      {/* Bugatti horseshoe grille */}
      <Torus args={[0.25, 0.03, 16, 32, Math.PI]} position={[2.1, 0.55, 0]} rotation={[0, Math.PI / 2, Math.PI]}>
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.1}
          envMapIntensity={3}
        />
      </Torus>
    </group>
  )
}

function LuxuryKey() {
  return (
    <group>
      {/* Key body */}
      <RoundedBox args={[0.8, 0.2, 0.08]} radius={0.04} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.15}
          clearcoat={1}
        />
      </RoundedBox>
      {/* EB logo */}
      <Torus args={[0.08, 0.015, 8, 16]} position={[0.25, 0, 0.05]}>
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.05}
          envMapIntensity={3}
        />
      </Torus>
      {/* Key blade */}
      <RoundedBox args={[0.6, 0.04, 0.02]} radius={0.01} position={[-0.7, 0, 0]}>
        <meshPhysicalMaterial color="#888" metalness={1} roughness={0.1} />
      </RoundedBox>
      {/* Buttons */}
      <Sphere args={[0.025]} position={[0.1, 0.08, 0.05]}>
        <meshPhysicalMaterial color="#333" metalness={0.8} roughness={0.2} />
      </Sphere>
      <Sphere args={[0.025]} position={[-0.1, 0.08, 0.05]}>
        <meshPhysicalMaterial color="#333" metalness={0.8} roughness={0.2} />
      </Sphere>
    </group>
  )
}

function EngineBlock() {
  return (
    <group>
      {/* Main block */}
      <RoundedBox args={[1.2, 0.8, 1.0]} radius={0.05} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#2a2a2a"
          metalness={0.95}
          roughness={0.2}
          envMapIntensity={2}
        />
      </RoundedBox>
      {/* W16 cylinders */}
      {Array.from({ length: 16 }, (_, i) => {
        const row = i < 8 ? 0 : 1
        const col = i % 8
        return (
          <Cylinder
            key={i}
            args={[0.06, 0.06, 0.3, 16]}
            position={[
              -0.45 + col * 0.13,
              0.5,
              -0.2 + row * 0.4,
            ]}
            rotation={[0, 0, 0]}
          >
            <meshPhysicalMaterial
              color="#888"
              metalness={1}
              roughness={0.1}
              envMapIntensity={3}
            />
          </Cylinder>
        )
      })}
      {/* Turbos */}
      <Torus args={[0.15, 0.05, 8, 16]} position={[0.7, 0.2, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.05}
          envMapIntensity={3}
        />
      </Torus>
      <Torus args={[0.15, 0.05, 8, 16]} position={[0.7, 0.2, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.05}
          envMapIntensity={3}
        />
      </Torus>
      {/* Intake manifold */}
      <RoundedBox args={[0.8, 0.15, 0.8]} radius={0.04} position={[0, 0.55, 0]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.15}
          clearcoat={1}
        />
      </RoundedBox>
    </group>
  )
}

function LuxuryInterior() {
  return (
    <group>
      {/* Seat */}
      <RoundedBox args={[0.6, 0.8, 0.5]} radius={0.1} position={[0, 0.3, 0]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0}
          roughness={0.7}
          clearcoat={0.5}
        />
      </RoundedBox>
      {/* Seat back */}
      <RoundedBox args={[0.6, 0.7, 0.08]} radius={0.08} position={[0, 0.7, -0.22]} rotation={[-0.15, 0, 0]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0}
          roughness={0.7}
          clearcoat={0.5}
        />
      </RoundedBox>
      {/* Steering wheel */}
      <Torus args={[0.22, 0.02, 16, 32]} position={[0, 0.6, 0.4]} rotation={[0.4, 0, 0]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0}
          roughness={0.5}
        />
      </Torus>
      {/* Dashboard */}
      <RoundedBox args={[1.2, 0.3, 0.4]} radius={0.05} position={[0, 0.55, 0.3]}>
        <meshPhysicalMaterial
          color="#111"
          metalness={0}
          roughness={0.8}
        />
      </RoundedBox>
      {/* Center console */}
      <RoundedBox args={[0.3, 0.6, 0.8]} radius={0.05} position={[0.3, 0.1, 0.1]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0}
          roughness={0.7}
          clearcoat={0.5}
        />
      </RoundedBox>
      {/* Display screen */}
      <RoundedBox args={[0.4, 0.25, 0.02]} radius={0.02} position={[0, 0.75, 0.35]} rotation={[0.3, 0, 0]}>
        <meshPhysicalMaterial
          color="#000"
          emissive="#111133"
          emissiveIntensity={0.5}
          metalness={0}
          roughness={0}
        />
      </RoundedBox>
    </group>
  )
}

function ParticleField() {
  const count = 200
  const positions = useRef(new Float32Array(count * 3))

  useEffect(() => {
    const pos = positions.current
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function Scene({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const carRef = useRef<THREE.Group>(null)
  const cameraRef = useRef(new THREE.Vector3(8, 3, 8))
  const lookAtRef = useRef(new THREE.Vector3(0, 0.5, 0))
  const targetCamera = useRef(new THREE.Vector3(8, 3, 8))
  const targetLookAt = useRef(new THREE.Vector3(0, 0.5, 0))

  useEffect(() => {
    const unsub = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollProgress.current = self.progress
      },
    })
    return () => unsub.kill()
  }, [scrollProgress])

  useFrame((state) => {
    const t = scrollProgress.current

    // Camera positions for each scene
    const scenes = [
      { start: 0, end: 0.12, cam: [8, 3, 8], look: [0, 0.5, 0] },           // Hero orbit
      { start: 0.12, end: 0.25, cam: [0, 2, 6], look: [0, 0.5, 0] },        // Close up
      { start: 0.25, end: 0.35, cam: [3, 1.5, 3], look: [1.5, 0.8, 0] },    // Door
      { start: 0.35, end: 0.48, cam: [0, 1.5, 0], look: [0.3, 0.6, 0.1] },  // Interior
      { start: 0.48, end: 0.58, cam: [2, 0.8, 1], look: [0, 0, 0] },        // Key
      { start: 0.58, end: 0.72, cam: [2, 1.5, 0], look: [-0.5, 0.3, 0] },   // Engine
      { start: 0.72, end: 0.85, cam: [5, 2, 5], look: [0, 0.5, 0] },        // Exit
      { start: 0.85, end: 0.95, cam: [0, 1, 8], look: [0, 0.5, 0] },        // Final
      { start: 0.95, end: 1.0, cam: [0, 5, 15], look: [0, 0, 0] },          // Transition
    ]

    let currentScene = scenes[0]
    for (const scene of scenes) {
      if (t >= scene.start && t <= scene.end) {
        currentScene = scene
        break
      }
    }

    const localT = Math.max(0, Math.min(1, (t - currentScene.start) / (currentScene.end - currentScene.start)))

    targetCamera.current.set(...currentScene.cam as [number, number, number])
    targetLookAt.current.set(...currentScene.look as [number, number, number])

    cameraRef.current.lerp(targetCamera.current, 0.03)
    lookAtRef.current.lerp(targetLookAt.current, 0.03)

    state.camera.position.copy(cameraRef.current)
    state.camera.lookAt(lookAtRef.current)

    // Car rotation
    if (carRef.current) {
      carRef.current.rotation.y = t * Math.PI * 2
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight
        position={[10, 15, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight position={[-10, 10, -10]} intensity={1} color="#4444ff" />
      <spotLight position={[0, 10, -15]} intensity={0.8} color="#ff4444" />

      <group ref={carRef}>
        <BugattiCar />
      </group>

      <LuxuryKey />
      <EngineBlock />
      <LuxuryInterior />
      <ParticleField />

      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
        />
      </mesh>

      <fog attach="fog" args={['#000000', 15, 40]} />
    </>
  )
}

const sceneTexts = [
  { title: 'BUGATTI', subtitle: 'CHIRON SPORT', desc: '1,500 Horsepower. Pure Emotion.' },
  { title: 'DESIGN', subtitle: 'SCULPTED BY WIND', desc: 'Every curve tells a story of speed.' },
  { title: 'DOOR', subtitle: 'YOUR ENTRANCE', desc: 'Step into a world beyond ordinary.' },
  { title: 'COCKPIT', subtitle: 'COMMAND CENTER', desc: 'Where luxury meets precision engineering.' },
  { title: 'KEY', subtitle: 'YOUR KEY', desc: 'The power to unleash perfection.' },
  { title: 'W16 ENGINE', subtitle: '1,500 HP', desc: 'Four turbos. Sixteen cylinders. Infinite thrill.' },
  { title: 'UNLEASHED', subtitle: 'FEEL THE POWER', desc: '0-100 km/h in 2.4 seconds.' },
  { title: 'LEGACY', subtitle: 'SINCE 1909', desc: 'Over a century of automotive excellence.' },
  { title: 'JO CARS', subtitle: 'THE EXPERIENCE', desc: 'Discover luxury like never before.' },
]

export default function BugattiExperience() {
  const scrollProgress = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentScene, setCurrentScene] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showLanding, setShowLanding] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const unsubscribe = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress
        scrollProgress.current = progress

        const sceneIndex = Math.min(
          sceneTexts.length - 1,
          Math.floor(progress * sceneTexts.length)
        )
        setCurrentScene(sceneIndex)

        if (progress > 0.95) {
          setShowLanding(true)
        }
      },
    })

    return () => unsubscribe.kill()
  }, [isLoaded])

  return (
    <div className="bg-black">
      {/* 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          camera={{ fov: 45, near: 0.1, far: 100 }}
        >
          <Suspense fallback={null}>
            <Scene scrollProgress={scrollProgress} />
            <Environment preset="city" background={false} />
          </Suspense>
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
              height={300}
              intensity={0.8}
            />
            <DepthOfField
              focusDistance={0.02}
              focalLength={0.05}
              bokehScale={3}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Loading screen */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 border border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6" />
              <p className="text-white/40 text-xs tracking-[0.5em] uppercase">Loading Experience</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll container */}
      <div
        id="scroll-container"
        ref={containerRef}
        style={{ height: `${SCROLL_HEIGHT}px` }}
        className="relative"
      >
        {/* Scene text overlays */}
        <div className="fixed inset-0 z-10 pointer-events-none">
          {sceneTexts.map((scene, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: currentScene === i ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              style={{
                justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
                padding: '0 8%',
              }}
            >
              <div className={`max-w-md ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
                <motion.p
                  className="text-white/30 text-xs tracking-[0.4em] uppercase mb-3"
                  initial={{ y: 20 }}
                  animate={{ y: currentScene === i ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {scene.subtitle}
                </motion.p>
                <motion.h2
                  className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: currentScene === i ? 0 : 30,
                    opacity: currentScene === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {scene.title}
                </motion.h2>
                <motion.p
                  className="text-white/50 text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: currentScene === i ? 0 : 20,
                    opacity: currentScene === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {scene.desc}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded && !showLanding ? 1 : 0 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="w-px h-12 bg-gradient-to-b from-transparent via-white/40 to-transparent"
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase">Scroll to explore</p>
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-px z-10 bg-white/10">
          <motion.div
            className="h-full bg-white/60 origin-left"
            style={{ scaleX: scrollProgress.current }}
          />
        </div>

        {/* Navigation */}
        <div className="fixed top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => router.push('/')}
              className="text-white/60 hover:text-white text-sm tracking-[0.2em] uppercase transition-colors"
            >
              ← JO Cars
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => {
                document.getElementById('scroll-container')?.scrollTo({
                  top: SCROLL_HEIGHT,
                  behavior: 'smooth',
                })
              }}
              className="text-white/60 hover:text-white text-sm tracking-[0.2em] uppercase transition-colors"
            >
              Explore →
            </button>
          </motion.div>
        </div>

        {/* Scene counter */}
        <div className="fixed bottom-8 right-8 z-10">
          <motion.p
            className="text-white/20 text-xs tracking-[0.3em]"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {String(currentScene + 1).padStart(2, '0')} / {String(sceneTexts.length).padStart(2, '0')}
          </motion.p>
        </div>
      </div>

      {/* Landing page after cinematic */}
      <AnimatePresence>
        {showLanding && (
          <motion.div
            className="relative z-20 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Hero section */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
              <div className="text-center z-10 px-6">
                <motion.p
                  className="text-white/30 text-xs tracking-[0.5em] uppercase mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                >
                  Experience the Extraordinary
                </motion.p>
                <motion.h1
                  className="text-7xl md:text-9xl font-bold text-white mb-8 tracking-tighter"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  BUGATTI
                </motion.h1>
                <motion.p
                  className="text-white/40 text-xl mb-12 max-w-lg mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  Where performance meets luxury. Discover the pinnacle of automotive engineering.
                </motion.p>
                <motion.div
                  className="flex gap-6 justify-center"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <button className="px-8 py-4 bg-white text-black text-sm tracking-[0.2em] uppercase hover:bg-white/90 transition-all">
                    Configure Yours
                  </button>
                  <button className="px-8 py-4 border border-white/20 text-white text-sm tracking-[0.2em] uppercase hover:bg-white/10 transition-all">
                    Book Test Drive
                  </button>
                </motion.div>
              </div>
            </section>

            {/* Stats section */}
            <section className="py-32 px-6">
              <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
                {[
                  { value: '1,500', label: 'Horsepower' },
                  { value: '2.4s', label: '0-100 km/h' },
                  { value: '420', label: 'km/h Top Speed' },
                  { value: '16', label: 'Cylinders' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <p className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {stat.value}
                    </p>
                    <p className="text-white/40 text-sm tracking-[0.2em] uppercase">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Features section */}
            <section className="py-32 px-6 bg-gradient-to-b from-black via-white/[0.02] to-black">
              <div className="max-w-6xl mx-auto">
                <motion.p
                  className="text-white/30 text-xs tracking-[0.5em] uppercase mb-4 text-center"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                >
                  Engineering Excellence
                </motion.p>
                <motion.h2
                  className="text-5xl md:text-7xl font-bold text-white mb-16 text-center tracking-tight"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Crafted to Perfection
                </motion.h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { title: 'W16 Engine', desc: 'The most powerful production engine ever built. Four turbochargers deliver relentless power.' },
                    { title: 'Carbon Fiber', desc: 'Every body panel is crafted from lightweight carbon fiber for maximum performance.' },
                    { title: 'Interior', desc: 'Hand-stitched leather, exposed carbon fiber, and cutting-edge technology.' },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      className="p-8 border border-white/10 hover:border-white/20 transition-colors"
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <div className="w-12 h-px bg-white/40 mb-6" />
                      <h3 className="text-xl font-bold text-white mb-4 tracking-wide">{feature.title}</h3>
                      <p className="text-white/40 leading-relaxed">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA section */}
            <section className="py-32 px-6">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                  className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Begin Your Journey
                </motion.h2>
                <motion.p
                  className="text-white/40 text-lg mb-12 max-w-xl mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Experience the Bugatti collection on JO Cars. Find your perfect match.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <button
                    onClick={() => router.push('/')}
                    className="px-12 py-5 bg-white text-black text-sm tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
                  >
                    Explore JO Cars
                  </button>
                </motion.div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-white/30 text-sm tracking-[0.2em]">JO CARS &copy; {new Date().getFullYear()}</p>
                <div className="flex gap-8">
                  {['Privacy', 'Terms', 'Contact'].map((item) => (
                    <button key={item} className="text-white/30 hover:text-white/60 text-sm tracking-[0.15em] uppercase transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
