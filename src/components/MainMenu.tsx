import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CharacterCreator } from "./CharacterCreator";
import { useCharacterStore, TRAINER_SPRITES, COMPANION_POKEMON } from "@/lib/store";

interface MainMenuProps {
    onJoin: (roomId: string, username: string) => void;
    className?: string;
}

export function MainMenu({ onJoin, className }: MainMenuProps) {
    const [username, setUsername] = useState(() => localStorage.getItem("pokechess_username") || "");
    const [roomId, setRoomId] = useState("");
    const [activeRooms, setActiveRooms] = useState<string[]>([]);
    const [leaderboard, setLeaderboard] = useState<{ username: string, elo: number }[]>([]);
    const [showCreator, setShowCreator] = useState(false);

    const { trainerSprite, trainerTitle, companionPokemon } = useCharacterStore();
    const selectedSprite = TRAINER_SPRITES.find(s => s.id === trainerSprite) || TRAINER_SPRITES[0];
    const selectedCompanion = COMPANION_POKEMON.find(p => p.id === companionPokemon);

    useEffect(() => {
        const fetchData = () => {
            fetch("/api/rooms").then(r => r.json()).then(data => setActiveRooms(data.rooms || [])).catch(() => { });
            fetch("/api/leaderboard").then(r => r.json()).then(data => setLeaderboard(data.leaderboard || [])).catch(() => { });
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Peer-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const handleJoin = (targetRoom: string) => {
        if (!username.trim()) {
            alert("Please enter a username!");
            return;
        }
        localStorage.setItem("pokechess_username", username.trim());
        onJoin(targetRoom, username.trim());
    };

    return (
        <>
            <div className={cn("flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto h-[500px]", className)}>
                {/* Left Col: Menu & Auth */}
                <div className="flex-1 flex flex-col gap-5 bg-neutral-900/80 p-6 rounded-2xl border-2 border-neutral-800 shadow-2xl backdrop-blur-md">
                    {/* Trainer Profile + Character Preview */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider text-emerald-400">Trainer Profile</h2>
                        <div className="flex items-center gap-4 mb-3">
                            {/* Character Preview */}
                            <div
                                className="relative flex-shrink-0 w-16 h-16 rounded-xl bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors group"
                                onClick={() => setShowCreator(true)}
                            >
                                <img
                                    src={selectedSprite.url}
                                    alt={selectedSprite.label}
                                    className="w-12 h-12 object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6">
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${companionPokemon}.gif`}
                                        alt="Companion"
                                        className="w-full h-full object-contain"
                                        style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.5))' }}
                                    />
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center">
                                    <span className="text-xs text-white/0 group-hover:text-white/80 font-bold transition-colors">Edit</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter your Username..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    maxLength={16}
                                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 text-white border-2 border-neutral-700 focus:outline-none focus:border-emerald-500 transition-colors font-bold text-sm"
                                />
                                <div className="text-[10px] text-neutral-500 mt-1 font-bold uppercase tracking-wider">{trainerTitle} • {selectedCompanion?.name}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreator(true)}
                            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 hover:border-emerald-500 text-neutral-300 hover:text-emerald-300 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span>🎨</span> Customize Character
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider text-emerald-400">Play Game</h2>

                        <button
                            onClick={() => handleJoin("ai-rival")}
                            className="w-full py-4 bg-purple-900 hover:bg-purple-800 border border-purple-500 text-white rounded-xl font-black text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="text-2xl">⚡</span> PLAY VS GARY (AI)
                        </button>

                        <div className="relative flex items-center p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                            <input
                                type="text"
                                placeholder="Room or Friend ID"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="flex-1 bg-transparent text-white focus:outline-none font-bold placeholder:text-neutral-500"
                            />
                            <button
                                onClick={() => handleJoin(roomId || `room-${Math.floor(Math.random() * 10000)}`)}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md transition-colors"
                            >
                                {roomId ? "Join" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Leaderboard & Active Rooms */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-1 bg-neutral-900/80 p-6 rounded-2xl border-2 border-neutral-800 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
                        <h2 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span>🏆</span> Top Trainers
                        </h2>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {leaderboard.length === 0 ? (
                                <div className="text-neutral-500 italic text-center mt-4">No trainers ranked yet...</div>
                            ) : (
                                leaderboard.map((u, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                                        <span className="font-bold text-white flex gap-3">
                                            <span className={i < 3 ? "text-yellow-400" : "text-neutral-400"}>#{i + 1}</span> {u.username}
                                        </span>
                                        <span className="text-emerald-400 font-mono">{u.elo}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-1/3 bg-neutral-900/80 p-6 rounded-2xl border-2 border-neutral-800 shadow-2xl backdrop-blur-md flex flex-col">
                        <h2 className="text-md font-bold text-white mb-2 uppercase tracking-wider text-neutral-400">🔥 Active Rooms</h2>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {activeRooms.length === 0 ? (
                                <div className="text-neutral-600 italic text-sm text-center mt-2">No active multiplayer rooms!</div>
                            ) : (
                                activeRooms.map((room, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 bg-neutral-800/30 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => handleJoin(room)}>
                                        <span className="text-white text-sm font-bold">{room}</span>
                                        <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Join</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Character Creator Modal */}
            {showCreator && <CharacterCreator onClose={() => setShowCreator(false)} />}
        </>
    );
}
