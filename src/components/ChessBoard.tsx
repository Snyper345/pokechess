import { useState, useEffect, Suspense, useRef } from "react";
import { Chess, Square as ChessSquare, Move } from "chess.js";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Environment, ContactShadows, Html, useProgress, Stars } from "@react-three/drei";
import { CapturedPieces } from "./CapturedPieces";
import { Piece3D } from "./Piece3D";
import { AnimatedPiecesManager } from "./AnimatedPiecesManager";
import { BattleOverlay } from "./BattleOverlay";
import { Colosseum } from "./Colosseum";
import { SettingsPanel } from "./SettingsPanel";
import { PromotionModal } from "./PromotionModal";
import { MainMenu } from "./MainMenu";
import { Chat } from "./Chat";
import { MiniMap } from "./MiniMap"; // Added MiniMap import
import { useSettingsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise, SSAO, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { CameraShake } from "@react-three/drei";
import { shakeEvent } from "@/lib/events";
import { Mesh } from "three";
import { playMoveSound, playCaptureSound, playCheckSound, playPokemonCry, toggleBattleMusic, setBgmIntensity } from "@/lib/audio";
import { POKEMON_MAP } from "./Piece3D";
function CinematicCamera() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Subtle procedural sway
    state.camera.position.x += Math.sin(t * 0.5) * 0.005;
    state.camera.position.y += Math.cos(t * 0.4) * 0.005;
    state.camera.position.z += Math.sin(t * 0.3) * 0.005;
    state.camera.lookAt(0, 0, 0); // Keep focus on the board center roughly
  });
  return null;
}

function CameraShakeManager() {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const unsub = shakeEvent.subscribe(() => {
      setShake(true);
      setTimeout(() => setShake(false), 200); // 200ms of intense shake
    });
    return () => { unsub(); };
  }, []);

  return (
    <CameraShake
      maxYaw={shake ? 0.1 : 0}
      maxPitch={shake ? 0.1 : 0}
      maxRoll={shake ? 0.1 : 0}
      yawFrequency={shake ? 20 : 0}
      pitchFrequency={shake ? 20 : 0}
      rollFrequency={shake ? 20 : 0}
    />
  );
}

interface ChessBoardProps {
  className?: string;
}

function Loader() {
  return <Html center><div className="px-4 py-2 bg-black/80 rounded-lg text-white text-sm font-bold shadow-lg animate-pulse whitespace-nowrap">Loading 3D Assets...</div></Html>;
}

