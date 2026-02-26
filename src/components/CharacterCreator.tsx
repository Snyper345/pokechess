import { useState } from "react";
import { useCharacterStore, TRAINER_SPRITES, TRAINER_TITLES, COMPANION_POKEMON } from "@/lib/store";

type Tab = "trainer" | "title" | "companion";

export function CharacterCreator({ onClose }: { onClose: () => void }) {
    const {
        trainerSprite, setTrainerSprite,
        trainerTitle, setTrainerTitle,
        companionPokemon, setCompanionPokemon,
    } = useCharacterStore();

    const [activeTab, setActiveTab] = useState<Tab>("trainer");

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: "trainer", label: "Sprite", icon: "🧑‍🎓" },
        { id: "title", label: "Title", icon: "🏷️" },
        { id: "companion", label: "Partner", icon: "✨" },
    ];

    const selectedSprite = TRAINER_SPRITES.find(s => s.id === trainerSprite) || TRAINER_SPRITES[0];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95" style={{ animation: 'fadeInUp 0.3s ease-out' }}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-800">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        <span className="text-yellow-400">⚡</span> Character Creator
                    </h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white/60 hover:text-white transition-colors text-lg font-bold">✕</button>
                </div>

                {/* Preview Banner */}
                <div className="flex items-center gap-6 p-5 bg-gradient-to-r from-emerald-950/50 to-purple-950/50 border-b border-neutral-800">
                    <div className="relative">
                        <img
                            src={selectedSprite.url}
                            alt={selectedSprite.label}
                            className="w-20 h-20 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-10 h-10">
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${companionPokemon}.gif`}
                                alt="Companion"
                                className="w-full h-full object-contain"
                                style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.6))' }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{trainerTitle}</div>
                        <div className="text-white font-black text-lg">{selectedSprite.label}</div>
                        <div className="text-neutral-400 text-xs mt-1 flex items-center gap-1">
                            Partner: <span className="text-yellow-300 font-bold">{COMPANION_POKEMON.find(p => p.id === companionPokemon)?.name}</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 p-3 bg-neutral-900">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                }`}
                        >
                            <span className="mr-1.5">{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === "trainer" && (
                        <div className="grid grid-cols-4 gap-3">
                            {TRAINER_SPRITES.map(sprite => (
                                <button
                                    key={sprite.id}
                                    onClick={() => setTrainerSprite(sprite.id)}
                                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${trainerSprite === sprite.id
                                        ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                        : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-500'
                                        }`}
                                >
                                    <img
                                        src={sprite.url}
                                        alt={sprite.label}
                                        className="w-16 h-16 object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                    <span className={`text-xs font-bold ${trainerSprite === sprite.id ? 'text-emerald-400' : 'text-neutral-400'}`}>
                                        {sprite.label}
                                    </span>
                                    {trainerSprite === sprite.id && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === "title" && (
                        <div className="grid grid-cols-2 gap-2">
                            {TRAINER_TITLES.map(title => (
                                <button
                                    key={title}
                                    onClick={() => setTrainerTitle(title)}
                                    className={`py-3 px-4 rounded-xl border-2 font-bold text-sm text-left transition-all hover:scale-[1.02] active:scale-95 ${trainerTitle === title
                                        ? 'border-yellow-400 bg-yellow-500/10 text-yellow-300 shadow-lg shadow-yellow-500/10'
                                        : 'border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-neutral-500'
                                        }`}
                                >
                                    {trainerTitle === title && <span className="mr-2">⭐</span>}
                                    {title}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === "companion" && (
                        <div className="grid grid-cols-4 gap-3">
                            {COMPANION_POKEMON.map(pokemon => (
                                <button
                                    key={pokemon.id}
                                    onClick={() => setCompanionPokemon(pokemon.id)}
                                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${companionPokemon === pokemon.id
                                        ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                                        : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-500'
                                        }`}
                                >
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                                        alt={pokemon.name}
                                        className="w-14 h-14 object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                    <span className={`text-xs font-bold ${companionPokemon === pokemon.id ? 'text-purple-300' : 'text-neutral-400'}`}>
                                        {pokemon.name}
                                    </span>
                                    {companionPokemon === pokemon.id && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-900">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Done ✓
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
