import { useEffect, useState, useRef, Suspense } from "react";
import { Chess, Move, Square as ChessSquare } from "chess.js";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Piece3D } from "./Piece3D";
import { Trail, Sparkles } from "@react-three/drei";
import { shakeEvent, battleEvent } from "@/lib/events";
import { useSettingsStore } from "@/lib/store";

interface AnimatedPieceData {
    id: string; // Unique ID so it persists across moves (e.g., 'wp1', 'bk')
    type: string;
    color: string;
    square: ChessSquare;
    isCaptured: boolean;
    attackerType?: string;
}

// Map file (a-h) and rank (1-8) to 3D grid coordinates
function getBoardPos(square: ChessSquare): [number, number, number] {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(square[1]);
    return [file, 0.1, rank];
}

// Visual explosive VFX for captures
function CaptureVFX({ type }: { type?: string }) {
    const ringRef = useRef<THREE.Mesh>(null!);
    const matRef = useRef<THREE.MeshBasicMaterial>(null!);

    useFrame((_, delta) => {
        if (ringRef.current && matRef.current) {
            // Expand rapidly
            ringRef.current.scale.addScalar(delta * 25);
            // Fade out
            matRef.current.opacity = Math.max(0, matRef.current.opacity - delta * 2.5);
        }
    });

    let mainColor = "#ffffff";
    let subColor = "#aaaaaa";

    switch (type) {
        case 'n': // Fire (Rapidash / Arcanine)
            mainColor = "#ef4444"; // Red
            subColor = "#f97316"; // Orange
            break;
        case 'p': // Electric (Pikachu) or Normal (Meowth) 
            mainColor = "#fbbf24"; // Yellow
            subColor = "#fef08a";
            break;
        case 'b': // Psychic / Ghost
        case 'q':
        case 'k':
            mainColor = "#c084fc"; // Purple
            subColor = "#e879f9";
            break;
        case 'r': // Rock / Normal
            mainColor = "#a8a29e"; // Stone
            subColor = "#78716c";
            break;
    }

    return (
        <group>
            <mesh ref={ringRef} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.2, 0.1, 16, 64]} />
                <meshBasicMaterial
                    ref={matRef}
                    color={mainColor}
                    transparent
                    opacity={1}
                    depthWrite={false}
                    toneMapped={false} // Glow
                />
            </mesh>
            <Sparkles
                count={80}
                scale={3.5}
                size={12}
                speed={3}
                opacity={1}
                color={mainColor}
                noise={0.5}
            />
            <Sparkles
                count={40}
                scale={2}
                size={18}
                speed={4}
                opacity={1}
                color={subColor}
                noise={0.8}
            />
        </group>
    );
}

