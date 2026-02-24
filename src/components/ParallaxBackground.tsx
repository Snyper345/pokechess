import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Cloud, Sparkles, Float } from "@react-three/drei";

// Floating particles that drift slowly, creating depth
function ParticleField() {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const count = 200;

    const { positions, scales, speeds } = useMemo(() => {
        const positions: Float32Array = new Float32Array(count * 3);
        const scales: number[] = [];
        const speeds: number[] = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 25 - 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            scales.push(Math.random() * 0.06 + 0.02);
            speeds.push(Math.random() * 0.3 + 0.1);
        }

        return { positions, scales, speeds };
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const dummy = new THREE.Object3D();
        const t = state.clock.elapsedTime;

        for (let i = 0; i < count; i++) {
            const x = positions[i * 3] + Math.sin(t * speeds[i] + i) * 0.5;
            const y = positions[i * 3 + 1] + Math.sin(t * speeds[i] * 0.7 + i * 2) * 0.3;
            const z = positions[i * 3 + 2] + Math.cos(t * speeds[i] * 0.5 + i) * 0.5;
            dummy.position.set(x, y, z);
            const s = scales[i] * (1 + Math.sin(t * 2 + i) * 0.3);
            dummy.scale.setScalar(s);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} />
        </instancedMesh>
    );
}

// Dreamy, slow-moving smoke/nebula effect using Drei's Cloud
function DreamSmoke() {
    return (
        <group position={[0, 0, -15]}>
            <Cloud
                opacity={0.3}
                speed={0.2} // Slow drift
                scale={2}
                color="#8b5cf6" // Soft purple
                position={[-10, 5, -5]}
            />
            <Cloud
                opacity={0.25}
                speed={0.15}
                scale={1.5}
                color="#0ea5e9" // Soft blue
                position={[10, 8, -8]}
            />
            <Cloud
                opacity={0.2}
                speed={0.25}
                scale={2.5}
                color="#10b981" // Soft emerald
                position={[0, -5, -10]}
            />
        </group>
    );
}

// Gentle ambient sparkles that float around like fireflies or magic dust
function MagicDust() {
    return (
        <Sparkles
            count={150}
            scale={25} // Spread area
            size={2} // Particle size
            speed={0.3} // Movement speed
            opacity={0.4}
            color="#fef08a" // Yellow-ish magic tint
            position={[0, 5, -10]}
        />
    );
}

// Subtle rotating geometric rings at different depths
function FloatingRings() {
    const ringsRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!ringsRef.current) return;
        const t = state.clock.elapsedTime;
        ringsRef.current.children.forEach((ring, i) => {
            ring.rotation.x = t * 0.1 * (i % 2 === 0 ? 1 : -1);
            ring.rotation.z = t * 0.08 * (i % 3 === 0 ? 1 : -1);
        });
    });

    return (
        <group ref={ringsRef}>
            <mesh position={[-10, 6, -14]} rotation={[0.5, 0.3, 0]}>
                <torusGeometry args={[2, 0.03, 8, 64]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
            </mesh>
            <mesh position={[12, 10, -20]} rotation={[1, 0.5, 0]}>
                <torusGeometry args={[3, 0.04, 8, 64]} />
                <meshBasicMaterial color="#a78bfa" transparent opacity={0.15} />
            </mesh>
            <mesh position={[0, 14, -18]} rotation={[0.2, 1, 0.5]}>
                <torusGeometry args={[2.5, 0.03, 8, 64]} />
                <meshBasicMaterial color="#34d399" transparent opacity={0.18} />
            </mesh>
        </group>
    );
}

// Shooting stars effect
function ShootingStars() {
    const count = 5;
    const meshRef = useRef<THREE.InstancedMesh>(null!);

    const data = useMemo(() => {
        const items = [];
        for (let i = 0; i < count; i++) {
            items.push({
                startX: (Math.random() - 0.5) * 30,
                startY: Math.random() * 15 + 5,
                startZ: (Math.random() - 0.5) * 20 - 10,
                speed: Math.random() * 3 + 2,
                delay: Math.random() * 20,
                length: Math.random() * 1 + 0.5,
            });
        }
        return items;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const dummy = new THREE.Object3D();
        const t = state.clock.elapsedTime;

        for (let i = 0; i < count; i++) {
            const d = data[i];
            const cycle = (t + d.delay) % 12;
            if (cycle < 1.5) {
                const progress = cycle / 1.5;
                dummy.position.set(
                    d.startX + progress * 8,
                    d.startY - progress * 6,
                    d.startZ
                );
                dummy.scale.set(d.length, 0.02, 0.02);
                dummy.rotation.z = -Math.atan2(6, 8);
            } else {
                dummy.position.set(0, -100, 0);
                dummy.scale.setScalar(0);
            }
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </instancedMesh>
    );
}

export function ParallaxBackground() {
    return (
        <group>
            <DreamSmoke />
            <MagicDust />
            <ParticleField />
            <FloatingRings />
            <ShootingStars />
        </group>
    );
}
