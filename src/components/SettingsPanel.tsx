import {
    Settings, Volume2, MonitorPlay, Sparkles, X, Music, Brain, Camera, Layers, AppWindow, Speaker
} from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);

    // Subscribe to store
    const store = useSettingsStore();

    return (
        <>
            <div className="absolute top-4 right-4 z-50">
                {/* Gear Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-3 bg-neutral-900/80 backdrop-blur-md rounded-full shadow-lg border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95"
                >
                    <Settings size={28} />
                </button>
            </div>

            {/* Centered Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-neutral-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-emerald-500/20 bg-emerald-950/30 shrink-0 z-10">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Settings className="text-emerald-400" size={20} />
                                    Settings
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-neutral-400 hover:text-white transition-colors p-1"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-5 flex flex-col gap-8 overflow-y-auto custom-scrollbar pb-10">

                                {/* AUDIO SECTION */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                                        <Volume2 size={14} /> Audio
                                    </h3>
                                    <SliderItem label="Master Volume" value={store.volume} onChange={store.setVolume} min={0} max={1} step={0.05} />
                                    <SliderItem label="Music Volume" value={store.musicVolume} onChange={store.setMusicVolume} min={0} max={1} step={0.05} />
                                    <SliderItem label="SFX Volume" value={store.sfxVolume} onChange={store.setSfxVolume} min={0} max={1} step={0.05} />
                                    <ToggleItem label="Mute in Background" checked={store.muteInBackground} onChange={store.toggleMuteInBackground} icon={<Speaker size={16} className="text-sky-500" />} />
                                </section>

                                {/* GRAPHICS SECTION */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                                        <MonitorPlay size={14} /> Graphics & Display
                                    </h3>

                                    <SliderItem label={`Resolution Scale (${Math.round(store.resolutionScale * 100)}%)`} value={store.resolutionScale} onChange={store.setResolutionScale} min={0.5} max={2.0} step={0.1} />

                                    <div className="space-y-2">
                                        <label className="text-neutral-300 text-sm font-medium">Shadow Quality</label>
                                        <div className="flex bg-neutral-800 rounded-lg p-1 gap-1">
                                            {(['off', 'low', 'medium', 'high'] as const).map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => store.setShadowQuality(q)}
                                                    className={`flex-1 py-1 text-xs font-bold rounded-md capitalize transition-colors ${store.shadowQuality === q ? 'bg-emerald-500 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'}`}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-neutral-300 text-sm font-medium">FPS Limit</label>
                                        <div className="flex bg-neutral-800 rounded-lg p-1 gap-1">
                                            {[30, 60, 144, 0].map(fps => (
                                                <button
                                                    key={fps}
                                                    onClick={() => store.setFpsCap(fps)}
                                                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${store.fpsCap === fps ? 'bg-emerald-500 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'}`}
                                                >
                                                    {fps === 0 ? 'Uncapped' : fps}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <ToggleItem label="Bloom (Glow)" checked={store.enableBloom} onChange={store.toggleBloom} icon={<Sparkles size={16} className="text-emerald-500" />} />
                                    <ToggleItem label="Ambient Occlusion (SSAO)" checked={store.enableSSAO} onChange={store.toggleSSAO} icon={<Layers size={16} className="text-emerald-500" />} />
                                    <ToggleItem label="Anti-Aliasing (FXAA)" checked={store.enableAA} onChange={store.toggleAA} icon={<MonitorPlay size={16} className="text-emerald-500" />} />
                                </section>

                                {/* CAMERA & CONTROLS SECTION */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                                        <Camera size={14} /> Camera & Controls
                                    </h3>
                                    <SliderItem label={`Camera Sensitivity (${store.cameraSensitivity.toFixed(1)}x)`} value={store.cameraSensitivity} onChange={store.setCameraSensitivity} min={0.1} max={2.0} step={0.1} />
                                    <SliderItem label={`Animation Speed (${store.animationSpeed.toFixed(1)}x)`} value={store.animationSpeed} onChange={store.setAnimationSpeed} min={0.5} max={2.0} step={0.1} />
                                    <ToggleItem label="Auto-Rotate Camera" checked={store.autoRotateCamera} onChange={store.toggleAutoRotateCamera} icon={<Camera size={16} className="text-rose-500" />} />
                                </section>

                                {/* EFFECTS & UI SECTION */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                                        <AppWindow size={14} /> UI & Game Effects
                                    </h3>
                                    <ToggleItem label="Show Board Coordinates" checked={store.showCoordinates} onChange={store.toggleShowCoordinates} icon={<AppWindow size={16} className="text-purple-500" />} />
                                    <ToggleItem label="3D Menu Parallax" checked={store.enableParallax} onChange={store.toggleParallax} icon={<Layers size={16} className="text-purple-500" />} />
                                    <ToggleItem label="Particle Explosions" checked={store.enableParticles} onChange={store.toggleParticles} icon={<Sparkles size={16} className="text-purple-500" />} />
                                    <ToggleItem label="Screen Shake" checked={store.enableScreenShake} onChange={store.toggleScreenShake} icon={<span className="text-purple-500 font-bold px-1 text-xs">📳</span>} />
                                    <ToggleItem label="Tool-Assisted Hints (White)" checked={store.enableHints} onChange={store.toggleHints} icon={<Brain size={16} className="text-purple-500" />} />

                                    <div className="space-y-2">
                                        <label className="text-neutral-300 text-sm font-medium">Highlight Color</label>
                                        <div className="flex gap-2 pb-4">
                                            {['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => store.setHighlightColor(color)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-transform ${store.highlightColor === color ? 'scale-110 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-105'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </section>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

// Reusable Slider component
function SliderItem({ label, value, onChange, min, max, step }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number }) {
    return (
        <div className="space-y-2">
            <label className="flex items-center justify-between text-neutral-300 text-sm font-medium">
                {label}
            </label>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 hover:accent-emerald-400 cursor-pointer"
            />
        </div>
    );
}

// Reusable toggle switch component
function ToggleItem({ label, description, checked, onChange, icon }: { label: string, description?: string, checked: boolean, onChange: () => void, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-neutral-300 text-sm font-medium lg:whitespace-nowrap">{label}</span>
                </div>
                {description && <span className="text-neutral-500 text-xs mt-0.5 ml-7">{description}</span>}
            </div>

            <button
                onClick={onChange}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-neutral-700'}`}
            >
                <span className={`${checked ? 'translate-x-4' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`} />
            </button>
        </div>
    );
}
