import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    volume: number;
    enableParallax: boolean;
    enableScreenShake: boolean;
    enableParticles: boolean;
    quality: 'high' | 'medium' | 'low';
    enableMusic: boolean;
    enableHints: boolean;
    setVolume: (v: number) => void;
    toggleParallax: () => void;
    toggleScreenShake: () => void;
    toggleParticles: () => void;
    setQuality: (q: 'high' | 'medium' | 'low') => void;
    toggleMusic: () => void;
    toggleHints: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            volume: 0.5,
            enableParallax: true,
            enableScreenShake: false, // Default off for comfort
            enableParticles: true,
            quality: 'high', // Default to high quality
            enableMusic: false, // Default off for comfort
            enableHints: false, // Default off

            setVolume: (v) => set({ volume: v }),
            toggleParallax: () => set((state) => ({ enableParallax: !state.enableParallax })),
            toggleScreenShake: () => set((state) => ({ enableScreenShake: !state.enableScreenShake })),
            toggleParticles: () => set((state) => ({ enableParticles: !state.enableParticles })),
            setQuality: (q) => set({ quality: q }),
            toggleMusic: () => set((state) => ({ enableMusic: !state.enableMusic })),
            toggleHints: () => set((state) => ({ enableHints: !state.enableHints })),
        }),
        {
            name: 'pokechess-settings',
        }
    )
);
