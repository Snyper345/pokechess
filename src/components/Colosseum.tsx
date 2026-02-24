import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float, Billboard, useTexture, Sparkles, Html, Cloud } from "@react-three/drei";

// Trainer Sprite URLs (Local copies of Gen V Showdown/Bulbagarden sprites)
const TRAINER_URLS = {
    red: "/trainer_red.png", // Red 
    blue: "/trainer_blue.png", // Blue
};

function PlayerPodium({ position, color, textureUrl, isFlipped = false, speechBubble, pet = false }: { position: [number, number, number], color: string, textureUrl: string, isFlipped?: boolean, speechBubble?: string | null, pet?: boolean }) {
    const texture = useTexture(textureUrl);
    texture.magFilter = THREE.NearestFilter;
    if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        // Flip sprite if necessary so they face each other
        if (isFlipped) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.x = -1;
        }
    }

    // Gentle hovering animation for the pet
    const petRef = useRef<THREE.Group>(null!);
    useFrame((state) => {
        if (!petRef.current) return;
        petRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    });

    return (
        <group position={position}>
            {/* The Arena Structure (Rotated to face board center) */}
            <group rotation={[0, isFlipped ? Math.PI : 0, 0]}>
                {/* Elevating Shaft */}
                <mesh position={[0, -2, 0]} castShadow>
                    <cylinderGeometry args={[0.8, 0.8, 4, 32]} />
                    <meshStandardMaterial color="#1a202c" roughness={0.9} />
                </mesh>

                {/* Platform Base Floor */}
                <mesh position={[0, 0, 0]} receiveShadow castShadow>
                    <boxGeometry args={[4, 0.2, 4]} />
                    <meshStandardMaterial color="#2d3748" roughness={0.8} />
                </mesh>

                {/* Outer Glowing Trim */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4.2, 0.1, 4.2]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>

                {/* The Duel Console (Front Desk) */}
                <mesh position={[0, 0.6, 1.5]} rotation={[-0.3, 0, 0]} castShadow>
                    <boxGeometry args={[3.8, 1.5, 1]} />
                    <meshStandardMaterial color="#1a202c" roughness={0.6} metalness={0.5} />
                </mesh>

                {/* The Glowing Holographic Card Zones on the Console */}
                <mesh position={[0, 1.36, 1.3]} rotation={[-Math.PI / 2 - 0.3, 0, 0]}>
                    <planeGeometry args={[3.2, 0.8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>

                {/* Side Walls */}
                <mesh position={[-1.9, 0.5, 0]} castShadow>
                    <boxGeometry args={[0.2, 1.2, 4]} />
                    <meshStandardMaterial color="#2d3748" roughness={0.7} />
                </mesh>
                <mesh position={[1.9, 0.5, 0]} castShadow>
                    <boxGeometry args={[0.2, 1.2, 4]} />
                    <meshStandardMaterial color="#2d3748" roughness={0.7} />
                </mesh>

                {/* Back Wall (for safety!) */}
                <mesh position={[0, 0.5, -1.9]} castShadow>
                    <boxGeometry args={[4, 1.2, 0.2]} />
                    <meshStandardMaterial color="#2d3748" roughness={0.7} />
                </mesh>
            </group>

            {/* Trainer/Player Sprite */}
            <Billboard position={[0, 1.8, isFlipped ? 0.5 : -0.5]}>
                <mesh>
                    <planeGeometry args={[3, 3]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        alphaTest={0.05}
                        side={THREE.DoubleSide}
                        toneMapped={false}
                    />
                </mesh>

                {/* Tiny Animated Shoulder Pet */}
                {pet && (
                    <group ref={petRef} position={[isFlipped ? -1.2 : 1.2, 0.5, 0]}>
                        <Html transform center sprite zIndexRange={[100, 0]} scale={0.5}>
                            <img
                                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/384.gif"
                                alt="Rayquaza Pet"
                                style={{ width: '128px', height: '128px', imageRendering: 'pixelated', opacity: 0.9, filter: 'drop-shadow(0 0 10px #22c55e)' }}
                            />
                        </Html>
                    </group>
                )}

                {/* Speech Bubble attached to Billboard so it faces camera */}
                {speechBubble && (
                    <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
                        <div className="bg-white text-neutral-900 px-4 py-2 rounded-2xl shadow-xl max-w-[250px] text-sm font-bold border-2 border-neutral-200 pointer-events-none relative whitespace-pre-wrap text-center leading-tight">
                            {speechBubble}
                            <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 border-solid border-t-white border-t-[10px] border-x-transparent border-x-[10px] border-b-0 drop-shadow-md"></div>
                        </div>
                    </Html>
                )}
            </Billboard>
        </group>
    );
}

function MoltresFire({ position, castsShadow = false }: { position: [number, number, number], castsShadow?: boolean }) {
    const lightRef = useRef<THREE.PointLight>(null!);
    const fireStoneTexture = useTexture('/fire-stone.png');
    fireStoneTexture.magFilter = THREE.NearestFilter;
    fireStoneTexture.colorSpace = THREE.SRGBColorSpace;

    useFrame((state) => {
        if (!lightRef.current) return;
        // Flickering fire effect
        const t = state.clock.elapsedTime * 8; // fast flicker
        const noise = Math.sin(t) * Math.sin(t * 0.5) * Math.cos(t * 0.2);
        lightRef.current.intensity = 200 + noise * 50; // Vastly increased for Physical Lighting inverse-square dropoff
    });

    return (
        <group position={position}>
            {/* The Fire Stone Fuel Source */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
                <Billboard position={[0, 0, 0]}>
                    <mesh>
                        <planeGeometry args={[1.5, 1.5]} />
                        <meshBasicMaterial
                            map={fireStoneTexture}
                            transparent
                            alphaTest={0.05}
                            side={THREE.DoubleSide}
                            toneMapped={false}
                        />
                    </mesh>
                </Billboard>
            </Float>

            {/* Ember particles rising up */}
            <group position={[0, 0.5, 0]}>
                <Sparkles
                    count={30}
                    scale={1.5}
                    size={4}
                    speed={1.5}
                    opacity={0.8}
                    color="#f97316"
                    noise={0.1}
                />
                <Sparkles
                    count={15}
                    scale={1}
                    size={2}
                    speed={2.5}
                    opacity={1}
                    color="#fde047" // yellow core sparks
                    noise={0.2}
                />
            </group>

            {/* Dynamic illuminating Point Light (uses physically correct Candelas logic) */}
            <pointLight
                ref={lightRef}
                color="#ea580c"
                intensity={150}
                distance={40}
                decay={2}
                castShadow={castsShadow}
                shadow-bias={-0.001}
            />
        </group>
    );
}



const EVO_STONES = [
    "fire-stone", "water-stone", "thunder-stone", "leaf-stone",
    "moon-stone", "sun-stone", "dusk-stone", "dawn-stone",
    "shiny-stone", "ice-stone", "oval-stone", "everstone",
    "light-clay", "hard-stone", "float-stone", "kings-rock"
];

function PillarStone({ type, position }: { type: string, position: [number, number, number] }) {
    // If we have local textures we could use useTexture, but since we are fetching from pokeAPI, we'll use Html or TextureLoader.
    // Actually, texture loader works fine with PokeAPI raw URLs if CORS allows, but let's use useTexture with explicit URL.
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${type.replace(' ', '-')}.png`;
    const texture = useTexture(url);
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    const groupRef = useRef<THREE.Group>(null!);
    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
        groupRef.current.rotation.y += 0.01;
    });

    return (
        <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
            <group ref={groupRef} position={position}>
                <Billboard>
                    <mesh>
                        <planeGeometry args={[1.5, 1.5]} />
                        <meshBasicMaterial
                            map={texture}
                            transparent
                            alphaTest={0.05}
                            side={THREE.DoubleSide}
                            toneMapped={false}
                        />
                    </mesh>
                </Billboard>
                <pointLight color="#ffffff" intensity={10} distance={5} />
            </group>
        </Float>
    );
}

function CelestialRings() {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * 0.1;

        const rings = groupRef.current.children;
        if (rings.length >= 3) {
            rings[0].rotation.x = t * 1.5;
            rings[0].rotation.z = t * 0.5;

            rings[1].rotation.y = t * -1.2;
            rings[1].rotation.z = t * 0.8;

            rings[2].rotation.x = t * 0.8;
            rings[2].rotation.y = t * -0.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Inner Ring */}
            <mesh castShadow receiveShadow>
                <torusGeometry args={[28, 0.4, 32, 100]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} emissive="#b45309" emissiveIntensity={0.5} />
            </mesh>

            {/* Middle Ring */}
            <mesh castShadow receiveShadow>
                <torusGeometry args={[30, 0.6, 32, 100]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} emissive="#334155" emissiveIntensity={0.2} />
            </mesh>

            {/* Outer Giant Ring */}
            <mesh castShadow receiveShadow>
                <torusGeometry args={[32, 1.0, 32, 120]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} emissive="#020617" emissiveIntensity={0.5} />
            </mesh>

            {/* Glowing Energy Ring */}
            <mesh>
                <torusGeometry args={[27.5, 0.1, 16, 100]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

export function Colosseum({ trashTalk }: { trashTalk?: string | null }) {
    // Generate positions for the outer pillars
    const numPillars = 16;
    const arenaRadius = 14;
    const pillars = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let i = 0; i < numPillars; i++) {
            const angle = (i / numPillars) * Math.PI * 2;
            const x = Math.cos(angle) * arenaRadius;
            const z = Math.sin(angle) * arenaRadius;
            positions.push([x, 0, z]); // Lowered so they sit flush on the outer rim
        }
        return positions;
    }, [numPillars, arenaRadius]);

    return (
        <group position={[0, -0.2, 0]}>
            {/* Player Podiums (Behind the board on opposite sides, resting on the lower inner ring) */}
            <PlayerPodium position={[0, -1.0, 9]} color="#ef4444" textureUrl={TRAINER_URLS.red} isFlipped={true} />
            <PlayerPodium position={[0, -1.0, -9]} color="#3b82f6" textureUrl={TRAINER_URLS.blue} speechBubble={trashTalk} pet={true} />

            {/* The Main Battle Platform (Directly under the board) */}
            <mesh position={[0, -0.5, 0]} receiveShadow>
                <cylinderGeometry args={[6.5, 7, 1, 64]} />
                <meshStandardMaterial color="#2d3748" roughness={0.8} />
            </mesh>

            {/* Inner Ring (Moat / Lower ground) */}
            <mesh position={[0, -1.5, 0]} receiveShadow>
                <cylinderGeometry args={[12, 12, 0.5, 64]} />
                <meshStandardMaterial color="#1a202c" roughness={0.9} />
            </mesh>


            {/* Epic Rotating Celestial Rings spanning the map */}
            <CelestialRings />

            {/* Stadium Floor / Outer Boundary */}
            <mesh position={[0, -2, 0]} receiveShadow>
                <cylinderGeometry args={[25, 25, 1, 64]} />
                <meshStandardMaterial color="#171923" roughness={1} />
            </mesh>

            {/* Majestic Pillars standing on the Outer Tier */}
            {pillars.map((pos, idx) => (
                <group key={idx} position={pos}>
                    {/* Pillar Base */}
                    <mesh position={[0, -1.8, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.2, 0.5, 1.2]} />
                        <meshStandardMaterial color="#4a5568" roughness={0.7} />
                    </mesh>

                    {/* Pillar Column */}
                    <mesh position={[0, 1, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.4, 0.5, 5, 16]} />
                        <meshStandardMaterial color="#718096" roughness={0.6} />
                    </mesh>

                    {/* Pillar Top Cap */}
                    <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.2, 0.3, 1.2]} />
                        <meshStandardMaterial color="#4a5568" roughness={0.7} />
                    </mesh>

                    {/* Evolutionary Stone from PokeAPI hovering on top */}
                    <PillarStone type={EVO_STONES[idx % EVO_STONES.length]} position={[0, 4.5, 0]} />
                </group>
            ))}

            {/* Floating Environment Dust/Spores for micro-detail */}
            <Sparkles
                count={200}
                scale={[30, 10, 30]}
                position={[0, 2, 0]}
                size={1.5}
                speed={0.2}
                opacity={0.15}
                color="#cbd5e1"
                noise={1}
            />

            {/* Atmospheric Fog that blends with the dark night HDRI */}
            <fogExp2 attach="fog" args={['#0f172a', 0.035]} />
        </group>
    );
}
