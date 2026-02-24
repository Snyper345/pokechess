/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChessBoard } from "@/components/ChessBoard";

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg text-center">
          <span className="text-yellow-400">POKÉ</span>CHESS
        </h1>
        <ChessBoard />
        <div className="text-neutral-500 text-sm text-center max-w-md">
          <p>White: Slowking (K), Gardevoir (Q), Alakazam (B), Gallade (N), Bastiodon (R), Pawniard (P)</p>
          <p className="mt-2">Black: Nidoking (K), Nidoqueen (Q), Gothitelle (B), Keldeo (N), Aggron (R), Pawniard (P)</p>
        </div>
      </div>
    </div>
  );
}
