import React from 'react';
import { Chess } from 'chess.js';

interface MiniMapProps {
    game: Chess;
    playerColor: 'w' | 'b';
}

export function MiniMap({ game, playerColor }: MiniMapProps) {
    const board = game.board();

    // game.board() returns top-to-bottom (rank 8 to rank 1). 
    // If we are black, we want rank 1 at the top of the minimap.
    const rows = playerColor === 'w' ? board : [...board].reverse();

    return (
        <div className="w-full aspect-square bg-neutral-900 border-2 border-orange-900/50 rounded-xl overflow-hidden shadow-2xl grid grid-rows-8 grid-cols-8 z-50 pointer-events-none opacity-90 backdrop-blur-sm shrink-0">
            {rows.map((row, rIndex) => {
                const cols = playerColor === 'w' ? row : [...row].reverse();
                return cols.map((square, cIndex) => {
                    const isBlackSquare = (rIndex + cIndex) % 2 === 1;
                    const bgColor = isBlackSquare ? 'bg-orange-950/60' : 'bg-orange-100/20';

                    let content = null;
                    if (square) {
                        const isWhite = square.color === 'w';
                        const dotColor = isWhite ? 'bg-white' : 'bg-zinc-950';
                        const ringColor = isWhite ? 'ring-1 ring-neutral-300' : 'ring-1 ring-neutral-700';
                        content = <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${dotColor} ${ringColor} shadow-sm`} />;
                    }

                    return (
                        <div key={`${rIndex}-${cIndex}`} className={`w-full h-full flex items-center justify-center ${bgColor}`}>
                            {content}
                        </div>
                    );
                });
            })}
        </div>
    );
}
