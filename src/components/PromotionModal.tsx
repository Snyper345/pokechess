import { AnimatePresence, motion } from "motion/react";
import { Move } from "chess.js";

interface PromotionModalProps {
    isOpen: boolean;
    color: "w" | "b";
    onSelect: (promotion: "q" | "r" | "b" | "n") => void;
    onCancel: () => void;
}

export function PromotionModal({ isOpen, color, onSelect, onCancel }: PromotionModalProps) {
    // Pawns promote to their evolved forms: Pawniard -> Bisharp (625)
    // White pawniards are explicitly set to shiny, so their promotion will be shiny too
    const evolvedId = 625;
    const isShiny = color === 'w';

    const options: { type: "q" | "r" | "b" | "n", label: string }[] = [
        { type: "q", label: "Queen" },
        { type: "r", label: "Rook" },
        { type: "b", label: "Bishop" },
        { type: "n", label: "Knight" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        className="bg-neutral-900 border-2 border-emerald-600/50 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4"
                    >
                        <h2 className="text-2xl font-black text-white text-center mb-6">Promote to:</h2>

                        <div className="grid grid-cols-2 gap-4">
                            {options.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => onSelect(opt.type)}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-800 hover:bg-emerald-800 border border-neutral-700 hover:border-emerald-500 transition-all group"
                                >
                                    <div className="w-16 h-16 relative mb-2">
                                        <img
                                            src={`/sprites/static/${isShiny ? 'shiny/' : ''}${evolvedId}.png`}
                                            className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform"
                                            style={{ imageRendering: "pixelated" }}
                                            alt={opt.label}
                                        />
                                    </div>
                                    <span className="text-white font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onCancel}
                            className="mt-6 w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
