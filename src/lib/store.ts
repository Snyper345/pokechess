import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    // Master Volume & Audio
    volume: number;
    musicVolume: number;
    sfxVolume: number;
    muteInBackground: boolean;

    // Graphics
    resolutionScale: number;
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    enableBloom: boolean;
    enableSSAO: boolean;
    enableAA: boolean;
    fpsCap: number;

    // Camera & Controls
    cameraSensitivity: number;
    autoRotateCamera: boolean;
    animationSpeed: number;

    // Visuals & Effects
    enableParallax: boolean;
    enableScreenShake: boolean;
    enableParticles: boolean;

    // UI
    showCoordinates: boolean;
    highlightColor: string;
    enableHints: boolean;

    // Actions
    setVolume: (v: number) => void;
    setMusicVolume: (v: number) => void;
    setSfxVolume: (v: number) => void;
    toggleMuteInBackground: () => void;

    setResolutionScale: (v: number) => void;
    setShadowQuality: (q: 'off' | 'low' | 'medium' | 'high') => void;
    toggleBloom: () => void;
    toggleSSAO: () => void;
    toggleAA: () => void;
    setFpsCap: (v: number) => void;

    setCameraSensitivity: (v: number) => void;
    toggleAutoRotateCamera: () => void;
    setAnimationSpeed: (v: number) => void;

    toggleParallax: () => void;
    toggleScreenShake: () => void;
    toggleParticles: () => void;

    toggleShowCoordinates: () => void;
    setHighlightColor: (c: string) => void;
    toggleHints: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            volume: 0.5,
            musicVolume: 0.5,
            sfxVolume: 1.0,
            muteInBackground: true,

            resolutionScale: 1.0,
            shadowQuality: 'medium',
            enableBloom: true,
            enableSSAO: true,
            enableAA: false,
            fpsCap: 60,

            cameraSensitivity: 1.0,
            autoRotateCamera: false,
            animationSpeed: 1.0,

            enableParallax: true,
            enableScreenShake: false,
            enableParticles: true,

            showCoordinates: true,
            highlightColor: '#fbbf24',
            enableHints: false,

            setVolume: (v) => set({ volume: v }),
            setMusicVolume: (v) => set({ musicVolume: v }),
            setSfxVolume: (v) => set({ sfxVolume: v }),
            toggleMuteInBackground: () => set((state) => ({ muteInBackground: !state.muteInBackground })),

            setResolutionScale: (v) => set({ resolutionScale: v }),
            setShadowQuality: (q) => set({ shadowQuality: q }),
            toggleBloom: () => set((state) => ({ enableBloom: !state.enableBloom })),
            toggleSSAO: () => set((state) => ({ enableSSAO: !state.enableSSAO })),
            toggleAA: () => set((state) => ({ enableAA: !state.enableAA })),
            setFpsCap: (v) => set({ fpsCap: v }),

            setCameraSensitivity: (v) => set({ cameraSensitivity: v }),
            toggleAutoRotateCamera: () => set((state) => ({ autoRotateCamera: !state.autoRotateCamera })),
            setAnimationSpeed: (v) => set({ animationSpeed: v }),

            toggleParallax: () => set((state) => ({ enableParallax: !state.enableParallax })),
            toggleScreenShake: () => set((state) => ({ enableScreenShake: !state.enableScreenShake })),
            toggleParticles: () => set((state) => ({ enableParticles: !state.enableParticles })),

            toggleShowCoordinates: () => set((state) => ({ showCoordinates: !state.showCoordinates })),
            setHighlightColor: (c) => set({ highlightColor: c }),
            toggleHints: () => set((state) => ({ enableHints: !state.enableHints })),
        }),
        {
            name: 'pokechess-settings',
        }
    )
);

// ── Character Customization Store ──────────────────────────────────

export const TRAINER_SPRITES: { id: string; label: string; url: string }[] = [
    { id: 'red', label: 'Red', url: '/trainer_red.png' },
    { id: 'blue', label: 'Blue', url: '/trainer_blue.png' },
    { id: 'ace', label: 'Ace Trainer', url: '/trainers/ace.png' },
    { id: 'ranger', label: 'Ranger', url: '/trainers/ranger.png' },
    { id: 'lass', label: 'Lass', url: '/trainers/lass.png' },
    { id: 'youngster', label: 'Youngster', url: '/trainers/youngster.png' },
    { id: 'hiker', label: 'Hiker', url: '/trainers/hiker.png' },
    { id: 'rocket', label: 'Team Rocket', url: '/trainers/rocket.png' },
];

export const TRAINER_TITLES = [
    'Pokémon Trainer', 'Ace Trainer', 'Bug Catcher', 'Youngster',
    'Lass', 'Ranger', 'Champion', 'Gym Leader',
    'Elite Four', 'Pokémon Breeder', 'Pokémaniac', 'Cool Trainer',
];

export const COMPANION_POKEMON: { id: number; name: string }[] = [
    { id: 25, name: 'Pikachu' },
    { id: 133, name: 'Eevee' },
    { id: 1, name: 'Bulbasaur' },
    { id: 4, name: 'Charmander' },
    { id: 7, name: 'Squirtle' },
    { id: 150, name: 'Mewtwo' },
    { id: 384, name: 'Rayquaza' },
    { id: 249, name: 'Lugia' },
    { id: 151, name: 'Mew' },
    { id: 448, name: 'Lucario' },
    { id: 94, name: 'Gengar' },
    { id: 143, name: 'Snorlax' },
    { id: 571, name: 'Zoroark' },
    { id: 445, name: 'Garchomp' },
    { id: 6, name: 'Charizard' },
    { id: 376, name: 'Metagross' },
];

export interface CharacterData {
    trainerSprite: string;
    trainerTitle: string;
    companionPokemon: number;
}

interface CharacterState extends CharacterData {
    setTrainerSprite: (id: string) => void;
    setTrainerTitle: (title: string) => void;
    setCompanionPokemon: (id: number) => void;
    getCharacterData: () => CharacterData;
}

export const useCharacterStore = create<CharacterState>()(
    persist(
        (set, get) => ({
            trainerSprite: 'red',
            trainerTitle: 'Pokémon Trainer',
            companionPokemon: 25,

            setTrainerSprite: (id) => set({ trainerSprite: id }),
            setTrainerTitle: (title) => set({ trainerTitle: title }),
            setCompanionPokemon: (id) => set({ companionPokemon: id }),
            getCharacterData: () => ({
                trainerSprite: get().trainerSprite,
                trainerTitle: get().trainerTitle,
                companionPokemon: get().companionPokemon,
            }),
        }),
        {
            name: 'pokechess-character',
            // Validate stored values — if a companion was removed, reset to default
            merge: (persistedState: any, currentState: CharacterState) => {
                const merged = { ...currentState, ...persistedState };
                if (!COMPANION_POKEMON.find(p => p.id === merged.companionPokemon)) {
                    merged.companionPokemon = 25; // Reset to Pikachu
                }
                if (!TRAINER_SPRITES.find(s => s.id === merged.trainerSprite)) {
                    merged.trainerSprite = 'red'; // Reset to Red
                }
                return merged;
            },
        }
    )
);
