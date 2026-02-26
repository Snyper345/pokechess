import { Howl } from 'howler';
import { useSettingsStore } from './store';

// We'll keep a reference to bgm to manage it
let bgmHowl: Howl | null = null;
let intenseBgmHowl: Howl | null = null;
let isIntenseMode = false;
let audioContext: AudioContext | null = null;
let isPageVisible = true;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended' && isPageVisible) {
        audioContext.resume();
    }
    return audioContext;
};

// Handle visibility change for mute in background
if (typeof document !== 'undefined') {
    document.addEventListener("visibilitychange", () => {
        isPageVisible = document.visibilityState === "visible";
        const { muteInBackground } = useSettingsStore.getState();

        if (muteInBackground) {
            Howler.mute(!isPageVisible);
            if (!isPageVisible && audioContext?.state === 'running') {
                audioContext.suspend();
            } else if (isPageVisible && audioContext?.state === 'suspended') {
                audioContext.resume();
            }
        }
    });
}

// Helper to get total SFX volume
const getSfxVol = () => {
    const { volume, sfxVolume } = useSettingsStore.getState();
    return volume * sfxVolume;
};

// Helper to get total Music volume
const getMusicVol = () => {
    const { volume, musicVolume } = useSettingsStore.getState();
    return volume * musicVolume * 0.3; // Base scale for music
};

// Play a pokemon cry from PokeAPI
export const playPokemonCry = (pokemonId: number) => {
    const vol = getSfxVol();
    if (vol <= 0) return;

    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`;
    const sound = new Howl({
        src: [cryUrl],
        volume: vol * 0.5, // Cries can be loud
        format: ['ogg']
    });
    sound.play();
};

// Procedural SFX using Web Audio API for zero-dependency "juice"
export const playMoveSound = () => {
    const vol = getSfxVol();
    if (vol <= 0) return;
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
};

export const playCaptureSound = () => {
    const vol = getSfxVol();
    if (vol <= 0) return;
    const ctx = getAudioContext();

    // A heavier "crunch" for capturing
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(vol * 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

export const playCheckSound = () => {
    const vol = getSfxVol();
    if (vol <= 0) return;
    const ctx = getAudioContext();

    // Alarming "Ping" for check
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
};

export const playSuperEffectiveSound = () => {
    const vol = getSfxVol();
    if (vol <= 0) return;
    const ctx = getAudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(400, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(600, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
};

export const playNotVeryEffectiveSound = () => {
    const vol = getSfxVol();
    if (vol <= 0) return;
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

// Retro Battle Music
export const initBattleMusic = () => {
    const targetVol = getMusicVol();

    if (!bgmHowl) {
        bgmHowl = new Howl({
            src: ['https://play.pokemonshowdown.com/audio/hgss-johto-trainer.mp3'], // Standard Battle
            html5: true, // Stream for large files
            loop: true,
            volume: isIntenseMode ? 0 : targetVol,
            onloaderror: () => console.warn('Failed to load standard BGM'),
        });
        intenseBgmHowl = new Howl({
            src: ['https://play.pokemonshowdown.com/audio/bw-elite-four.mp3'], // Intense Battle
            html5: true,
            loop: true,
            volume: isIntenseMode ? targetVol : 0,
            onloaderror: () => console.warn('Failed to load intense BGM'),
        });
    }

    if (getAudioContext().state === 'suspended' && isPageVisible) {
        getAudioContext().resume();
    }

    if (!bgmHowl.playing()) bgmHowl.play();
    if (!intenseBgmHowl?.playing()) intenseBgmHowl?.play();
};

export const toggleBattleMusic = (play: boolean) => {
    if (play) {
        initBattleMusic();
    } else {
        if (bgmHowl) bgmHowl.pause();
        if (intenseBgmHowl) intenseBgmHowl.pause();
    }
};

export const setBgmIntensity = (intense: boolean) => {
    if (intense === isIntenseMode) return;
    isIntenseMode = intense;

    const targetVol = getMusicVol();

    if (bgmHowl && intenseBgmHowl) {
        if (intense) {
            bgmHowl.fade(targetVol, 0, 1000);
            intenseBgmHowl.fade(0, targetVol, 1000);
        } else {
            bgmHowl.fade(0, targetVol, 1000);
            intenseBgmHowl.fade(targetVol, 0, 1000);
        }
    }
}

// Listen to volume/music store changes
useSettingsStore.subscribe((state) => {
    const targetVol = state.volume * state.musicVolume * 0.3;
    if (bgmHowl && intenseBgmHowl) {
        if (isIntenseMode) {
            intenseBgmHowl.volume(targetVol);
            bgmHowl.volume(0);
        } else {
            bgmHowl.volume(targetVol);
            intenseBgmHowl.volume(0);
        }
    }

    // Handle mute logic sync
    if (!state.muteInBackground) {
        Howler.mute(false);
    } else {
        Howler.mute(!isPageVisible);
    }
});
