import { useLoader, useFrame } from "@react-three/fiber";
import { TextureLoader } from "three";
import { Billboard, Text } from "@react-three/drei";
import { useMemo, useState, useRef } from "react";
import * as THREE from "three";


interface Piece3DProps {
  type: string; // 'p', 'n', 'b', 'r', 'q', 'k'
  color: string; // 'w', 'b'
  position: [number, number, number];
  isEvolved?: boolean;
}

export const POKEMON_MAP: Record<string, Record<string, number>> = {
  w: {
    p: 624, // Pawniard
    r: 411, // Bastiodon
    n: 475, // Gallade
    b: 65,  // Alakazam
    q: 282, // Gardevoir
    k: 199, // Slowking
  },
  b: {
    p: 624, // Pawniard
    r: 306, // Aggron
    n: 647, // Keldeo
    b: 576, // Gothitelle
    q: 31,  // Nidoqueen
    k: 34,  // Nidoking
  },
};

const PIECE_HEIGHTS: Record<string, number> = {
  p: 1,
  r: 1.2,
  n: 1.2,
  b: 1.3,
  q: 1.5,
  k: 1.6,
};

const PIECE_LABELS: Record<string, string> = {
  k: "K",
  q: "Q",
  r: "R",
  b: "B",
  n: "N",
};

export function Piece3D({ type, color, position, isEvolved }: Piece3DProps) {
  let pokemonId = POKEMON_MAP[color]?.[type];

  // Evolution Override for Promoted Pawns (Pawniard -> Bisharp)
  if (isEvolved) {
    pokemonId = 625; // Bisharp
  }

  if (!pokemonId) return null;

  // Determine sprite variation on mount
  const spriteUrl = useMemo(() => {
    // 1. Force Shiny for White Pawniard and its evolved form (White Bisharp)
    let isShiny = false;
    if (color === 'w' && (pokemonId === 624 || pokemonId === 625)) {
      isShiny = true;
    } else {
      isShiny = Math.random() < 0.05; // 5% chance for a piece to be shiny
    }
    const isFemale = Math.random() < 0.2; // 20% chance for female sprite (if it exists)

    // Check if we will try to use a female form (only certain pokemon have noticeable ones but pokeapi often routes correctly or falls back)
    // For simplicity with pokeapi, we'll just use the main front_default or front_shiny

    const basePath = isShiny ? "shiny/" : "";

    // Standard Fallback URL
    return `/sprites/static/${basePath}${pokemonId}.png`;
  }, [pokemonId, color]);

  const texture = useLoader(TextureLoader, spriteUrl);

  // Fix texture encoding/filtering for pixel art look
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  const isWhite = color === "w";
  const baseColor = isWhite ? "#e5e5e5" : "#333333";
  const rimColor = isWhite ? "#ffffff" : "#1a1a1a";
  const height = PIECE_HEIGHTS[type] || 1;
  const label = isEvolved ? `Promoted ${PIECE_LABELS[type]}` : PIECE_LABELS[type];
  const spriteSize = 1.2 * (height * 0.8);
  const [hovered, setHovered] = useState(false);
  const spriteRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (spriteRef.current) {
      // Subtle float animation based on piece position to desync them
      const offset = position[0] * 1.5 + position[2] * 2.3;
      spriteRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + offset) * 0.03;
    }
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* The Base */}
      <group position={[0, 0.1, 0]}>
        {/* Main Base Cylinder */}
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.35, 0.45, 0.2, 32]} />
          <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Rim/Detail */}
        <mesh castShadow receiveShadow position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.05, 32]} />
          <meshStandardMaterial color={rimColor} roughness={0.2} metalness={0.5} />
        </mesh>
      </group>

      {/* The Sprite Standee */}
      <group ref={spriteRef}>
        <Billboard position={[0, 0.3 + (height * 0.5), 0]}>
          <mesh castShadow receiveShadow>
            <planeGeometry args={[spriteSize, spriteSize]} />
            <meshStandardMaterial
              map={texture}
              transparent
              alphaTest={0.5}
              side={THREE.DoubleSide}
              roughness={0.8}
              emissive={isWhite ? "#222" : "#000"}
              emissiveIntensity={0.2}
            />
          </mesh>
        </Billboard>
      </group>

      {/* Piece identifier label */}
      {label && hovered && (
        <Billboard position={[0, 0.3 + spriteSize + 0.15, 0]}>
          <Text
            fontSize={0.25}
            color={isWhite ? "#fbbf24" : "#a78bfa"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
            fontWeight="bold"
          >
            {label}
          </Text>
        </Billboard>
      )}

      {/* Shadow for the sprite to ground it visually on the base */}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
