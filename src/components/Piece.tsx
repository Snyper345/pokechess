import { cn } from "@/lib/utils";

interface PieceProps {
  type: string; // 'p', 'n', 'b', 'r', 'q', 'k'
  color: string; // 'w', 'b'
  className?: string;
}

const POKEMON_MAP: Record<string, Record<string, number>> = {
  w: {
    p: 25, // Pikachu
    r: 143, // Snorlax
    n: 78, // Rapidash
    b: 65, // Alakazam
    q: 150, // Mewtwo
    k: 151, // Mew
  },
  b: {
    p: 52, // Meowth
    r: 76, // Golem
    n: 59, // Arcanine
    b: 94, // Gengar
    q: 31, // Nidoqueen
    k: 34, // Nidoking
  },
};

export function Piece({ type, color, className }: PieceProps) {
  const pokemonId = POKEMON_MAP[color]?.[type];

  if (!pokemonId) return null;

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

  return (
    <div className={cn("flex items-center justify-center w-full h-full", className)}>
      <img
        src={spriteUrl}
        alt={`${color === "w" ? "White" : "Black"} ${type}`}
        className="w-full h-full object-contain drop-shadow-md transition-transform hover:scale-110"
        draggable={false}
      />
    </div>
  );
}
