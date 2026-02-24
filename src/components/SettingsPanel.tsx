import {
    Settings, Volume2, MonitorPlay, Sparkles, X, Sun, Music, Brain
} from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);

    // Subscribe to store
    const {
        volume, setVolume,
        quality, setQuality,
        enableParticles, toggleParticles,
        enableScreenShake, toggleScreenShake,
        enableMusic, toggleMusic,
        enableHints, toggleHints
    } = useSettingsStore();

    return (
        <div className="absolute top-4 right-4 z-50">
            {/* Gear Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-3 bg-neutral-900/80 backdrop-blur-md rounded-full shadow-lg border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95"
            >
                <Settings size={28} />
            </button>

            {/* Slide-out Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-0 right-0 w-80 bg-neutral-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-emerald-500/20 bg-emerald-950/30">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="text-emerald-400" size={20} />
                                Settings
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-6">

                            {/* Volume Slider */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-neutral-200 text-sm font-medium">
                                    <Volume2 size={16} className="text-sky-400" />
                                    Master Volume
                                </label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-full accent-sky-500 hover:accent-sky-400 cursor-pointer"
                                />
                            </div>

                            <hr className="border-neutral-800" />

                            {/* Toggles */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                                    Visual Effects
                                </label>

                                <div className="space-y-2 mb-2">
                                    <label className="flex items-center gap-2 text-neutral-200 text-sm font-medium">
                                        <MonitorPlay size={16} className="text-emerald-400" />
                                        Graphics Quality
                                    </label>
                                    <div className="flex bg-neutral-800 rounded-lg p-1 gap-1">
                                        {(['low', 'medium', 'high'] as const).map(q => (
                                            <button
                                                key={q}
                                                onClick={() => setQuality(q)}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${quality === q
                                                    ? 'bg-emerald-500 text-white shadow-md'
                                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
                                                    }`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-neutral-500 ml-6">Adjusts shadows, postprocessing, & DPR.</p>
                                </div>

                                <ToggleItem
                                    icon={<Sparkles size={18} className="text-purple-400" />}
                                    label="Particle Explosions"
                                    checked={enableParticles}
                                    onChange={toggleParticles}
                                />
                                <ToggleItem
                                    icon={<span className="text-rose-400 font-bold px-1">📳</span>}
                                    label="Screen Shake"
                                    checked={enableScreenShake}
                                    onChange={toggleScreenShake}
                                />
                                <ToggleItem
                                    icon={<Music size={18} className="text-pink-400" />}
                                    label="Retro Battle Music"
                                    checked={enableMusic}
                                    onChange={toggleMusic}
                                />
                                <ToggleItem
                                    icon={<Brain size={18} className="text-cyan-400" />}
                                    label="Tool-Assisted Hints (White)"
                                    checked={enableHints}
                                    onChange={toggleHints}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
                    <span className="text-neutral-200 text-sm font-medium">{label}</span>
                </div>
                {description && <span className="text-neutral-500 text-xs mt-0.5 ml-7">{description}</span>}
            </div>

            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-neutral-700'}`}
            >
                <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
        </div>
    );
}
