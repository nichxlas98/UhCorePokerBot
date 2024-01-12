import path from 'path';
import fs from 'fs';
​import { Database } from 'sqlite3';
import { Client } from 'discord.js';
import PokerUser from '../models/PokerUser';
import { LogManager } from '../managers/LogManager';
import PokerRoom from '../poker/PokerRoom';
import { formatTimestamp } from '../utils/MessageUtils';

interface Game {
    gameId: number;
    players: string;
    chatLogs: string,
    createdAt: Date;
}

interface PlayerStats {
    userId: string,
    wins: number,
    losses: number,
    winnings: number
}

const db = new Database(path.resolve('src/data/db.sqlite'));

export const initializeUsers = async (): Promise<void> => {
    LogManager.getInstance().log("Initializing users...", 1);
    const query = `SELECT * from users`;

    const filePath = path.resolve('src/data/db.sqlite');

    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        await new Promise<any[]>((resolve, reject) => {
            db.all(query, [], (err, rows: any[]) => {
                if (err) {
                    LogManager.getInstance().log(`Error initializing users: ${err}`, 3);
                    reject(err);
                } else {
                    LogManager.getInstance().log(`Initializing ${rows.length} users`, 1);
                    rows.forEach(row => {
                        if (PokerUser.findUserByUserId(row.user_id)) return;
                        new PokerUser(row.user_id, row.username, row.master_account, row.profileUrl, row.photo_id, row.firstname, row.lastname, row.age, row.verified, row.balance, row.debt, row.created_at);
                    });
                    resolve(rows);
                }
            });
        });

    } catch (error) {
        LogManager.getInstance().log(`Database is not initialized, skipping. (ignore this if you are running the bot for the first time)`, 2);
    }
}

export const initializeDatabase = async (client: Client) => {
    LogManager.getInstance().log("Initializing database...", 1);
    db.exec(fs.readFileSync(path.resolve('src/data/db.sql')).toString());

    const guild = await client.guilds.fetch(process.env.guildId);
    guild.members.cache.forEach(member => {
        if (!(PokerUser.findUserByUserId(member.user.id))) {
            const query = `
            INSERT INTO users (user_id, username, master_account, profile_url, photo_id, firstname, lastname, age, verified, balance, debt, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const userId = member.user.id;
            const unknown = 'Unknown';
            db.run(query, [userId, unknown, unknown, unknown, unknown, unknown, unknown, 0, false, 0, 0, Date.now()], (err) => {
                if (err) LogManager.getInstance().log(`Error inserting or updating user: ${err}`, 3);
                else LogManager.getInstance().log(`User created successfully: ${userId}`, 1);
            });

            new PokerUser(userId, unknown, unknown, unknown, unknown, unknown, unknown, 0, false, 0, 0, Date.now());
        }
    });

    LogManager.getInstance().log("Database successfully synced!", 1);
}

export const syncUser = (user: PokerUser) => {
    const checkIfExistsQuery = "SELECT * FROM users WHERE user_id = ?";
    db.get(checkIfExistsQuery, [user.userId], (err, existingUser) => {
        if (err) {
            LogManager.getInstance().log(`Error checking if user exists: ${err}`, 3);
            return;
        }

        if (existingUser) {
            // User exists, update
            const updateQuery = `UPDATE users SET 
                username = ?, master_account = ?, profile_url = ?, photo_id = ?, 
                firstname = ?, lastname = ?, age = ?, verified = ?, 
                balance = ?, debt = ?, created_at = ? WHERE user_id = ?`;

            const profileUrl = user.profileUrl || 'default_profile_url';

            db.run(updateQuery, [
                user.userName, user.masterAccount, profileUrl, user.photoId,
                user.firstName, user.lastName, user.age, user.verified,
                user.balance, user.debt, user.createdAt, user.userId
            ], (updateErr) => {
                if (updateErr) {
                    LogManager.getInstance().log(`Error updating user: ${updateErr}`, 3);
                } else {
                    LogManager.getInstance().log(`User updated successfully: ${user.userId}`, 1);
                }
            });
        } else {
            // User does not exist, insert
            const insertQuery = `INSERT INTO users (
                user_id, username, master_account, profile_url, photo_id, 
                firstname, lastname, age, verified, balance, debt, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(insertQuery, [
                user.userId, user.userName, user.masterAccount, user.profileUrl, user.photoId,
                user.firstName, user.lastName, user.age, user.verified,
                user.balance, user.debt, user.createdAt
            ], (insertErr) => {
                if (insertErr) {
                    LogManager.getInstance().log(`Error inserting user: ${insertErr}`, 3);
                } else {
                    LogManager.getInstance().log(`User inserted successfully: ${user.userId}`, 1);
                }
            });
        }
    });
}


export const syncUsers = () => {
    PokerUser.getUsers().forEach(user => {
        const query = `
        UPDATE users
        SET balance = ?, debt = ?
        WHERE user_id = ?`;
        db.run(query, [user.balance, user.debt, user.userId], (err) => {
            if (err) LogManager.getInstance().log(`Error inserting or updating user: ${err}`, 3);
            else LogManager.getInstance().log(`User synced successfully: ${user.userId}`, 1);
        });
    });
}

export const getGameList = (): Promise<string[]> => {
    const query = 'SELECT game_id, created_at FROM games';

    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                LogManager.getInstance().log('Error getting game list.', 3);
                reject(err);
            } else {
                const gameList = rows.map((row: any) => {
                    const formattedDate = formatTimestamp(parseFloat(row.created_at));
                    return `${row.game_id} - ${formattedDate}`;
                });
                resolve(gameList);
            }
        });
    });
}

