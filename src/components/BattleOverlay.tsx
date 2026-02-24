import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { battleEvent, BattlePayload } from "@/lib/events";
import { POKEMON_MAP } from "./Piece3D";
import { useSettingsStore } from "@/lib/store";
import { playSuperEffectiveSound, playNotVeryEffectiveSound } from "@/lib/audio";

// Sprite URL generator
const getSpriteUrl = (type: string, color: string, isAttacker: boolean, isEvolved?: boolean) => {
    let id = POKEMON_MAP[color]?.[type];
    if (isEvolved && type === 'q') id = color === 'w' ? 26 : 53;
    if (!id) return "";
    return isAttacker
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};

// Cry URL generator (latest format from PokeAPI uses pokemon-cries)
const getCryUrl = (type: string, color: string, isEvolved?: boolean) => {
    let id = POKEMON_MAP[color]?.[type];
    if (isEvolved && type === 'q') id = color === 'w' ? 26 : 53;
    if (!id) return "";
    return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
};

// Simple Type Advantage Logic based on POKEMON_MAP
const getEffectiveness = (attackerColor: string, attackerType: string, defenderColor: string, defenderType: string) => {
    // White: Psychic (b,q,k), Fire (n), Electric (p), Normal (r)
    // Black: Poison/Ghost/Ground (b,q,k), Fire (n), Normal (p), Rock/Ground (r)

    if (attackerColor === 'w') {
        // Psychic > Poison
        if (['b', 'q', 'k'].includes(attackerType) && ['b', 'q', 'k'].includes(defenderType)) return "It's super effective!";
        // Fire < Rock
        if (attackerType === 'n' && defenderType === 'r') return "It's not very effective...";
    } else {
        // Ghost > Psychic
        if (attackerType === 'b' && ['b', 'q', 'k'].includes(defenderType)) return "It's super effective!";
        // Ground > Fire
        if (['q', 'k', 'r'].includes(attackerType) && defenderType === 'n') return "It's super effective!";
        // Rock < Fighting/Ground (Snorlax is Normal, so neutral, but let's just leave it generic)
    }
    return "";
};

export function BattleOverlay() {
    const [battle, setBattle] = useState<BattlePayload | null>(null);
    const { volume } = useSettingsStore();

    useEffect(() => {
        const unsub = battleEvent.subscribe((payload) => {
            setBattle(payload);

            // Play the cry exactly when the hit lands (roughly 1.3 seconds into the 2.5s sequence)
            const cryUrl = getCryUrl(payload.defender.type, payload.defender.color, payload.defender.isEvolved);
            if (cryUrl && volume > 0) {
                setTimeout(() => {
                    const audio = new Audio(cryUrl);
                    audio.volume = volume;
                    audio.play().catch(e => console.error("Could not play cry:", e));

                    const msg = getEffectiveness(payload.attacker.color, payload.attacker.type, payload.defender.color, payload.defender.type);
                    if (msg.includes("super")) playSuperEffectiveSound();
                    else if (msg.includes("not very")) playNotVeryEffectiveSound();
                }, 1300); // 1.3s delay matches the '0.6' keyframe in taking the hit
            }

            // Automatically end the battle sequence after 2.5 seconds
            setTimeout(() => {
                setBattle(null);
            }, 2500);
        });
        return () => { unsub(); };
    }, [volume]);

    return (
        <AnimatePresence>
            {battle && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-50 overflow-hidden flex items-center justify-center pointer-events-none"
                >
                    {/* Background styling - classic pokemon battle gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-emerald-400 to-green-600" />

                    <div className="absolute top-0 w-full h-1/6 bg-black flex items-center justify-center pointer-events-none">
                        <motion.h2
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5, duration: 0.3 }}
                            className="text-white font-black text-4xl italic tracking-wider uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        >
                            {getEffectiveness(battle.attacker.color, battle.attacker.type, battle.defender.color, battle.defender.type)}
                        </motion.h2>
                    </div>
                    <div className="absolute bottom-0 w-full h-1/6 bg-black" />

                    {/* Defender (Top Right) */}
                    <motion.div
                        className="absolute right-1/4 top-1/4"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{
                            x: 0,
                            opacity: 1,
                            // At 1.5s, shake and disappear (when hit)
                            y: [0, 0, 0, -10, 10, -10, 10, 500],
                            scale: [1, 1, 1, 1, 1, 1, 1, 0]
                        }}
                        transition={{
                            duration: 2.2,
                            times: [0, 0.2, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9], // Timings for the hit reaction
                            ease: "easeOut"
                        }}
                    >
                        {/* Shadow oval */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/30 rounded-[100%]" />
                        <img
                            src={getSpriteUrl(battle.defender.type, battle.defender.color, false, battle.defender.isEvolved)}
                            alt="defender"
                            className="w-48 h-48 drop-shadow-2xl"
                            style={{ imageRendering: "pixelated" }}
                        />
                    </motion.div>

                    {/* Attacker (Bottom Left) */}
                    <motion.div
                        className="absolute left-1/4 bottom-1/4"
                        initial={{ x: -300, opacity: 0 }}
                        animate={{
                            x: [-300, 0, 0, 150, 0],  // Slide in, wait, lunge forward, return
                            opacity: 1
                        }}
                        transition={{
                            duration: 1.5,
                            times: [0, 0.3, 0.5, 0.65, 0.8], // Timings: enter by 0.3, wait till 0.5, hit at 0.65
                            ease: "easeInOut"
                        }}
                    >
                        {/* Shadow oval */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/30 rounded-[100%]" />
                        <img
                            src={getSpriteUrl(battle.attacker.type, battle.attacker.color, true, battle.attacker.isEvolved)}
                            alt="attacker"
                            className="w-64 h-64 drop-shadow-2xl"
                            style={{ imageRendering: "pixelated" }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