function Square3D({
  position,
  isBlack,
  isSelected,
  isLegalMove,
  isHinted = false,
  onClick,
  piece,
}: {
  position: [number, number, number];
  isBlack: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isHinted?: boolean;
  onClick: () => void;
  piece: { type: string; color: string } | null;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (isSelected && meshRef.current) {
      // Pulse effect for selection
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.02;
      meshRef.current.scale.set(1, scale, 1);
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial
          color={
            isSelected
              ? "#fbbf24" // Amber-400
              : isBlack
                ? "#065f46" // Emerald-800
                : "#ecfdf5" // Emerald-50
          }
        />
      </mesh>

      {/* Legal Move Indicator */}
      {isLegalMove && !piece && (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Capture Indicator (Ring) */}
      {isLegalMove && piece && (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* Hint Indicator (Ring) */}
      {isHinted && !isSelected && (
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
        </mesh>
      )}

      {/* The Piece is now handled dynamically by AnimatedPiecesManager */}
    </group>
  );
}

export function ChessBoard({ className }: ChessBoardProps) {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<{ type: string; color: string }[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<{ type: string; color: string }[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: ChessSquare, to: ChessSquare } | null>(null);
  const [hintMove, setHintMove] = useState<{ from: string, to: string } | null>(null);

  // Multiplayer State
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b" | "s" | null>(null);
  const [trashTalk, setTrashTalk] = useState<string | null>(null);
  const [surrenderWinner, setSurrenderWinner] = useState<"w" | "b" | null>(null);
  const [messages, setMessages] = useState<{ sender: string, text: string, isSystem?: boolean }[]>([]);

  // Settings
  const { enableParallax, quality, enableScreenShake, enableHints } = useSettingsStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setBoard(game.board());
    updateCapturedPieces();
    setBgmIntensity(game.inCheck());

    // Chess Bot Hint Fetching
    setHintMove(null);
    if (enableHints && game.turn() === "w" && !game.isGameOver()) {
      const currentFen = game.fen();
      fetch('https://chess-api.com/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: currentFen, depth: 10 })
      })
        .then(res => res.json())
        .then(data => {
          if (data.from && data.to) {
            setHintMove({ from: data.from, to: data.to });
          }
        })
        .catch(console.error);
    }
  }, [game, enableHints]);

  useEffect(() => {
    // Initial music state check based on settings
    const { enableMusic } = useSettingsStore.getState();
    toggleBattleMusic(enableMusic);
  }, []);

  const updateCapturedPieces = () => {
    const history = game.history({ verbose: true }) as Move[];
    const white = history
      .filter((m) => m.captured && m.color === "b")
      .map((m) => ({ type: m.captured!, color: "w" }));
    const black = history
      .filter((m) => m.captured && m.color === "w")
      .map((m) => ({ type: m.captured!, color: "b" }));
    setCapturedWhite(white);
    setCapturedBlack(black);
  };

  const connectToRoom = (targetRoomId: string, uname: string) => {
    if (!targetRoomId) return;

    // Use current host, upgrade to wss if https
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "JOIN_ROOM", roomId: targetRoomId, username: uname }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "INIT_GAME") {
        const newGame = new Chess(data.fen);
        setGame(newGame);
        setPlayerColor(data.color);
        setJoined(true);
        setMessages([{ sender: "System", text: `Connected to ${targetRoomId}`, isSystem: true }]);
      }

      if (data.type === "UPDATE_GAME") {
        const newGame = new Chess(data.fen);
        setGame(newGame);

        // Remote sounds for opponent moves
        if (newGame.turn() === playerColor) { // The opponent just moved, passing turn to player
          if (data.lastMove?.captured) {
            playCaptureSound();
          } else {
            playMoveSound();
          }
          if (!data.isSurrender && (newGame.inCheck() || newGame.isCheckmate())) {
            setTimeout(playCheckSound, 300);
          }
        }

        if (data.isSurrender) {
          setSurrenderWinner(data.winner);
        } else {
          setSurrenderWinner(null);
        }
      }

      if (data.type === "TRASH_TALK") {
        setTrashTalk(data.text);
        setTimeout(() => setTrashTalk(null), 6000);
      }

      if (data.type === "CHAT") {
        setMessages(prev => [...prev, { sender: data.username, text: data.text }]);
      }

      if (data.type === "SYSTEM_MESSAGE") {
        setMessages(prev => [...prev, { sender: "System", text: data.text, isSystem: true }]);
      }

      if (data.type === "ERROR") {
        alert(data.message);
      }
    };

    ws.onclose = () => {
      setJoined(false);
      setPlayerColor(null);
    };
  };

  const executeMove = (moveData: { from: string, to: string, promotion?: string }) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(moveData);
      setGame(newGame);
      setSelectedSquare(null);
      setLegalMoves([]);
      setPendingPromotion(null);

      // Play appropriate sound
      if (result.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
      if (newGame.inCheck() || newGame.isCheckmate()) {
        setTimeout(playCheckSound, 300);
      }

      // Send to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "MOVE",
          move: moveData
        }));
      }
    } catch (e) {
      console.error("Invalid move", e);
    }
  };

  const handleSquareClick = (square: ChessSquare) => {
    // Only allow interaction if it's player's turn and they are a player
    if (!playerColor || playerColor === "s") return;
    if (game.turn() !== playerColor) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const movesToSquare = legalMoves.filter((m) => m.to === square);

      if (movesToSquare.length > 0) {
        if (movesToSquare[0].promotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
        } else {
          executeMove({ from: selectedSquare, to: square });
        }
      } else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          setLegalMoves(game.moves({ square, verbose: true }) as Move[]);
          const pokemonId = POKEMON_MAP[piece.color]?.[piece.type];
          if (pokemonId) playPokemonCry(pokemonId);
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setLegalMoves(game.moves({ square, verbose: true }) as Move[]);
        const pokemonId = POKEMON_MAP[piece.color]?.[piece.type];
        if (pokemonId) playPokemonCry(pokemonId);
      }
    }
  };

  const isSquareLegalMove = (square: ChessSquare) => {
    return legalMoves.some((m) => m.to === square);
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const isGameOver = game.isGameOver() || surrenderWinner !== null;
  let gameOverMessage = "";
  if (surrenderWinner) gameOverMessage = `${surrenderWinner === "w" ? "White" : "Black"} wins by surrender!`;
  else if (game.isCheckmate()) gameOverMessage = `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins!`;
  else if (game.isDraw()) gameOverMessage = "Draw!";
  else if (game.isStalemate()) gameOverMessage = "Stalemate!";

  if (!joined) {
    return <MainMenu onJoin={(id, uname) => { setRoomId(id); setUsername(uname); connectToRoom(id, uname); }} className={className} />;
  }

  return (
    <div className={cn("grid grid-cols-1 xl:grid-cols-4 gap-6 w-full px-4 xl:px-8 min-h-[85vh]", className)}>
      <div className="flex flex-col xl:col-span-3 gap-6 relative w-full h-full">
        {/* Top Player (Black) Captured Pieces */}
        <div className="w-full flex flex-col gap-2 z-10 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <div className="text-white/50 text-xs font-mono uppercase tracking-widest">Captured White Pieces</div>
          </div>
          <div className="pointer-events-auto">
            <CapturedPieces color="w" captured={capturedWhite} />
          </div>
        </div>

        <div className="relative w-full flex-1 border-4 border-orange-900/30 rounded-xl overflow-hidden shadow-2xl bg-black min-h-[500px]">
          <SettingsPanel />
          <BattleOverlay />
          <Canvas
            shadows={{ type: quality === 'high' ? THREE.PCFShadowMap : quality === 'medium' ? THREE.PCFShadowMap : THREE.BasicShadowMap }}
            dpr={quality === 'high' ? [1, 2] : quality === 'medium' ? [1, 1.5] : [1, 1]}
            camera={{ position: playerColor === 'b' ? [0, 8, -8] : [0, 8, 8], fov: 45 }}
            gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
          >
            <Suspense fallback={<Loader />}>
              {/* Subtle directional fill lights for atmospheric depth and rim lighting, avoiding flat ambient light */}
              <directionalLight position={[10, 10, 5]} intensity={1.5} color="#4a5568" castShadow={false} />
              <directionalLight position={[-10, 5, -5]} intensity={1.0} color="#2d3748" castShadow={false} />
              {/* The primary lighting will now come from the animated Torches on the Colosseum pillars */}

              <group position={[-3.5, 0, -3.5]}>
                {ranks.map((rank, rIndex) =>
                  files.map((file, cIndex) => {
                    const square = `${file}${rank}` as ChessSquare;
                    const piece = game.get(square);
                    const isBlack = (rIndex + cIndex) % 2 === 1;
                    // In 3D, x corresponds to file (cIndex), z corresponds to rank (rIndex)
                    // But ranks go 8->1 (top to bottom), so rIndex 0 is rank 8 (z=0)
                    return (
                      <Square3D
                        key={square}
                        position={[cIndex, 0, rIndex]}
                        isBlack={isBlack}
                        isSelected={selectedSquare === square}
                        isLegalMove={isSquareLegalMove(square)}
                        isHinted={hintMove?.from === square || hintMove?.to === square}
                        onClick={() => handleSquareClick(square)}
                        piece={piece ? { type: piece.type, color: piece.color } : null}
                      />
                    );
                  })
                )}
              </group>

              <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
              <Environment preset="night" environmentIntensity={1.0} background={false} />
              <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              <Colosseum trashTalk={null} />

              {trashTalk && (
                <Html position={[0, 4, -4]} center transform>
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-[2rem] rounded-br-none shadow-2xl border-4 border-emerald-500 pointer-events-none relative max-w-[250px] animate-bounce">
                    <p className="text-lg font-black text-emerald-950 text-center leading-tight">{trashTalk}</p>
                  </div>
                </Html>
              )}

              <AnimatedPiecesManager game={game} />
              <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} enableDamping dampingFactor={0.05} />
              <CinematicCamera />

              {enableScreenShake && <CameraShakeManager />}
              {quality !== 'low' && (
                <EffectComposer multisampling={0}>
                  {quality === 'high' && (
                    <SSAO
                      blendFunction={BlendFunction.MULTIPLY}
                      samples={31}
                      radius={0.2}
                      intensity={20}
                    />
                  )}
                  {quality === 'high' ? (
                    <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.0} levels={8} opacity={1} />
                  ) : (
                    <Bloom luminanceThreshold={0.8} mipmapBlur intensity={0.5} levels={4} opacity={1} />
                  )}
                  <Vignette eskil={false} offset={0.1} darkness={1.0} />
                  {quality === 'high' && <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.05} />}
                  <ToneMapping />
                </EffectComposer>
              )}
            </Suspense>
          </Canvas>

          <AnimatePresence>
            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg pointer-events-auto"
              >
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4">
                  <h2 className="text-3xl font-black text-emerald-900 mb-2">GAME OVER</h2>
                  <p className="text-lg text-emerald-700 font-medium mb-6">{gameOverMessage}</p>
                  <button
                    onClick={() => {
                      setSurrenderWinner(null);
                      if (wsRef.current) {
                        wsRef.current.send(JSON.stringify({ type: "RESET" }));
                      }
                    }}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Rematch
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Player (White) Captured Pieces */}
        <div className="w-full flex flex-col gap-2 z-10 pointer-events-none">
          <div className="text-white/50 text-xs font-mono uppercase tracking-widest pointer-events-auto">Captured Black Pieces</div>
          <div className="pointer-events-auto">
            <CapturedPieces color="b" captured={capturedBlack} />
          </div>
        </div>

        <div className="flex gap-4 text-white font-mono text-sm bg-black/50 p-4 rounded-lg backdrop-blur-sm w-full justify-between items-center z-10 pointer-events-auto">
          <div>
            Turn:{" "}
            <span className={game.turn() === "w" ? "text-yellow-300 font-bold" : "text-purple-400 font-bold"}>
              {game.turn() === "w" ? "White" : "Black"}
            </span>
            <span className="ml-4 text-neutral-400">
              You are: <span className="font-bold text-white">{playerColor === 'w' ? "White" : playerColor === 'b' ? "Black" : "Spectator"}</span>
            </span>
          </div>
          {game.isCheck() && !isGameOver && <div className="text-red-500 font-bold animate-pulse">CHECK!</div>}
          <div className="flex items-center gap-4">
            <div className="text-xs text-white/50">Room: {roomId}</div>
            {playerColor && playerColor !== 's' && !isGameOver && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to surrender?")) {
                    if (wsRef.current) {
                      wsRef.current.send(JSON.stringify({ type: "SURRENDER" }));
                    }
                  }
                }}
                className="px-3 py-1 bg-red-900/80 hover:bg-red-700 text-red-200 text-xs rounded border border-red-700 transition-colors"
              >
                Surrender
              </button>
            )}
          </div>
        </div>

        <PromotionModal
          isOpen={!!pendingPromotion}
          color={game.turn() as "w" | "b"}
          onSelect={(promotion) => {
            if (pendingPromotion) {
              executeMove({ ...pendingPromotion, promotion });
            }
          }}
          onCancel={() => setPendingPromotion(null)}
        />
      </div>

      <div className="flex flex-col xl:col-span-1 h-full gap-4 max-h-screen">
        <MiniMap game={game} playerColor={playerColor === 'b' ? 'b' : 'w'} />
        <Chat
          className="flex-1 min-h-[400px]"
          messages={messages}
          onSendMessage={(text) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "CHAT", text }));
            }
          }}
        />
      </div>
    </div>
  );
}