function AnimatedPiece({ data }: { data: AnimatedPieceData }) {
    const groupRef = useRef<THREE.Group>(null!);
    const trailGroupRef = useRef<THREE.Group>(null!);
    const { enableParticles, animationSpeed } = useSettingsStore();

    // Animation states
    const [spawnStartTime, setSpawnStartTime] = useState<number | null>(null);
    const [captureStartTime, setCaptureStartTime] = useState<number | null>(null);
    const [prevSquare, setPrevSquare] = useState(data.square);
    const [isMoving, setIsMoving] = useState(false);

    // Material ref for flash effect
    const flashMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

    const targetPos = data.isCaptured
        ? new THREE.Vector3(getBoardPos(data.square)[0], 5, getBoardPos(data.square)[2])
        : new THREE.Vector3(...getBoardPos(data.square));

    // Initialize position for spawn
    useEffect(() => {
        if (groupRef.current) {
            // Start high up and scaled 0
            groupRef.current.position.set(getBoardPos(data.square)[0], 8, getBoardPos(data.square)[2]);
            groupRef.current.scale.setScalar(0);
            setSpawnStartTime(Date.now());
        }
    }, []);

    // Detect captures or movement
    useEffect(() => {
        if (data.isCaptured && !captureStartTime) {
            setCaptureStartTime(Date.now());
            shakeEvent.emit(); // TRIGGER IMPACT SHAKE!
        }
        if (data.square !== prevSquare) {
            setPrevSquare(data.square);
        }
    }, [data.isCaptured, data.square, prevSquare, captureStartTime]);

    useFrame((state, baseDelta) => {
        if (!groupRef.current) return;
        const now = Date.now();
        const delta = baseDelta * animationSpeed; // Scale delta by user setting

        // 1. Spawn Animation (Pokéball jump out)
        if (spawnStartTime && now - spawnStartTime < 1000 / animationSpeed) {
            const progress = ((now - spawnStartTime) * animationSpeed) / 1000;
            // Easing functions for bounce
            const bounceY = Math.max(0, Math.sin(progress * Math.PI) * 4); // Jump arc
            const finalY = getBoardPos(data.square)[1];

            groupRef.current.position.y = finalY + (1 - progress) * 8 + bounceY;
            groupRef.current.scale.setScalar(Math.min(1, progress * 1.5));
            return; // Skip normal damping while spawning
        } else if (spawnStartTime) {
            setSpawnStartTime(null); // Finish spawn
            groupRef.current.scale.setScalar(1);
            groupRef.current.position.y = getBoardPos(data.square)[1];
        }

        // 2. Capture Animation (Hit flash and shake)
        if (data.isCaptured && captureStartTime) {
            const elapsed = now - captureStartTime;
            if (elapsed < 500 / animationSpeed) {
                // Flash red and shake
                const shakeIntensity = 0.2 * (1 - (elapsed * animationSpeed) / 500);
                groupRef.current.position.x = targetPos.x + (Math.random() - 0.5) * shakeIntensity;
                groupRef.current.position.z = targetPos.z + (Math.random() - 0.5) * shakeIntensity;

                if (flashMaterialRef.current) {
                    flashMaterialRef.current.opacity = 0.6 * (1 - (elapsed * animationSpeed) / 500); // Gentle fade out
                }
            } else {
                // Fainting Animation: Sink into ground, shrink, fade out
                groupRef.current.scale.setScalar(
                    THREE.MathUtils.damp(groupRef.current.scale.x, 0.5, 8, delta)
                );
                groupRef.current.position.y -= delta * 4; // Sink fast
                if (flashMaterialRef.current) flashMaterialRef.current.opacity = 0;
            }
            return; // Skip normal damping while captured
        }

        // 3. Normal Movement (with Lunge if attacking)
        const dist = groupRef.current.position.distanceTo(targetPos);
        const isCurrentlyMoving = dist > 0.05;

        // If we are moving and very close to target, trigger a tiny "lunge/bump" before settling
        if (isCurrentlyMoving && dist < 0.5 && dist > 0.1) {
            const lungeOffset = new THREE.Vector3().subVectors(targetPos, groupRef.current.position).normalize().multiplyScalar(0.2 * animationSpeed);
            groupRef.current.position.add(lungeOffset);
        }

        groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetPos.x, 12, delta);
        groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPos.y, 12, delta);
        groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetPos.z, 12, delta);

        // Keep trail target synced with piece position
        if (trailGroupRef.current) {
            trailGroupRef.current.position.copy(groupRef.current.position);
            // Lift trail slightly so it isn't completely buried in the board
            trailGroupRef.current.position.y += 0.2;
        }
    });

    const isEvolved = data.id.includes('_p') && data.type === 'q';

    return (
        <>
            <group ref={groupRef}>
                <Suspense fallback={null}>
                    {/* We render it at local 0,0,0 because the parent group handles movement */}
                    <Piece3D type={data.type} color={data.color} position={[0, 0, 0]} isEvolved={isEvolved} />

                    {/* Hit Flash overlay sphere */}
                    {data.isCaptured && enableParticles && (
                        <mesh position={[0, 0.5, 0]}>
                            <sphereGeometry args={[0.5, 16, 16]} />
                            <meshBasicMaterial
                                ref={flashMaterialRef}
                                color="red"
                                transparent
                                opacity={0}
                                depthWrite={false}
                            />
                        </mesh>
                    )}
                </Suspense>
            </group>

            {/* Shockwave burst on the square */}
            {data.isCaptured && enableParticles && captureStartTime && (Date.now() - captureStartTime < 1000) && (
                <group position={targetPos}>
                    <CaptureVFX type={data.attackerType} />
                </group>
            )}

            {/* Motion Blur Trail effect that follows the piece */}
            {!data.isCaptured && (
                <group ref={trailGroupRef}>
                    <Trail
                        width={1.2}
                        length={5} // frames to keep
                        decay={3} // how fast it fades
                        color={data.color === "w" ? "#fbbf24" : "#a78bfa"}
                        attenuation={(t) => t * t}
                    >
                        {/* The trail strictly acts as a visual streak generator */}
                        <mesh visible={false}>
                            <boxGeometry args={[0.1, 0.1, 0.1]} />
                        </mesh>
                    </Trail>
                </group>
            )}
        </>
    );
}