export const loadGame = async (gameId: string): Promise<Game | null> => {
    const query = 'SELECT * FROM games WHERE game_id = ?';

    try {
        const existingGame: any = await new Promise((resolve, reject) => {
            db.get(query, [gameId], (err, result) => {
                if (err) {
                    LogManager.getInstance().log('Error checking if game exists.', 3);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        if (existingGame) {
            const game: Game = {
                gameId: existingGame.game_id,
                players: existingGame.players,
                chatLogs: existingGame.chat_logs,
                createdAt: existingGame.created_at
            };
            return game;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error loading game:', error);
        return null;
    }
};


export const saveGame = (table: PokerRoom) => {
    const query = `INSERT INTO games (game_id, players, chat_logs, created_at) VALUES (?, ?, ?, ?)`;

    const currentTimestamp = Date.now();
    const currentDate = new Date(currentTimestamp);

    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const year = currentDate.getUTCFullYear();
    const hours = String(currentDate.getUTCHours()).padStart(2, '0');

    const dateString = `${day}-${month}-${year}-${hours}`;


    const logs = `${dateString}-${table.gameId}`;
    const filePath = path.resolve(`./src/data/games/${logs}.json`);
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(table.chatManager.getGameChat().asArray()));

    db.run(query, [table.gameId, table.players.toString(), logs, Date.now()], (err) => {
        if (err) LogManager.getInstance().log(`Error inserting or updating game: ${err}`, 3);
        else LogManager.getInstance().log(`Game created successfully: ${table.gameId}`, 1);
    });
}

export const getStats = (userId: string): Promise<PlayerStats | null> => {
    const query = 'SELECT * FROM gamestats WHERE user_id = ?';

    return new Promise((resolve, reject) => {
        db.get(query, [userId], (err, existingUser: any) => {
            if (err) {
                LogManager.getInstance().log(`Error checking if user exists: ${err}`, 3);
                reject(err);
            } else if (existingUser) {
                const playerStats: PlayerStats = {
                    userId: existingUser.user_id,
                    wins: existingUser.wins,
                    losses: existingUser.losses,
                    winnings: existingUser.winnings
                };

                resolve(playerStats);
            } else {
                resolve(null);
            }
        });
    });
}

export const saveStats = async (userId: string, winOrLoss: boolean, winnings?: number): Promise<void> => {
    const checkIfExistsQuery = "SELECT * FROM gamestats WHERE user_id = ?";
    
    try {
        const existingUser: any = await new Promise((resolve, reject) => {
            db.get(checkIfExistsQuery, [userId], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });

        if (!existingUser) {
            // User does not exist, insert
            const insertQuery = 'INSERT INTO gamestats (user_id, wins, losses, winnings) VALUES (?, ?, ?, ?)';
            await new Promise<void>((resolve, reject) => {
                db.run(insertQuery, [userId, winOrLoss ? 1 : 0, winOrLoss ? 0 : 1, winnings], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        LogManager.getInstance().log(`Stats created successfully: ${userId}`, 1);
                        resolve();
                    }
                });
            });
        } else {
            // User exists, update
            const updateQuery = 'UPDATE gamestats SET wins = ?, losses = ?, winnings = ? WHERE user_id = ?';

            const wins = winOrLoss ? existingUser.wins + 1 : existingUser.wins;
            const losses = winOrLoss ? existingUser.losses : existingUser.losses + 1;
            const totalWinnings = (existingUser.winnings || 0) + (winnings || 0);

            await new Promise<void>((resolve, reject) => {
                db.run(updateQuery, [wins, losses, totalWinnings, userId], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        LogManager.getInstance().log(`Stats updated successfully: ${userId}`, 1);
                        resolve();
                    }
                });
            });
        }

        // Resolve the Promise if successful
        return Promise.resolve();
    } catch (error) {
        // Log the error and reject the Promise
        LogManager.getInstance().log(`Error saving stats: ${error}`, 3);
        return Promise.reject(error);
    }
};

export const saveCards = async (cards: string[], cardUrl: string): Promise<void> => {
    const checkIfExistsQuery = "SELECT * FROM saved_cards WHERE cards_string = ?";

    const cardsAsString = cards.toString();

    try {
        const existingCards: any = await new Promise((resolve, reject) => {
            db.get(checkIfExistsQuery, [cardsAsString], (err, cards) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(cards);
            });
        });

        if (!existingCards) {
            // Cards do not exist, insert
            const insertQuery = 'INSERT INTO saved_cards (cards_string, cards_url) VALUES (?, ?)';
            await new Promise<void>((resolve, reject) => {
                db.run(insertQuery, [cardsAsString, cardUrl], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        LogManager.getInstance().log(`Cards created successfully: ${cardsAsString}`, 1);
                        resolve();
                    }
                });
            });
        }

        // Resolve the Promise if successful
        Promise.resolve();
    } catch (error) {
        // Log the error and reject the Promise
        LogManager.getInstance().log(`Error saving cards: ${error}`, 3);
        Promise.reject(error);
    }
}

export const getCardsUrl = async (cards: string[]): Promise<string> | null => {
    const cardsAsString = cards.toString();

    return new Promise((resolve, reject) => {
        const query = 'SELECT card_url FROM saved_cards WHERE cards_string = ?';

        db.get(query, [cardsAsString], (err, row: any) => {
            if (err) {
                reject(err);
            }

            if (row) {
                resolve(row.cards_url);
                return;
            }
            
            resolve(null);
        });
    })
}