import path from 'path';
import fs from 'fs';
​import { Database } from 'sqlite3';
import { Client } from 'discord.js';
import PokerUser from '../models/PokerUser';
import { Logger } from '../logs/Logger';

const db = new Database(path.resolve('src/data/db.sqlite'));

export const initializeUsers = async (): Promise<void> => {
    Logger.getInstance().log("Initializing users...", 1);
    const query = `SELECT * from users`;

    const filePath = path.resolve('src/data/db.sqlite');

    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        await new Promise<any[]>((resolve, reject) => {
            db.all(query, [], (err, rows: any[]) => {
                if (err) {
                    Logger.getInstance().log(`Error initializing users: ${err}`, 3);
                    reject(err);
                } else {
                    Logger.getInstance().log(`Initializing ${rows.length} users`, 1);
                    rows.forEach(row => {
                        if (PokerUser.findUserByUserId(row.user_id)) return;
                        new PokerUser(row.user_id, row.username, row.master_account, row.profileUrl, row.photo_id, row.firstname, row.lastname, row.age, row.verified, row.balance, row.debt, row.created_at);
                    });
                    resolve(rows);
                }
            });
        });

    } catch (error) {
        Logger.getInstance().log(`Database is not initialized, skipping. (ignore this if you are running the bot for the first time)`, 2);
    }
};

export const initializeDatabase = async (client: Client) => {
    Logger.getInstance().log("Initializing database...", 1);
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
                if (err) Logger.getInstance().log(`Error inserting or updating user: ${err}`, 3);
                else Logger.getInstance().log(`User created successfully: ${userId}`, 1);
            });

            new PokerUser(userId, unknown, unknown, unknown, unknown, unknown, unknown, 0, false, 0, 0, Date.now());
        }
    });

    Logger.getInstance().log("Database successfully synced!", 1);
};

export const syncUser = (user: PokerUser) => {
    const checkIfExistsQuery = "SELECT * FROM users WHERE user_id = ?";
    db.get(checkIfExistsQuery, [user.userId], (err, existingUser) => {
        if (err) {
            Logger.getInstance().log(`Error checking if user exists: ${err}`, 3);
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
                    Logger.getInstance().log(`Error updating user: ${updateErr}`, 3);
                } else {
                    Logger.getInstance().log(`User updated successfully: ${user.userId}`, 1);
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
                    Logger.getInstance().log(`Error inserting user: ${insertErr}`, 3);
                } else {
                    Logger.getInstance().log(`User inserted successfully: ${user.userId}`, 1);
                }
            });
        }
    });
};


export const syncUsers = () => {
    PokerUser.getUsers().forEach(user => {
        const query = `
        UPDATE users
        SET balance = ?, debt = ?
        WHERE user_id = ?`;
        db.run(query, [user.balance, user.debt, user.userId], (err) => {
            if (err) Logger.getInstance().log(`Error inserting or updating user: ${err}`, 3);
            else Logger.getInstance().log(`User synced successfully: ${user.userId}`, 1);
        });
    });
};