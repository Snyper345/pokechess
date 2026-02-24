import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'pokechess.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
        username TEXT PRIMARY KEY,
        elo INTEGER DEFAULT 1200,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0
    );
`);

export interface Account {
    username: string;
    elo: number;
    wins: number;
    losses: number;
}

export const getAccount = (username: string): Account => {
    const stmt = db.prepare('SELECT * FROM accounts WHERE username = ?');
    let account = stmt.get(username) as Account | undefined;
    if (!account) {
        db.prepare('INSERT INTO accounts (username) VALUES (?)').run(username);
        account = { username, elo: 1200, wins: 0, losses: 0 };
    }
    return account;
};

export const updateElo = (winner: string, loser: string) => {
    const p1 = getAccount(winner);
    const p2 = getAccount(loser);

    // K-factor for rating volatility
    const K = 32;
    // Expected scores formula
    const expected1 = 1 / (1 + Math.pow(10, (p2.elo - p1.elo) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (p1.elo - p2.elo) / 400));

    // Player 1 wins -> Score = 1, Player 2 -> Score = 0
    const newElo1 = Math.round(p1.elo + K * (1 - expected1));
    const newElo2 = Math.round(p2.elo + K * (0 - expected2));

    db.prepare('UPDATE accounts SET elo = ?, wins = wins + 1 WHERE username = ?').run(newElo1, winner);
    db.prepare('UPDATE accounts SET elo = ?, losses = losses + 1 WHERE username = ?').run(newElo2, loser);
};

export const getLeaderboard = (): Account[] => {
    return db.prepare('SELECT * FROM accounts ORDER BY elo DESC LIMIT 20').all() as Account[];
};
