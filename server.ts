import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { Chess, Move } from "chess.js";
import http from "http";
import fs from "fs";
import path from "path";
import cors from "cors";
import { getAccount, updateElo, getLeaderboard } from "./db";

// Game State Management
interface CharacterData {
  trainerSprite: string;
  trainerTitle: string;
  companionPokemon: number;
}

interface GameState {
  chess: Chess;
  players: {
    w?: WebSocket;
    b?: WebSocket;
  };
  playerUsernames: {
    w?: string;
    b?: string;
  };
  playerCharacters: {
    w?: CharacterData;
    b?: CharacterData;
  };
  spectators: Set<WebSocket>;
}

const games = new Map<string, GameState>();

async function startServer() {
  const app = express();
  app.use(cors());
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // WebSocket Logic
  wss.on("connection", (ws) => {
    let currentRoom: string | null = null;
    let playerColor: "w" | "b" | "s" | null = null; // s for spectator

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "JOIN_ROOM") {
          const { roomId } = data;
          currentRoom = roomId;

          const charData: CharacterData | undefined = data.character ? {
            trainerSprite: data.character.trainerSprite || 'red',
            trainerTitle: data.character.trainerTitle || 'Pokémon Trainer',
            companionPokemon: data.character.companionPokemon || 25,
          } : undefined;

          let game = games.get(roomId);
          if (!game) {
            game = {
              chess: new Chess(),
              players: {},
              playerUsernames: {},
              playerCharacters: {},
              spectators: new Set(),
            };
            games.set(roomId, game);
          }

          // Assign color
          if (!game.players.w) {
            game.players.w = ws;
            game.playerUsernames.w = data.username || "Anonymous";
            game.playerCharacters.w = charData;
            playerColor = "w";
            getAccount(game.playerUsernames.w); // Init account
          } else if (!game.players.b) {
            game.players.b = ws;
            game.playerUsernames.b = data.username || "Anonymous";
            game.playerCharacters.b = charData;
            playerColor = "b";
            getAccount(game.playerUsernames.b); // Init account
          } else {
            game.spectators.add(ws);
            playerColor = "s";
          }

          // Determine opponent character for this player
          const opponentColor = playerColor === 'w' ? 'b' : 'w';
          const opponentChar = game.playerCharacters[opponentColor] || null;
          const opponentName = game.playerUsernames[opponentColor] || null;

          // Send initial state
          ws.send(JSON.stringify({
            type: "INIT_GAME",
            fen: game.chess.fen(),
            color: playerColor,
            history: game.chess.history({ verbose: true }),
            turn: game.chess.turn(),
            opponentCharacter: opponentChar,
            opponentUsername: opponentName,
          }));

          // Notify the existing player about their new opponent's character
          if (playerColor === 'b' && game.players.w && game.players.w.readyState === WebSocket.OPEN) {
            game.players.w.send(JSON.stringify({
              type: "OPPONENT_CHARACTER",
              character: charData,
              username: data.username || "Anonymous",
            }));
          } else if (playerColor === 'w' && game.players.b && game.players.b.readyState === WebSocket.OPEN) {
            game.players.b.send(JSON.stringify({
              type: "OPPONENT_CHARACTER",
              character: charData,
              username: data.username || "Anonymous",
            }));
          }
        }

        if (data.type === "MOVE") {
          if (!currentRoom || !playerColor || playerColor === "s") return;

          const game = games.get(currentRoom);
          if (!game) return;

          // Validate turn
          if (game.chess.turn() !== playerColor) return;

          try {
            const move = game.chess.move(data.move); // move is { from, to, promotion }

            // Broadcast update to everyone in room
            const update = JSON.stringify({
              type: "UPDATE_GAME",
              fen: game.chess.fen(),
              lastMove: move,
              history: game.chess.history({ verbose: true }),
              turn: game.chess.turn(),
            });

            if (game.players.w && game.players.w.readyState === WebSocket.OPEN) game.players.w.send(update);
            if (game.players.b && game.players.b.readyState === WebSocket.OPEN) game.players.b.send(update);
            game.spectators.forEach((spec) => {
              if (spec.readyState === WebSocket.OPEN) spec.send(update);
            });

            // AI OPPONENT TURN
            if (currentRoom.startsWith("ai") && game.chess.turn() === "b" && !game.chess.isGameOver()) {
              setTimeout(async () => {
                const moves = game.chess.moves({ verbose: true }) as Move[];
                if (moves.length > 0) {
                  const captures = moves.filter((m) => m.captured);
                  const aiMove = captures.length > 0
                    ? captures[Math.floor(Math.random() * captures.length)]
                    : moves[Math.floor(Math.random() * moves.length)];

                  game.chess.move(aiMove);

                  const aiUpdate = JSON.stringify({
                    type: "UPDATE_GAME",
                    fen: game.chess.fen(),
                    lastMove: aiMove,
                    history: game.chess.history({ verbose: true }),
                    turn: game.chess.turn(),
                  });

                  if (game.players.w && game.players.w.readyState === WebSocket.OPEN) game.players.w.send(aiUpdate);
                  game.spectators.forEach((spec) => {
                    if (spec.readyState === WebSocket.OPEN) spec.send(aiUpdate);
                  });
                  // Trash Talk
                  try {
                    const trashTalkPath = path.resolve(process.cwd(), "trash_talk.txt");
                    if (fs.existsSync(trashTalkPath)) {
                      const fileContent = fs.readFileSync(trashTalkPath, 'utf8');
                      const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                      if (lines.length > 0) {
                        const randomQuote = lines[Math.floor(Math.random() * lines.length)];
                        const talkStr = JSON.stringify({ type: "TRASH_TALK", text: randomQuote });
                        if (game.players.w && game.players.w.readyState === WebSocket.OPEN) game.players.w.send(talkStr);
                      }
                    }
                  } catch (e) {
                    console.error("Error reading trash talk:", e);
                  }

                  if (game.chess.isCheckmate()) {
                    const winnerColor = game.chess.turn() === 'w' ? 'b' : 'w';
                    const winnerName = winnerColor === 'w' ? game.playerUsernames.w : game.playerUsernames.b;
                    const loserName = winnerColor === 'w' ? game.playerUsernames.b : game.playerUsernames.w;
                    if (winnerName && loserName && winnerName !== "Anonymous" && loserName !== "Anonymous" && !currentRoom.startsWith("ai")) {
                      updateElo(winnerName, loserName);
                    }
                  }
                }
              }, 1000); // Let UI breathe before executing AI turn
            } else {
              if (game.chess.isCheckmate()) {
                const winnerColor = game.chess.turn() === 'w' ? 'b' : 'w';
                const winnerName = winnerColor === 'w' ? game.playerUsernames.w : game.playerUsernames.b;
                const loserName = winnerColor === 'w' ? game.playerUsernames.b : game.playerUsernames.w;
                if (winnerName && loserName && winnerName !== "Anonymous" && loserName !== "Anonymous" && !currentRoom.startsWith("ai")) {
                  updateElo(winnerName, loserName);
                }
              }
            }

          } catch (e) {
            // Invalid move
            ws.send(JSON.stringify({ type: "ERROR", message: "Invalid move" }));
          }
        }

        if (data.type === "SURRENDER") {
          if (!currentRoom || !playerColor || playerColor === "s") return;
          const game = games.get(currentRoom);
          if (game) {
            // You can't natively 'surrender' in chess.js without clearing, but we can just broadcast an update with the winner.
            const winner = playerColor === 'w' ? 'b' : 'w';

            const winnerName = winner === 'w' ? game.playerUsernames.w : game.playerUsernames.b;
            const loserName = winner === 'w' ? game.playerUsernames.b : game.playerUsernames.w;
            if (winnerName && loserName && winnerName !== "Anonymous" && loserName !== "Anonymous" && !currentRoom.startsWith("ai")) {
              updateElo(winnerName, loserName);
            }

            const update = JSON.stringify({
              type: "UPDATE_GAME",
              fen: game.chess.fen(),
              history: game.chess.history({ verbose: true }),
              turn: game.chess.turn(),
              isSurrender: true,
              winner: winner
            });
            if (game.players.w && game.players.w.readyState === WebSocket.OPEN) game.players.w.send(update);
            if (game.players.b && game.players.b.readyState === WebSocket.OPEN) game.players.b.send(update);
            game.spectators.forEach(s => {
              if (s.readyState === WebSocket.OPEN) s.send(update);
            });
          }
        }

        if (data.type === "RESET") {
          if (!currentRoom) return;
          const game = games.get(currentRoom);
          if (game) {
            game.chess.reset();
            const update = JSON.stringify({
              type: "UPDATE_GAME",
              fen: game.chess.fen(),
              history: [],
              turn: "w",
            });
            if (game.players.w && game.players.w.readyState === WebSocket.OPEN) game.players.w.send(update);
            if (game.players.b && game.players.b.readyState === WebSocket.OPEN) game.players.b.send(update);
            game.spectators.forEach(s => {
              if (s.readyState === WebSocket.OPEN) s.send(update);
            });
          }
        }

        if (data.type === "CHAT") {
          if (!currentRoom) return;
          const game = games.get(currentRoom);
          if (game) {
            let senderName = "Anonymous";
            if (playerColor === 'w') senderName = game.playerUsernames.w || "Anonymous";
            if (playerColor === 'b') senderName = game.playerUsernames.b || "Anonymous";
            if (playerColor === 's') senderName = "Spectator";

            const chatMsg = JSON.stringify({
              type: "CHAT",
              username: senderName,
              text: data.text
            });

            if (game.players.w && game.players.w.readyState === WebSocket.OPEN) game.players.w.send(chatMsg);
            if (game.players.b && game.players.b.readyState === WebSocket.OPEN) game.players.b.send(chatMsg);
            game.spectators.forEach(s => {
              if (s.readyState === WebSocket.OPEN) s.send(chatMsg);
            });
          }
        }

      } catch (e) {
        console.error("WS Error:", e);
      }
    });

    ws.on("close", () => {
      if (currentRoom) {
        const game = games.get(currentRoom);
        if (game) {
          if (game.players.w === ws) game.players.w = undefined;
          if (game.players.b === ws) game.players.b = undefined;
          game.spectators.delete(ws);

          // If empty, delete game? Maybe keep for a bit.
          if (!game.players.w && !game.players.b && game.spectators.size === 0) {
            games.delete(currentRoom);
          }
        }
      }
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/rooms", (req, res) => {
    const activeRooms = Array.from(games.entries())
      .filter(([id, g]) => !id.startsWith("ai") && (g.players.w || g.players.b))
      .map(([id, _]) => id);
    res.json({ rooms: activeRooms });
  });

  app.get("/api/leaderboard", (req, res) => {
    try {
      const lb = getLeaderboard();
      res.json({ leaderboard: lb });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
