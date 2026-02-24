import { Piece } from "./Piece";

interface CapturedPiecesProps {
  color: "w" | "b";
  captured: { type: string; color: string }[];
}

export function CapturedPieces({ color, captured }: CapturedPiecesProps) {
  return (
    <div className="flex flex-wrap gap-1 bg-black/20 p-2 rounded-lg min-h-[3rem] w-full max-w-md items-center">
      {captured.length === 0 && <span className="text-white/30 text-xs px-2">No captures yet</span>}
      {captured.map((piece, index) => (
        <div key={index} className="w-8 h-8 relative">
          <Piece type={piece.type} color={piece.color} />
        </div>
      ))}
    </div>
  );
}