export function AnimatedPiecesManager({ game }: { game: Chess }) {
    const [pieces, setPieces] = useState<AnimatedPieceData[]>([]);

    // Calculate unique persistant pieces directly from chess.js board state
    useEffect(() => {
        const board = game.board();

        // Instead of complex tracking, we just rebuild the state:
        // Actually, chess.js history tells us exactly what moved!
        setPieces((currentPieces) => {
            const currentFen = game.fen();
            const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

            // If this is the initial load or a game reset, create all 32 pieces
            if (currentPieces.length === 0 || currentFen === initialFen) {
                const newPieces: AnimatedPieceData[] = [];
                let pId = 0;
                for (let r = 0; r < 8; r++) {
                    for (let f = 0; f < 8; f++) {
                        const piece = board[r][f];
                        if (piece) {
                            const fileStr = String.fromCharCode('a'.charCodeAt(0) + f);
                            const rankStr = String(8 - r);
                            const square = `${fileStr}${rankStr}` as ChessSquare;
                            newPieces.push({
                                id: `piece_${Date.now()}_${pId++}_${piece.color}_${piece.type}`,
                                type: piece.type,
                                color: piece.color,
                                square: square,
                                isCaptured: false
                            });
                        }
                    }
                }
                return newPieces;
            }

            // If we already have pieces, we apply changes based on the NEW board state compared to our tracked pieces array.
            // This allows pieces to persist their identity and animate.
            const updatedList = [...currentPieces];
            const squareOccupancy = new Map<string, { type: string, color: string }>();

            for (let r = 0; r < 8; r++) {
                for (let f = 0; f < 8; f++) {
                    const piece = board[r][f];
                    if (piece) {
                        const square = `${String.fromCharCode('a'.charCodeAt(0) + f)}${8 - r}` as ChessSquare;
                        squareOccupancy.set(square, piece);
                    }
                }
            }

            // Reset all non-captured tracking, then we match them up
            // 1. Move known pieces to their new squares (or mark captured)
            // This is a naive reconciliation:

            // For each square on the new board:
            squareOccupancy.forEach((pieceData, square) => {
                // Is there already a piece of this exact type+color on this square?
                const existingPieceHere = updatedList.find(p => !p.isCaptured && p.square === square && p.type === pieceData.type && p.color === pieceData.color);
                if (existingPieceHere) {
                    // It didn't move
                    return;
                }

                // It moved HERE from somewhere else. Find a piece of the same type+color that is no longer on its tracked square.
                // A piece is "displaced" if its tracked square is empty or occupied by something else in the new board.
                const displacedCandidate = updatedList.find(p => {
                    if (p.isCaptured) return false;
                    // For promotions, a pawn might change to a queen, but it keeps its color.
                    // If the p.type was 'p' and the new type is 'q', and they are the same color, this is a valid promotion path.
                    if (p.color !== pieceData.color) return false;

                    const isPromotion = p.type === 'p' && pieceData.type === 'q';

                    if (p.type !== pieceData.type && !isPromotion) return false;

                    const squareNow = squareOccupancy.get(p.square);
                    return !squareNow || (squareNow.color !== p.color) || (squareNow.type !== p.type && !(squareNow.type === 'q' && p.type === 'p'));
                });

                if (displacedCandidate) {
                    displacedCandidate.square = square as ChessSquare;
                    if (displacedCandidate.type === 'p' && pieceData.type === 'q') {
                        displacedCandidate.type = 'q'; // Mark as promoted natively so the Sprite updates
                    }
                }
            });

            // 2. Mark any remaining displaced pieces as captured (they were eaten)
            updatedList.forEach(p => {
                if (!p.isCaptured) {
                    // Check if the current square actually still holds THIS piece (or its promoted form)
                    const actualHole = squareOccupancy.get(p.square);
                    const stillExists = actualHole && actualHole.color === p.color && (actualHole.type === p.type || (p.type === 'q' && p.id.includes('_p')));

                    if (!stillExists) {
                        p.isCaptured = true;
                        if (actualHole) {
                            p.attackerType = actualHole.type;

                            const attackerTracker = updatedList.find(x => x.square === p.square && x.type === actualHole.type && x.color === actualHole.color);
                            const attackerEvolved = attackerTracker ? (attackerTracker.id.includes('_p') && attackerTracker.type === 'q') : false;
                            const defenderEvolved = p.id.includes('_p') && p.type === 'q';

                            // Trigger full screen battle animation
                            battleEvent.emit({
                                attacker: { type: actualHole.type, color: actualHole.color, isEvolved: attackerEvolved },
                                defender: { type: p.type, color: p.color, isEvolved: defenderEvolved }
                            });
                        }
                    }
                }
            });

            return updatedList;
        });

    }, [game.fen()]); // Reconcile pieces whenever the game state completely changes

    return (
        <group position={[-3.5, 0, -3.5]}>
            {pieces.map((p) => (
                <AnimatedPiece key={p.id} data={p} />
            ))}
        </group>
    );
}
